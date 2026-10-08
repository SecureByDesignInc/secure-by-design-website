#!/usr/bin/env bash
# Read-only security checks against securebydesigninc.com: headers, CORS, unauthenticated API answers,
# exposed files, methods, TLS, DNS/email authentication, subdomains, alternate hosts.
set -u
OUT=audit-results/full/security; mkdir -p "$OUT"
S=https://securebydesigninc.com
UA='Mozilla/5.0 (X11; Linux x86_64) SBD-site-audit'
home=$(curl -sS -A "$UA" "$S/")
assets=$(echo "$home" | grep -oE '(src|href)="/[^"]+\.(js|css)"' | sed -E 's/^(src|href)="//; s/"$//' | sort -u | head -6)
echo "$assets" > "$OUT/assets-sampled.txt"
{
for u in / /training /training/dns-configuration /inside-the-network /inside-network-model/model.html /my-progress /privacy "/app-sign-in?challenge=x" /training/dc01-dc02/index.html /training/rmf/index.html /training/dns-configuration/SecureByDesign-dns-configuration-Workbook.pdf /sitemap.xml /robots.txt /favicon.svg /brand-lock.svg /api/sign-in/providers /no-such-page-audit $assets; do
  echo "=== $u"; curl -sS -A "$UA" -o /dev/null -D - -H 'Accept-Encoding: br, gzip' "$S$u" | tr -d '\r'
done
} > "$OUT/headers.txt"

{
for u in /api/sign-in/providers /api/reader-progress /api/reader-auth/signin /api/native-auth/signin /api/resource-signups /api/career-submissions /api/community-contributions /api/native-progress; do
  echo "=== GET $u with Origin https://evil.example"; curl -sS -o /dev/null -D - -H 'Origin: https://evil.example' "$S$u" | tr -d '\r' | grep -iE '^(HTTP|access-control|vary)'
  echo "=== OPTIONS $u"; curl -sS -o /dev/null -D - -X OPTIONS -H 'Origin: https://evil.example' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type' "$S$u" | tr -d '\r' | grep -iE '^(HTTP|access-control|allow)'
done
} > "$OUT/cors.txt"

{
for u in /api/sign-in/providers /api/sign-in/methods /api/reader-auth/session /api/reader-progress /api/native-auth/session /api/native-progress /api/native-activity /api/native-onboarding /api/community-contributions /api/resource-signups /api/resource-subscribers /api/resource-preferences /api/career-submissions /api/career-records /api/career-notifications /career-records /career-records/x /resource-preferences; do
  printf '%s -> ' "$u"; curl -sS -o /tmp/b -w '%{http_code} %{content_type} %{size_download}B' "$S$u"; printf ' | %s\n' "$(head -c 220 /tmp/b | tr '\n\r' '  ')"
done
} > "$OUT/api-unauth.txt"

{
for p in /.git/HEAD /.git/config /.env /.env.example /.dev.vars /package.json /pnpm-lock.yaml /wrangler.json /wrangler.toml /dist/server/wrangler.json /server/index.js /server/reader-auth.js /index.js /.openai/hosting.json /AGENTS.md /README.md /CLAUDE.md /archive/security-journal-2026-10-04.zip /drizzle/0011_sign_in_methods.sql /db/schema.ts /content/membership-plans.json /content/configuration-courses.json /.DS_Store /.well-known/security.txt /security.txt /.well-known/change-password /admin /wp-admin/ /wp-login.php /phpinfo.php /server-status /api /api/ /assets/ /build-info.json /cdn-cgi/trace /training/ /training/dc01-dc02/ /inside-network-model/; do
  printf '%-45s ' "$p"; curl -sS -o /tmp/b -w '%{http_code} %{content_type} %{size_download}B' "$S$p"; printf ' | %s\n' "$(head -c 120 /tmp/b | tr '\n\r' '  ')"
done
echo "--- source maps for sampled assets"
for a in $assets; do printf '%s.map -> ' "$a"; curl -sS -o /dev/null -w '%{http_code} %{size_download}B\n' "$S$a.map"; done
} > "$OUT/exposure.txt"

{
for m in TRACE PUT DELETE PATCH OPTIONS; do echo "$m / -> $(curl -sS -o /dev/null -w '%{http_code}' -X $m "$S/")"; done
echo "http version: $(curl -sS -o /dev/null -w '%{http_version}' --http2 "$S/")"
echo "alt-svc: $(curl -sSI "$S/" | tr -d '\r' | grep -i '^alt-svc' || echo none)"
for enc in br gzip; do echo "html encoding ($enc): $(curl -sS -o /dev/null -D - -H "Accept-Encoding: $enc" "$S/" | tr -d '\r' | grep -i '^content-encoding' || echo none)"; done
echo "--- certificate"; echo | openssl s_client -connect securebydesigninc.com:443 -servername securebydesigninc.com 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
echo "--- www certificate"; echo | openssl s_client -connect www.securebydesigninc.com:443 -servername www.securebydesigninc.com 2>/dev/null | openssl x509 -noout -subject -issuer -dates
} > "$OUT/transport.txt"

