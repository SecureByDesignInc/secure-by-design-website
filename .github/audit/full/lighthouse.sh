#!/usr/bin/env bash
set -u
OUT=audit-results/full/lighthouse; mkdir -p "$OUT" /tmp/lh
S=https://securebydesigninc.com
CHROME=$(command -v google-chrome || command -v google-chrome-stable || command -v chromium)
echo "chrome: $CHROME $($CHROME --version)" > "$OUT/env.txt"
for p in / /training /training/dns-configuration /inside-the-network /my-progress /privacy /training/dc01-dc02/index.html /training/rmf/index.html; do
  n=$(echo "$p" | sed 's#^/##; s#[^a-zA-Z0-9]#_#g'); [ -z "$n" ] && n=home
  for mode in mobile desktop; do
    extra=""; [ $mode = desktop ] && extra="--preset=desktop"
    CHROME_PATH=$CHROME npx --yes lighthouse@12.6.1 "$S$p" $extra --quiet --chrome-flags="--headless=new --no-sandbox" \
      --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="/tmp/lh/$n-$mode.json" >/dev/null 2>>"$OUT/errors.txt" || echo "failed $p $mode" >> "$OUT/errors.txt"
  done
done
node .github/audit/full/lighthouse-summary.mjs /tmp/lh > "$OUT/summary.md"
cp /tmp/lh/*.json "$OUT/" 2>/dev/null; gzip -9 "$OUT"/*.json 2>/dev/null
echo done
