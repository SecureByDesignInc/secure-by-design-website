| Run | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Weight |
|---|---|---|---|---|---|---|---|---|---|
| home-desktop | 63 | 100 | 100 | 100 | 0.9 s | 1.3 s | 39,580 ms | 0 | Total size was 513 KiB |
| home-mobile | 58 | 100 | 100 | 100 | 2.2 s | 3.0 s | 165,520 ms | 0 | Total size was 513 KiB |
| inside_the_network-desktop | 63 | 100 | 100 | 100 | 0.8 s | 1.2 s | 23,130 ms | 0 | Total size was 745 KiB |
| inside_the_network-mobile | 48 | 100 | 100 | 100 | 2.6 s | 4.3 s | 95,310 ms | 0.031 | Total size was 745 KiB |
| my_progress-desktop | 95 | 100 | 100 | 69 | 0.9 s | 1.4 s | 0 ms | 0.001 | Total size was 404 KiB |
| my_progress-mobile | 91 | 100 | 100 | 69 | 2.3 s | 3.1 s | 70 ms | 0.002 | Total size was 403 KiB |
| privacy-desktop | 99 | 100 | 100 | 100 | 0.7 s | 0.9 s | 0 ms | 0 | Total size was 348 KiB |
| privacy-mobile | 87 | 100 | 100 | 100 | 2.5 s | 3.5 s | 80 ms | 0 | Total size was 347 KiB |
| training-desktop | 94 | 100 | 100 | 100 | 1.1 s | 1.4 s | 0 ms | 0 | Total size was 520 KiB |
| training-mobile | 74 | 100 | 100 | 100 | 3.5 s | 4.9 s | 60 ms | 0 | Total size was 520 KiB |
| training_dc01_dc02_-desktop | 95 | 100 | 100 | 92 | 0.8 s | 0.8 s | 160 ms | 0 | Total size was 454 KiB |
| training_dc01_dc02_-mobile | 58 | 100 | 100 | 92 | 3.1 s | 3.1 s | 39,940 ms | 0 | Total size was 454 KiB |
| training_dns_configuration-desktop | 96 | 100 | 100 | 92 | 0.9 s | 1.2 s | 0 ms | 0 | Total size was 374 KiB |
| training_dns_configuration-mobile | 81 | 100 | 100 | 92 | 2.9 s | 4.1 s | 10 ms | 0 | Total size was 374 KiB |
| training_rmf_-desktop | 100 | 100 | 100 | 100 | 0.5 s | 0.5 s | 0 ms | 0 | Total size was 72 KiB |
| training_rmf_-mobile | 99 | 100 | 100 | 100 | 1.7 s | 1.7 s | 40 ms | 0 | Total size was 72 KiB |