{
for t in A AAAA NS MX TXT CAA SOA; do echo "== securebydesigninc.com $t"; dig +short securebydesigninc.com $t; done
echo "== www"; dig +short www.securebydesigninc.com
for n in _dmarc.securebydesigninc.com notify.securebydesigninc.com send.notify.securebydesigninc.com _dmarc.notify.securebydesigninc.com resend._domainkey.notify.securebydesigninc.com resend._domainkey.securebydesigninc.com _mta-sts.securebydesigninc.com _smtp._tls.securebydesigninc.com; do
  echo "== $n"; echo "TXT: $(dig +short $n TXT | tr '\n' ' ')"; echo "MX: $(dig +short $n MX | tr '\n' ' ')"; echo "CNAME: $(dig +short $n CNAME | tr '\n' ' ')"
done
echo "== DNSSEC DS (parent)"; dig +short securebydesigninc.com DS @1.1.1.1
echo "== DNSKEY"; dig +short securebydesigninc.com DNSKEY @1.1.1.1 | head -3
echo "== AD flag via 1.1.1.1"; dig +dnssec securebydesigninc.com A @1.1.1.1 | grep -E 'flags:'
} > "$OUT/dns.txt"

curl -sS --max-time 120 'https://crt.sh/?q=%25.securebydesigninc.com&output=json' -o /tmp/crt.json || echo '[]' > /tmp/crt.json
python3 - > "$OUT/subdomains.txt" <<'PY'
import json, subprocess, collections
try: data = json.load(open('/tmp/crt.json'))
except Exception as e: print('crt.sh unavailable', e); raise SystemExit
names = sorted({n.strip().lower() for d in data for n in d.get('name_value', '').split('\n') if n.strip() and '*' not in n})
print(f'{len(data)} certificates; {len(names)} distinct names')
issuers = collections.Counter(d.get('issuer_name', '').split('O=')[-1].split(',')[0] for d in data)
print('issuers:', dict(issuers))
print('latest:', max((d.get('not_before', '') for d in data), default=''))
for n in names:
    a = subprocess.run(['dig', '+short', n], capture_output=True, text=True).stdout.strip().replace('\n', ' ')
    c = subprocess.run(['dig', '+short', n, 'CNAME'], capture_output=True, text=True).stdout.strip()
    code = subprocess.run(['curl', '-sS', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '15', f'https://{n}/'], capture_output=True, text=True).stdout.strip()
    print(f'{n}\tresolves: {a or "NONE"}\tCNAME: {c or "-"}\thttps: {code}')
PY

{
echo "== workers.dev host"; curl -sS -o /tmp/w -D - https://secure-by-design-website.securebydesign.workers.dev/ | tr -d '\r' | head -12
grep -oE '<link rel="canonical"[^>]*>|<meta name="robots"[^>]*>' /tmp/w || echo "no canonical/robots tag on workers.dev homepage"
echo "workers.dev /api/sign-in/providers -> $(curl -sS -o /dev/null -w '%{http_code}' https://secure-by-design-website.securebydesign.workers.dev/api/sign-in/providers)"
echo "workers.dev robots.txt:"; curl -sS https://secure-by-design-website.securebydesign.workers.dev/robots.txt | head -5
echo "== ChatGPT Sites hosts"
for h in secure-by-design-monitoring-lab.wladozer.chatgpt.site securebydesign.wladozer.chatgpt.site secure-by-design.wladozer.chatgpt.site securebydesigninc.wladozer.chatgpt.site secure-by-design-website.wladozer.chatgpt.site; do echo "$h -> $(curl -sS -o /tmp/c -w '%{http_code} %{redirect_url}' --max-time 20 https://$h/ 2>&1) | $(grep -oE '<title>[^<]*' /tmp/c 2>/dev/null | head -1)"; done
} > "$OUT/hosts.txt"

git clone -q --depth 1 https://github.com/testssl/testssl.sh.git /tmp/testssl && \
  timeout 900 /tmp/testssl/testssl.sh --quiet --color 0 --warnings batch --ip one -p -S -h -U -P --jsonfile "$OUT/testssl.json" securebydesigninc.com > "$OUT/testssl.txt" 2>&1 || echo "testssl exit $?" >> "$OUT/testssl.txt"
echo done
