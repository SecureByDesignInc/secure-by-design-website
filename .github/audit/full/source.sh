#!/usr/bin/env bash
# Source-side checks: dependency advisories, outdated packages, build output, secrets, spelling, document metadata.
set -u
OUT=audit-results/full/source; mkdir -p "$OUT"
pnpm install --frozen-lockfile > "$OUT/install.txt" 2>&1 || echo "install failed" >> "$OUT/install.txt"
pnpm audit --json > "$OUT/pnpm-audit.json" 2>/dev/null; pnpm audit > "$OUT/pnpm-audit.txt" 2>&1; pnpm audit --prod > "$OUT/pnpm-audit-prod.txt" 2>&1
pnpm outdated --long > "$OUT/outdated.txt" 2>&1
pnpm build > "$OUT/build.txt" 2>&1; echo "build exit $?" >> "$OUT/build.txt"
node --test tests/*.test.mjs > "$OUT/tests.txt" 2>&1; echo "tests exit $?" >> "$OUT/tests.txt"
for s in scripts/check-*.mjs; do echo "== $s"; node "$s" 2>&1 | tail -5; echo "exit $?"; done > "$OUT/content-checks.txt" 2>&1
{
echo "== source maps in dist"; find dist -name '*.map' | head -20
echo "== client bundle totals"; for e in js css; do printf '%s: ' $e; find dist/client -name "*.$e" -printf '%s\n' | awk '{s+=$1; n++} END {printf "%d files, %.0f KB\n", n, s/1024}'; done
echo "== largest client files"; find dist/client -type f -printf '%s\t%p\n' | sort -rn | head -40
echo "== references in client bundle"; grep -rlE 'execute-api|chatgpt\.site|userjot' dist/client | head; grep -rhoE 'https://[a-z0-9.-]*execute-api[a-z0-9./-]*|https://[a-z0-9.-]*chatgpt\.site' dist/client | sort -u | head
echo "== secret-looking strings in client bundle and public/"; grep -rhoE 're_[A-Za-z0-9_]{24,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk_live_[0-9a-zA-Z]{20,}|ghp_[0-9A-Za-z]{30,}|xox[baprs]-[0-9A-Za-z-]{10,}' dist/client public | sort -u | head
echo "== server bundle size"; du -sh dist/server 2>/dev/null
} > "$OUT/dist.txt" 2>&1
curl -sSL https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_x64.tar.gz | tar xz -C /tmp gitleaks
/tmp/gitleaks detect --source . --redact --no-banner --report-format json --report-path "$OUT/gitleaks-history.json" > "$OUT/gitleaks.txt" 2>&1
/tmp/gitleaks detect --source public --no-git --redact --no-banner --report-format json --report-path "$OUT/gitleaks-public.json" >> "$OUT/gitleaks.txt" 2>&1
/tmp/gitleaks detect --source dist/client --no-git --redact --no-banner --report-format json --report-path "$OUT/gitleaks-dist.json" >> "$OUT/gitleaks.txt" 2>&1
pip install -q codespell==2.3.0 2>/dev/null
codespell --count -S "*.min.js,*/vendor/*,*.svg,*.png,*.webp,*.lock,pnpm-lock.yaml,node_modules,dist,.git,archive,*.zip,*.pdf,*.docx,*.woff2,three*.js" content app components lib server public/training public/inside-network-model public/*.js public/*.mjs > "$OUT/codespell-source.txt" 2>&1
sudo apt-get install -y -qq poppler-utils > /dev/null 2>&1
mkdir -p /tmp/pdftext
{
for f in $(find public -name '*.pdf' | sort); do echo "== $f ($(stat -c %s "$f") bytes)"; pdfinfo "$f" 2>&1 | grep -E '^(Title|Author|Creator|Producer|Pages|Tagged|Page size|CreationDate|ModDate|Encrypted)'; pdftotext "$f" "/tmp/pdftext/$(basename "$f" .pdf).txt"; pdffonts "$f" 2>/dev/null | tail -n +3 | awk '{print $1, $NF}' | sort -u | head -5 | sed 's/^/  font: /'; done
} > "$OUT/pdf.txt"
codespell --count /tmp/pdftext > "$OUT/codespell-pdf.txt" 2>&1
{
for f in $(find public -name '*.docx' | sort); do echo "== $f ($(stat -c %s "$f") bytes)"; unzip -p "$f" docProps/core.xml 2>/dev/null | sed 's/></>\n</g' | grep -E 'dc:creator|lastModifiedBy|dc:title|dcterms:created|dcterms:modified|cp:revision'; unzip -p "$f" docProps/app.xml 2>/dev/null | grep -oE '<(Application|Company|Pages|Words)>[^<]*' | sed 's/^/  /'; done
} > "$OUT/docx.txt"
{
z=public/training/dc01-dc02/SecureByDesign-DC01-DC02-Learning-Package.zip
echo "== $z"; unzip -l "$z"
echo "== stray entries"; unzip -Z1 "$z" | grep -E '__MACOSX|\.DS_Store|Thumbs\.db|~\$' || echo none
python3 - "$z" public/training/dc01-dc02/package-manifest.json <<'PY'
import sys, json, zipfile, hashlib, os
z = zipfile.ZipFile(sys.argv[1]); m = json.load(open(sys.argv[2]))
files = m.get('files') or m.get('contents') or []
print('manifest keys:', list(m.keys())[:12], '| entries:', len(files))
names = {os.path.basename(n): n for n in z.namelist()}
bad = 0
for f in files:
    p = f.get('path') or f.get('name') or f.get('file'); h = f.get('sha256') or f.get('hash')
    if not p or not h: continue
    n = next((x for x in z.namelist() if x.endswith(p)), None)
    if not n: print('missing in zip:', p); bad += 1; continue
    got = hashlib.sha256(z.read(n)).hexdigest()
    pub = os.path.join('public/training/dc01-dc02', os.path.basename(p))
    pubh = hashlib.sha256(open(pub, 'rb').read()).hexdigest() if os.path.exists(pub) else None
    if got != h or (pubh and pubh != h): print('mismatch:', p, 'zip ok' if got == h else 'zip differs', '| public ok' if pubh == h else ('| public differs' if pubh else '| not in public')); bad += 1
print('manifest problems:', bad)
PY
} > "$OUT/package.txt" 2>&1
{
echo "== images in public (bytes, dimensions)"; find public -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.gif' -o -iname '*.svg' \) -printf '%s\t%p\n' | sort -rn | head -30 | while IFS=$'\t' read s p; do echo "$s $p $(file -b "$p" | grep -oE '[0-9]+ ?x ?[0-9]+' | head -1)"; done
} > "$OUT/images.txt"
echo done
