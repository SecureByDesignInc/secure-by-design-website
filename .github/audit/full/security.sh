#!/usr/bin/env bash
# Read-only security checks against securebydesigninc.com: headers, cookies, CORS, unauthenticated API answers,
# exposed files, methods, TLS, DNS and email authentication, registration, app links, subdomains, alternate hosts.
set -u
OUT=audit-results/full/security; mkdir -p "$OUT"
S=https://securebydesigninc.com
UA='Mozilla/5.0 (X11; Linux x86_64) SBD-site-audit'
home=$(curl -sS -A "$UA" "$S/")
assets=$(echo "$home" | grep -oE '(src|href)="/[^"]+\.(js|css)"' | sed -E 's/^(src|href)="//; s/"$//' | sort -u | head -6)
echo "$assets" > "$OUT/assets-sampled.txt"
{
for u in / /training /training/dns-configuration /training/dns-configuration/checklist /inside-the-network /inside-network-model/model.html /my-progress /privacy "/app-sign-in?challenge=x" /training/dc01-dc02/ /training/rmf/ /training/dns-configuration/SecureByDesign-dns-configuration-Workbook.pdf /sitemap.xml /robots.txt /favicon.ico /favicon.svg /brand-lock.svg /og/secure-by-design.jpg /api/sign-in/providers /.well-known/security.txt /.well-known/apple-app-site-association "/app-auth/callback?code=AAAAAAAAAAAAAAAAAAAAAAAA" /no-such-page-audit $assets; do
  echo "=== $u"; curl -sS -A "$UA" -o /dev/null -D - -H 'Accept-Encoding: br, gzip' "$S$u" | tr -d '\r'
done
} > "$OUT/headers.txt"
grep -iE '^(=== |set-cookie)' "$OUT/headers.txt" | grep -iB1 '^set-cookie' > "$OUT/cookies.txt" || echo "no Set-Cookie on any checked page" > "$OUT/cookies.txt"

{
for u in /api/sign-in/providers /api/sign-in/methods /api/reader-progress /api/reader-auth/signin /api/reader-auth/request /api/native-auth/signin /api/native-auth/exchange /api/sign-in/app-handoff /api/sign-in/passkey/options /api/resource-signups /api/career-submissions /api/community-contributions /api/native-progress /api/resource-subscribers/export; do
  echo "=== GET $u with Origin https://evil.example"; curl -sS -o /dev/null -D - -H 'Origin: https://evil.example' "$S$u" | tr -d '\r' | grep -iE '^(HTTP|access-control|vary)'
  echo "=== OPTIONS $u"; curl -sS -o /dev/null -D - -X OPTIONS -H 'Origin: https://evil.example' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type' "$S$u" | tr -d '\r' | grep -iE '^(HTTP|access-control|allow)'
done
} > "$OUT/cors.txt"

{
echo "--- GET without a session"
for u in /api/sign-in/providers /api/sign-in/methods /api/reader-auth/session /api/reader-progress /api/reader-progress/profile /api/reader-progress/bookmarks/ /api/native-auth/session /api/native-progress /api/native-activity /api/native-onboarding /api/community-contributions /api/community-contributions/status /api/resource-signups /api/resource-subscribers /api/resource-subscribers/export /api/resource-preferences /api/career-submissions /api/career-records /api/career-notifications /career-records /career-records/x /resource-subscribers /community-contributions /resource-preferences "/api/sign-in/google/start?intent=signin&returnTo=/my-progress" "/api/sign-in/apple/start?intent=signin&returnTo=//evil.example" /app-auth/callback "/app-auth/callback?code=%3Cscript%3E" "/app-auth/callback?code=AAAAAAAAAAAAAAAAAAAAAAAA"; do
  printf '%s -> ' "$u"; curl -sS -o /tmp/b -w '%{http_code} %{content_type} %{size_download}B %{redirect_url}' "$S$u"; printf ' | %s\n' "$(head -c 200 /tmp/b | tr '\n\r' '  ')"
done
echo "--- POST from this site's origin without a session (expect 401/403/410, never 200)"
for u in /api/sign-in/app-handoff /api/sign-in/methods/remove /api/sign-in/delete-account /api/sign-in/passkey/register-options /api/reader-progress/profile /api/resource-subscribers/unsubscribe /api/community-contributions/notify /api/career-notifications/test /api/career-notifications/retry /api/career-submissions /api/community-contributions /api/resource-signups /api/native-auth/delete-account /api/native-auth/signout /api/reader-auth/signout; do
  printf 'POST %s -> ' "$u"; curl -sS -o /tmp/b -w '%{http_code}' -X POST -H "Origin: $S" -H 'content-type: application/json' -d '{"challenge":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","callback":"https","confirm":"DELETE"}' "$S$u"; printf ' | %s\n' "$(head -c 160 /tmp/b | tr '\n\r' '  ')"
done
echo "--- POST from another site (expect 403)"
for u in /api/reader-auth/request /api/reader-auth/signin /api/sign-in/passkey/options /api/sign-in/delete-account /api/reader-progress/profile; do
  printf 'POST %s (evil origin) -> ' "$u"; curl -sS -o /tmp/b -w '%{http_code}' -X POST -H 'Origin: https://evil.example' -H 'Sec-Fetch-Site: cross-site' -H 'content-type: application/json' -d '{"email":"audit@example.invalid"}' "$S$u"; printf ' | %s\n' "$(head -c 160 /tmp/b | tr '\n\r' '  ')"
done
echo "--- forged ChatGPT identity headers on the owner page (expect a redirect to sign in, not the page)"
curl -sS -o /dev/null -w 'career-records with oai headers -> %{http_code} %{redirect_url}\n' -H 'oai-authenticated-user-id: x' -H 'oai-authenticated-user-email: support@securebydesigninc.com' "$S/career-records"
} > "$OUT/api-unauth.txt"