### home-desktop.json
- Opportunities: Reduce unused JavaScript (Est savings of 104 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/three.module-BKRIy6WH.js · Initial server response time was short (Root document took 180 ms) e.g. https://securebydesigninc.com/ · Properly size images (Est savings of 5 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png
- Diagnostics: Largest Contentful Paint element: 1,300 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 104 KiB · Properly size images: Est savings of 5 KiB · Minimize main-thread work: 44.6 s · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): [best-practices] Missing source maps for large first-party JavaScript — {"scriptUrl":"https://securebydesigninc.com/_next/static/chunks/three.module-BKRIy6WH.js","subItems":{"type":"subitems","items":[{"error":"Large JavaScript file
### home-mobile.json
- Opportunities: Reduce unused JavaScript (Est savings of 104 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/three.module-BKRIy6WH.js · Initial server response time was short (Root document took 220 ms) e.g. https://securebydesigninc.com/ · Defer offscreen images (Est savings of 56 KiB) e.g. https://securebydesigninc.com/partners/tenable-light.svg · Properly size images (Est savings of 4 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png · Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Largest Contentful Paint element: 2,970 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 104 KiB · Properly size images: Est savings of 4 KiB · Reduce JavaScript execution time: 2.2 s · Minimize main-thread work: 177.5 s · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): [best-practices] Missing source maps for large first-party JavaScript — {"scriptUrl":"https://securebydesigninc.com/_next/static/chunks/three.module-BKRIy6WH.js","subItems":{"type":"subitems","items":[{"error":"Large JavaScript file
### inside_the_network-desktop.json
- Opportunities: Reduce unused JavaScript (Est savings of 137 KiB) e.g. https://securebydesigninc.com/inside-network-model/vendor/three.core.js · Initial server response time was short (Root document took 120 ms) e.g. https://securebydesigninc.com/inside-the-network · Minify JavaScript (Est savings of 8 KiB) e.g. https://securebydesigninc.com/inside-network-model/scene.js · Reduce unused CSS (Est savings of 11 KiB) e.g. https://securebydesigninc.com/inside-network-model/model.css · Properly size images (Est savings of 5 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png · Avoid serving legacy JavaScript to modern browsers (Est savings of 20 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 137 KiB · Properly size images: Est savings of 5 KiB · Reduce JavaScript execution time: 2.5 s · Minimize main-thread work: 27.9 s · Avoid an excessive DOM size: 1,081 elements · Serve static assets with an efficient cache policy: 2 resources found
- Failing (non-performance): none
### inside_the_network-mobile.json
- Opportunities: Reduce unused JavaScript (Est savings of 160 KiB) e.g. https://securebydesigninc.com/inside-network-model/vendor/three.core.js · Minify JavaScript (Est savings of 8 KiB) e.g. https://securebydesigninc.com/inside-network-model/scene.js · Properly size images (Est savings of 4 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png
- Diagnostics: Largest Contentful Paint element: 4,330 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 160 KiB · Properly size images: Est savings of 4 KiB · Reduce JavaScript execution time: 7.5 s · Minimize main-thread work: 103.9 s · Avoid an excessive DOM size: 1,081 elements · Serve static assets with an efficient cache policy: 2 resources found
- Failing (non-performance): none
### my_progress-desktop.json
- Opportunities: Reduce unused JavaScript (Est savings of 58 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/index--mBk5VZ7.js · Properly size images (Est savings of 5 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png · Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Largest Contentful Paint element: 1,390 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 58 KiB · Properly size images: Est savings of 5 KiB · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): [seo] Page is blocked from indexing — {"source":{"type":"node","lhId":"1-82-META","path":"1,HTML,0,HEAD,39,META","selector":"head > meta","boundingRect":{"top":0,"bottom":0,"left":0,"right":0,"width
### my_progress-mobile.json
- Opportunities: Reduce unused JavaScript (Est savings of 58 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/index--mBk5VZ7.js · Defer offscreen images (Est savings of 56 KiB) e.g. https://securebydesigninc.com/partners/tenable-light.svg · Properly size images (Est savings of 4 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png
- Diagnostics: Largest Contentful Paint element: 3,050 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 58 KiB · Properly size images: Est savings of 4 KiB · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): [seo] Page is blocked from indexing — {"source":{"type":"node","lhId":"1-82-META","path":"1,HTML,0,HEAD,39,META","selector":"head > meta","boundingRect":{"top":0,"bottom":0,"left":0,"right":0,"width
### privacy-desktop.json
- Opportunities: Reduce unused JavaScript (Est savings of 64 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/index--mBk5VZ7.js · Properly size images (Est savings of 5 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png · Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 64 KiB · Properly size images: Est savings of 5 KiB · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): none
### privacy-mobile.json
- Opportunities: Reduce unused JavaScript (Est savings of 64 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/index--mBk5VZ7.js · Defer offscreen images (Est savings of 56 KiB) e.g. https://securebydesigninc.com/partners/tenable-light.svg · Properly size images (Est savings of 4 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png · Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Largest Contentful Paint element: 3,510 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 64 KiB · Properly size images: Est savings of 4 KiB · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): none
### training-desktop.json
- Opportunities: Reduce unused JavaScript (Est savings of 63 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/index--mBk5VZ7.js · Properly size images (Est savings of 29 KiB) e.g. https://securebydesigninc.com/training/dc01-dc02/workbook-cover.webp · Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Largest Contentful Paint element: 1,360 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 63 KiB · Properly size images: Est savings of 29 KiB · Avoid an excessive DOM size: 1,050 elements · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): none
### training-mobile.json
- Opportunities: Reduce unused JavaScript (Est savings of 63 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/index--mBk5VZ7.js · Initial server response time was short (Root document took 100 ms) e.g. https://securebydesigninc.com/training · Defer offscreen images (Est savings of 56 KiB) e.g. https://securebydesigninc.com/partners/tenable-light.svg · Properly size images (Est savings of 28 KiB) e.g. https://securebydesigninc.com/training/dc01-dc02/workbook-cover.webp · Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Largest Contentful Paint element: 4,930 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 63 KiB · Properly size images: Est savings of 28 KiB · Avoid an excessive DOM size: 1,050 elements · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): none
### training_dc01_dc02_-desktop.json
- Opportunities: Reduce unused JavaScript (Est savings of 387 KiB) e.g. data:text/javascript;base64,LyoqCiAqIEBsaWNlbnNlCiAqIENvcHlyaWdodCAyMDEwLTIwMjYgVGhyZWUuanMgQXV0aG9y · Serve images in next-gen formats (Est savings of 89 KiB) e.g. data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAACXBIWXMAAAsTAAALEwEAmpwYAAAgA… · Properly size images (Est savings of 94 KiB) e.g. data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAACXBIWXMAAAsTAAALEwEAmpwYAAAgA… · Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 387 KiB · Serve images in next-gen formats: Est savings of 89 KiB · Properly size images: Est savings of 94 KiB · Minimize main-thread work: 3.7 s · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): [seo] Document does not have a meta description
### training_dc01_dc02_-mobile.json
- Opportunities: Eliminate render-blocking resources (Est savings of 90 ms) e.g. https://securebydesigninc.com/training/dc01-dc02/guide-share.css · Reduce unused JavaScript (Est savings of 387 KiB) e.g. data:text/javascript;base64,LyoqCiAqIEBsaWNlbnNlCiAqIENvcHlyaWdodCAyMDEwLTIwMjYgVGhyZWUuanMgQXV0aG9y · Serve images in next-gen formats (Est savings of 89 KiB) e.g. data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAACXBIWXMAAAsTAAALEwEAmpwYAAAgA… · Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Eliminate render-blocking resources: Est savings of 90 ms · Reduce unused JavaScript: Est savings of 387 KiB · Serve images in next-gen formats: Est savings of 89 KiB · Reduce JavaScript execution time: 4.2 s · Minimize main-thread work: 51.6 s · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): [seo] Document does not have a meta description
### training_dns_configuration-desktop.json
- Opportunities: Reduce unused JavaScript (Est savings of 58 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/index--mBk5VZ7.js · Properly size images (Est savings of 5 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png
- Diagnostics: Largest Contentful Paint element: 1,210 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 58 KiB · Properly size images: Est savings of 5 KiB · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): [seo] Document does not have a meta description
### training_dns_configuration-mobile.json
- Opportunities: Reduce unused JavaScript (Est savings of 58 KiB) e.g. https://securebydesigninc.com/_next/static/chunks/index--mBk5VZ7.js · Properly size images (Est savings of 4 KiB) e.g. https://securebydesigninc.com/app-stores/google-play.png · Defer offscreen images (Est savings of 56 KiB) e.g. https://securebydesigninc.com/partners/tenable-light.svg
- Diagnostics: Largest Contentful Paint element: 4,150 ms · Eliminate render-blocking resources: Est savings of 0 ms · Reduce unused JavaScript: Est savings of 58 KiB · Properly size images: Est savings of 4 KiB · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): [seo] Document does not have a meta description
### training_rmf_-desktop.json
- Opportunities: Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Eliminate render-blocking resources: Est savings of 0 ms · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): none
### training_rmf_-mobile.json
- Opportunities: Eliminate render-blocking resources (Est savings of 150 ms) e.g. https://securebydesigninc.com/training/guide-share.css · Avoid serving legacy JavaScript to modern browsers (Est savings of 10 KiB) e.g. https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920
- Diagnostics: Eliminate render-blocking resources: Est savings of 150 ms · Serve static assets with an efficient cache policy: 1 resource found
- Failing (non-performance): none