{
for p in /.git/HEAD /.git/config /.env /.env.example /.dev.vars /package.json /pnpm-lock.yaml /wrangler.json /wrangler.toml /wrangler.jsonc /dist/server/wrangler.json /server/index.js /server/reader-auth.js /index.js /.openai/hosting.json /AGENTS.md /README.md /CLAUDE.md /archive/ /archive/public-retired-2026-10-08/ /audit-results/ /drizzle/0011_sign_in_methods.sql /db/schema.ts /content/membership-plans.json /content/configuration-courses.json /.DS_Store /_headers /_redirects /.well-known/security.txt /security.txt /.well-known/apple-app-site-association /apple-app-site-association /.well-known/assetlinks.json /.well-known/change-password /.well-known/webauthn /admin /wp-admin/ /wp-login.php /phpinfo.php /server-status /api /api/ /assets/ /build-info.json /cdn-cgi/trace /training/ /training/dc01-dc02/ /inside-network-model/ /tests/ /scripts/ /node_modules/; do
  printf '%-45s ' "$p"; curl -sS -o /tmp/b -w '%{http_code} %{content_type} %{size_download}B' "$S$p"; printf ' | %s\n' "$(head -c 120 /tmp/b | tr '\n\r' '  ')"
done
echo "--- source maps for sampled assets"
for a in $assets; do printf '%s.map -> ' "$a"; curl -sS -o /dev/null -w '%{http_code} %{size_download}B\n' "$S$a.map"; done
echo "--- security.txt"; curl -sS "$S/.well-known/security.txt"
} > "$OUT/exposure.txt"

{
for m in TRACE PUT DELETE PATCH OPTIONS; do echo "$m / -> $(curl -sS -o /dev/null -w '%{http_code}' -X $m "$S/")"; done
echo "http version: $(curl -sS -o /dev/null -w '%{http_version}' --http2 "$S/")"
echo "alt-svc: $(curl -sSI "$S/" | tr -d '\r' | grep -i '^alt-svc' || echo none)"
for enc in br gzip; do echo "html encoding ($enc): $(curl -sS -o /dev/null -D - -H "Accept-Encoding: $enc" "$S/" | tr -d '\r' | grep -i '^content-encoding' || echo none)"; done
echo "--- redirects"
for u in http://securebydesigninc.com/training http://www.securebydesigninc.com/ https://www.securebydesigninc.com/training?x=1; do echo "$u -> $(curl -sS -o /dev/null -D - "$u" | tr -d '\r' | grep -iE '^(HTTP|location|strict-transport-security)' | tr '\n' ' ')"; done
echo "--- protocol handshakes"
for v in tls1 tls1_1 tls1_2 tls1_3; do out=$(echo | timeout 15 openssl s_client -connect securebydesigninc.com:443 -servername securebydesigninc.com -$v -cipher 'ALL:@SECLEVEL=0' 2>&1 || true); if echo "$out" | grep -q "BEGIN CERTIFICATE"; then echo "$v accepted ($(echo "$out" | grep -m1 -E 'Cipher is|Cipher *:' | sed 's/.*[:,] *//'))"; else echo "$v refused"; fi; done
echo "--- certificate"; echo | openssl s_client -connect securebydesigninc.com:443 -servername securebydesigninc.com 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
echo "--- www certificate"; echo | openssl s_client -connect www.securebydesigninc.com:443 -servername www.securebydesigninc.com 2>/dev/null | openssl x509 -noout -subject -issuer -dates
} > "$OUT/transport.txt"

{
q() { dig +short "$@" @1.1.1.1; }
for t in A AAAA NS MX TXT CAA SOA; do echo "== securebydesigninc.com $t"; q securebydesigninc.com $t; done
echo "== www"; q www.securebydesigninc.com
for n in _dmarc.securebydesigninc.com notify.securebydesigninc.com send.notify.securebydesigninc.com _dmarc.notify.securebydesigninc.com resend._domainkey.notify.securebydesigninc.com resend._domainkey.securebydesigninc.com _mta-sts.securebydesigninc.com mta-sts.securebydesigninc.com _smtp._tls.securebydesigninc.com default._bimi.securebydesigninc.com; do
  echo "== $n"; echo "TXT: $(q $n TXT | tr '\n' ' ')"; echo "MX: $(q $n MX | tr '\n' ' ')"; echo "CNAME: $(q $n CNAME | tr '\n' ' ')"
done
echo "== DKIM selectors tried"
for s in resend default google selector1 selector2 k1 hostway mail dkim s1 s2 mxvault siteprotect; do for host in "$s._domainkey.securebydesigninc.com" "$s._domainkey.notify.securebydesigninc.com"; do r=$(q TXT "$host" | tr '\n' ' '); [ -n "$r" ] && echo "$host => ${r:0:90}..."; done; done
echo "== DNSSEC DS (parent)"; q securebydesigninc.com DS
echo "== DNSKEY"; q securebydesigninc.com DNSKEY | cut -c1-60
echo "== AD flag via 1.1.1.1"; dig +dnssec securebydesigninc.com A @1.1.1.1 | grep -E 'flags:'
} > "$OUT/dns.txt"

{
reg=$(curl -sS -m 20 "https://rdap.verisign.com/com/v1/domain/securebydesigninc.com")
echo "registry status: $(echo "$reg" | jq -r '[.status[]?] | join(", ")')"
echo "DNSSEC delegation signed: $(echo "$reg" | jq -r '.secureDNS.delegationSigned')"
echo "registrar: $(echo "$reg" | jq -r '.entities[]? | select(.roles[]?=="registrar") | .vcardArray[1][]? | select(.[0]=="fn") | .[3]')"
echo "events: $(echo "$reg" | jq -r '[.events[]? | "\(.eventAction) \(.eventDate[0:10])"] | join(" | ")')"
echo "nameservers: $(echo "$reg" | jq -r '[.nameservers[]?.ldhName] | join(", ")')"
} > "$OUT/registration.txt" 2>&1

{
echo "direct: $(curl -sS -m 20 -o /tmp/aasa.json -w '%{http_code} %{content_type}' "$S/.well-known/apple-app-site-association")"; cat /tmp/aasa.json; echo
echo "root path: $(curl -sS -m 20 -o /dev/null -w '%{http_code} %{content_type}' "$S/apple-app-site-association")"
echo "Apple CDN: $(curl -sS -m 20 -o /tmp/cdn.json -w '%{http_code}' https://app-site-association.cdn-apple.com/a/v1/securebydesigninc.com)"; head -c 400 /tmp/cdn.json; echo
echo "Android assetlinks: $(curl -sS -m 20 -o /dev/null -w '%{http_code}' "$S/.well-known/assetlinks.json")"
} > "$OUT/app-links.txt" 2>&1

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
echo "== workers.dev host"; curl -sS -o /tmp/w -D - https://secure-by-design-website.securebydesign.workers.dev/ | tr -d '\r' | head -8
echo "workers.dev /api/sign-in/providers -> $(curl -sS -o /dev/null -w '%{http_code}' https://secure-by-design-website.securebydesign.workers.dev/api/sign-in/providers)"
echo "== ChatGPT Sites hosts"
for h in secure-by-design-monitoring-lab.wladozer.chatgpt.site securebydesign.wladozer.chatgpt.site secure-by-design.wladozer.chatgpt.site securebydesigninc.wladozer.chatgpt.site secure-by-design-website.wladozer.chatgpt.site; do echo "$h -> $(curl -sS -o /tmp/c -w '%{http_code} %{redirect_url}' --max-time 20 https://$h/ 2>&1) | $(grep -oE '<title>[^<]*' /tmp/c 2>/dev/null | head -1)"; done
} > "$OUT/hosts.txt"

git clone -q --depth 1 https://github.com/testssl/testssl.sh.git /tmp/testssl && \
  timeout 900 /tmp/testssl/testssl.sh --quiet --color 0 --warnings batch --ip one -p -S -h -U -P --jsonfile "$OUT/testssl.json" securebydesigninc.com > "$OUT/testssl.txt" 2>&1 || echo "testssl exit $?" >> "$OUT/testssl.txt"
echo done
