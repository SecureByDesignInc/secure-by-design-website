// server/analytics.js
// Secure By Design: cookieless PostHog analytics, served through this Worker.
//
//   1. /sbd-e/*        first-party proxy to PostHog (keeps ad-blockers from dropping events and
//                      strips the site's sign-in cookies before anything leaves Cloudflare)
//   2. /sbd-e/init.js  generated per request: PostHog settings + Cloudflare's coarse location
//                      (PostHog does no location lookup in cookieless mode, so the Worker supplies it)
//   3. injectAnalytics adds one same-origin <script> tag to public pages the Worker renders.
//                      Static course guides in public/ need the same tag in their own HTML.
//
// On/off switch: nothing happens until the Worker has a POSTHOG_KEY secret. With no key, pages are
// left untouched and /sbd-e/init.js is an empty script. Cloudflare Web Analytics is not affected.
// Only server/index.js imports this file; it is not the Worker's entry module.

// ---- Settings you might change -------------------------------------------------

// PostHog region you pick when you create the project ("us" or "eu"). Cannot change later.
const POSTHOG_REGION = "us";

// Path prefix on securebydesigninc.com for the proxy. Deliberately not "analytics",
// "tracking", "ingest" or "posthog", which ad-blockers match on.
export const ANALYTICS_PREFIX = "/sbd-e";

// Only these hostnames get analytics (keeps local dev and any preview copy out).
const SITE_HOSTS = ["securebydesigninc.com", "www.securebydesigninc.com"];

// Pages that never load analytics: sign-in and account pages, the app sign-in hand-off, and every
// /api/ address (which also covers the owner and email-preference pages).
const EXCLUDED_PATHS = [
  /^\/account(\/|$)/,
  /^\/sign-?in(\/|$)/,
  /^\/login(\/|$)/,
  /^\/auth(\/|$)/,
  /^\/app-auth(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/owner(\/|$)/,
  /^\/api\//,
  /preferences/,
  /unsubscribe/,
];

// YouTube embed tracking (start / 25-50-75% / complete). Off: it needs YouTube's player script from
// www.youtube.com on every page with a video, before anyone presses play, which the privacy-enhanced
// youtube-nocookie embeds were chosen to avoid. Clicks on videos are still recorded by autocapture.
const TRACK_YOUTUBE_EMBEDS = false;

// File types counted as downloads when a link to them is clicked.
const DOWNLOAD_EXT = /\.(pdf|zip|7z|docx|xlsx|pptx|csv|ps1|psm1|sh|ova|vhdx|iso|tar|gz)$/i;

// Largest event batch the proxy will forward. Session replay is off, so real batches are small.
const MAX_BODY_BYTES = 1_000_000;

// ---------------------------------------------------------------------------------

const API_HOST = POSTHOG_REGION === "eu" ? "eu.i.posthog.com" : "us.i.posthog.com";
const ASSET_HOST = POSTHOG_REGION === "eu" ? "eu-assets.i.posthog.com" : "us-assets.i.posthog.com";
const UI_HOST = POSTHOG_REGION === "eu" ? "https://eu.posthog.com" : "https://us.posthog.com";

/**
 * Call first in the Worker's fetch handler, before sessions/auth/routing.
 * Returns a Response for /sbd-e/* requests, or null for everything else.
 */
export async function handleAnalyticsRoute(request, env, ctx) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(ANALYTICS_PREFIX + "/")) return null;

  const sub = url.pathname.slice(ANALYTICS_PREFIX.length); // e.g. "/init.js", "/e/", "/static/x.js"

  if (sub === "/init.js") return initScript(request, env);

  if (!env.POSTHOG_KEY) return new Response(null, { status: 204 });

  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (!["GET", "HEAD", "POST"].includes(request.method)) {
    return new Response("Method not allowed", { status: 405 });
  }

  // The PostHog library itself, under a neutral name.
  if (sub === "/lib.js") return retrieveAsset(request, "/static/array.js", ctx);

  if (sub.startsWith("/static/") || sub.startsWith("/array/")) {
    return retrieveAsset(request, sub + url.search, ctx);
  }

  return forwardRequest(request, sub + url.search);
}

/**
 * Wrap the Worker's responses on the way out (server/index.js does this before protect()).
 * Adds <script src="/sbd-e/init.js" defer> to public HTML pages only, and only once POSTHOG_KEY is set.
 */
export function injectAnalytics(response, request, env) {
  if (!env || !env.POSTHOG_KEY) return response;
  if (typeof HTMLRewriter === "undefined") return response; // Node test runs
  if (request.method !== "GET" || response.status !== 200) return response;

  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const url = new URL(request.url);
  if (!SITE_HOSTS.includes(url.hostname)) return response;
  if (EXCLUDED_PATHS.some((re) => re.test(url.pathname))) return response;

  // A page with its own stricter policy that doesn't allow this site's scripts stays untouched.
  const ownPolicy = response.headers.get("content-security-policy");
  if (ownPolicy && !/script-src[^;]*'self'/.test(ownPolicy)) return response;

  return new HTMLRewriter()
    .on("head", {
      element(el) {
        el.append(`<script src="${ANALYTICS_PREFIX}/init.js" defer></script>`, { html: true });
      },
    })
    .transform(response);
}

// ---- internals -------------------------------------------------------------------

function initScript(request, env) {
  const headers = {
    "content-type": "application/javascript; charset=utf-8",
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  };

  if (!env.POSTHOG_KEY) {
    return new Response("/* analytics off */\n", { headers });
  }

  const url = new URL(request.url);
  const cf = request.cf || {};
  const config = {
    key: env.POSTHOG_KEY,
    apiHost: url.origin + ANALYTICS_PREFIX,
    uiHost: UI_HOST,
    hosts: SITE_HOSTS,
    downloadExt: DOWNLOAD_EXT.source,
    youtubeEmbeds: TRACK_YOUTUBE_EMBEDS,
    // Coarse location from Cloudflare (the same source Cloudflare Web Analytics uses).
    geo: {
      $geoip_country_code: cf.country || null,
      $geoip_subdivision_1_code: cf.regionCode || null,
      $geoip_subdivision_1_name: cf.region || null,
      $geoip_city_name: cf.city || null,
      $geoip_continent_code: cf.continent || null,
    },
  };

  const json = JSON.stringify(config).replace(/</g, "\\u003c");
  return new Response("(function (CFG) {\n" + CLIENT_JS + "\n})(" + json + ");\n", { headers });
}

async function retrieveAsset(request, upstreamPath, ctx) {
  const url = new URL(request.url);
  // Cache on our own URL with no cookies attached.
  const cacheKey = new Request(url.origin + url.pathname + url.search, { method: "GET" });
  const cache = caches.default;

  let response = await cache.match(cacheKey);
  if (response) return response;

  const upstream = await fetch(`https://${ASSET_HOST}${upstreamPath}`);
  const headers = new Headers(upstream.headers);
  headers.delete("set-cookie");
  response = new Response(upstream.body, { status: upstream.status, headers });

  if (upstream.ok && ctx && ctx.waitUntil) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function forwardRequest(request, pathWithSearch) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) return new Response("Payload too large", { status: 413 });

  let body = null;
  if (request.method === "POST") {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) return new Response("Payload too large", { status: 413 });
  }

  const headers = new Headers(request.headers);
  // The site's own sign-in session must never leave Cloudflare.
  headers.delete("cookie");
  headers.delete("authorization");
  // PostHog uses the real IP only to compute its daily-rotating visitor hash,
  // then strips it (cookieless server hash mode).
  headers.set("X-Forwarded-For", request.headers.get("CF-Connecting-IP") || "");

  const upstream = await fetch(`https://${API_HOST}${pathWithSearch}`, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  const out = new Headers(upstream.headers);
  out.delete("set-cookie");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

// ---- browser script (served by /sbd-e/init.js) ---------------------------------
// Plain ES5-style string on purpose: no build step, no inline script, no backticks.
const CLIENT_JS = String.raw`
  var w = window, d = document, nav = navigator;

  if (CFG.hosts.indexOf(location.hostname) === -1) return;
  // Honor Global Privacy Control and Do Not Track: no PostHog at all for these visitors.
  if (nav.globalPrivacyControl === true) return;
  if (nav.doNotTrack === "1" || w.doNotTrack === "1") return;
  // Owner opt-out for your own devices: run localStorage.setItem("sbd-analytics-optout","1")
  // once in the browser console. This script only reads it, never writes it.
  try { if (w.localStorage && w.localStorage.getItem("sbd-analytics-optout") === "1") return; } catch (e) {}
  if (w.posthog && w.posthog.__loaded) return;

  var FILE_RE = new RegExp(CFG.downloadExt, "i");
  var KEEP_PARAM = /^(utm_[a-z_]+|ref)$/i;

  // Secure By Design's channels (social platforms and the iOS app).
  // Used for clicks out to them and visits arriving from them.
  var PLATFORMS = [
    { name: "youtube",   hosts: /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/, utm: /^(youtube|yt)$/ },
    { name: "tiktok",    hosts: /(^|\.)tiktok\.com$/,                                  utm: /^(tiktok|tt)$/ },
    { name: "instagram", hosts: /(^|\.)(instagram\.com|instagr\.am)$/,                 utm: /^(instagram|ig)$/ },
    { name: "linkedin",  hosts: /(^|\.)(linkedin\.com|lnkd\.in)$/,                     utm: /^(linkedin|li)$/ },
    { name: "discord",   hosts: /(^|\.)(discord\.gg|discord\.com|discordapp\.com)$/,   utm: /^discord$/ },
    { name: "linktree",  hosts: /(^|\.)(linktr\.ee|linktree\.com)$/,                   utm: /^linktree$/ },
    { name: "ios_app",   hosts: /(^|\.)(testflight\.apple\.com|apps\.apple\.com|itunes\.apple\.com)$/, utm: /^(ios_app|ios|iphone)$/ }
  ];

  function platformForHost(host) {
    for (var i = 0; i < PLATFORMS.length; i++) { if (PLATFORMS[i].hosts.test(host)) return PLATFORMS[i].name; }
    return "";
  }

  // Where this visit came from, normalized to one platform name. utm_source wins, because
  // the Instagram, TikTok, LinkedIn and Discord apps often send no referrer at all.
  // Only set on the page a visitor lands on (later pages refer from this site).
  var SOURCE_PLATFORM = (function () {
    try {
      var src = (new URLSearchParams(location.search).get("utm_source") || "").toLowerCase();
      if (src) {
        for (var i = 0; i < PLATFORMS.length; i++) { if (PLATFORMS[i].utm.test(src)) return PLATFORMS[i].name; }
      }
      if (d.referrer) {
        var host = new URL(d.referrer).hostname;
        if (host !== location.hostname) return platformForHost(host);
      }
    } catch (e) {}
    return "";
  })();

  // Remove query strings and fragments from every URL we send (keeps utm_* and ref).
  // Protects one-time sign-in and app hand-off codes from ever reaching PostHog.
  function cleanUrl(value) {
    try {
      var u = new URL(value, location.href);
      var kept = new URLSearchParams();
      u.searchParams.forEach(function (v, k) { if (KEEP_PARAM.test(k)) kept.append(k, v); });
      var q = kept.toString();
      return u.origin + u.pathname + (q ? "?" + q : "");
    } catch (e) { return value; }
  }

  function scrubObject(obj) {
    if (!obj) return;
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var v = obj[k];
      if (typeof v === "string" && /url|referrer|href/i.test(k) && (v.indexOf("?") > -1 || v.indexOf("#") > -1)) {
        obj[k] = cleanUrl(v);
      }
    }
  }

  function beforeSend(ev) {
    if (!ev) return ev;
    var p = ev.properties || (ev.properties = {});
    scrubObject(p);
    scrubObject(p.$set);
    scrubObject(p.$set_once);
    if (typeof p.$elements_chain === "string") {
      p.$elements_chain = p.$elements_chain.replace(/(attr__href=")([^"?#]*)[?#][^"]*"/g, '$1$2"');
    }
    if (SOURCE_PLATFORM && p.source_platform == null) p.source_platform = SOURCE_PLATFORM;
    for (var g in CFG.geo) {
      if (CFG.geo[g] && p[g] == null) p[g] = CFG.geo[g];
    }
    return ev;
  }

  function capture(name, props) {
    if (!w.posthog || !w.posthog.capture) return;
    w.posthog.capture(name, props, { transport: "sendBeacon" });
  }

  function youtubeId(u) {
    if (/(^|\.)youtu\.be$/.test(u.hostname)) return u.pathname.slice(1).split("/")[0];
    var v = u.searchParams.get("v");
    if (v) return v;
    var m = u.pathname.match(/\/(embed|shorts|live)\/([^\/?#]+)/);
    return m ? m[2] : "";
  }

  // Named events for downloads, outbound links (YouTube separately) and anything tagged data-track.
  // Autocapture still records every other click.
  d.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("a[href],[data-track]") : null;
    if (!t) return;

    var props = { page: location.pathname };
    if (t.dataset) {
      for (var k in t.dataset) { if (k !== "track") props[k] = t.dataset[k]; }
    }
    var name = t.getAttribute("data-track") || "";
    var href = t.getAttribute("href");

    if (href) {
      var u = null;
      try { u = new URL(href, location.href); } catch (er) {}
      // App Store / TestFlight links that use Apple's own URL schemes instead of https.
      if (u && /^itms(-apps|-appss|-beta|-services)?:$/.test(u.protocol)) {
        name = name || "channel_click";
        props.platform = "ios_app";
        props.app_store = u.protocol === "itms-beta:" ? "testflight" : "app_store";
      }
      if (u && /^https?:$/.test(u.protocol)) {
        props.href = cleanUrl(u.href);
        var sameSite = u.hostname === location.hostname;
        if (!name && sameSite && (FILE_RE.test(u.pathname) || t.hasAttribute("download"))) {
          name = "file_download";
          props.file = decodeURIComponent(u.pathname);
          var ext = u.pathname.match(/\.([a-z0-9]+)$/i);
          props.file_type = ext ? ext[1].toLowerCase() : "";
        } else if (!name && !sameSite) {
          var platform = platformForHost(u.hostname);
          props.domain = u.hostname;
          if (platform) {
            name = "channel_click";
            props.platform = platform;
            if (platform === "ios_app") props.app_store = /testflight/.test(u.hostname) ? "testflight" : "app_store";
            props.target = u.pathname;   // e.g. /company/secure-by-design-inc, /@handle, /MDrGbP4cAY
            if (platform === "youtube") props.video_id = youtubeId(u);
            if (platform === "discord") {
              var inv = u.hostname.indexOf("discord.gg") > -1 ? u.pathname.match(/^\/([^\/]+)/) : u.pathname.match(/^\/invite\/([^\/]+)/);
              if (inv) props.invite_code = inv[1];
            }
          } else {
            name = "outbound_click";
          }
        }
      }
    }
    if (name) capture(name, props);
  }, true);

  // YouTube embeds: start, 25/50/75%, complete. Only runs on pages that have an embed.
  function trackEmbeds() {
    if (!CFG.youtubeEmbeds) return;
    var frames = d.querySelectorAll('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]');
    if (!frames.length) return;

    for (var i = 0; i < frames.length; i++) {
      try {
        var u = new URL(frames[i].src);
        if (u.searchParams.get("enablejsapi") !== "1" || u.searchParams.get("origin") !== location.origin) {
          u.searchParams.set("enablejsapi", "1");
          u.searchParams.set("origin", location.origin);
          frames[i].src = u.href;
        }
      } catch (e) {}
    }

    function attach() {
      for (var j = 0; j < frames.length; j++) {
        (function (frame) {
          var id = "";
          try { id = youtubeId(new URL(frame.src)); } catch (e) {}
          var sent = {}, timer = null, player;
          function progress() {
            try {
              var dur = player.getDuration(), cur = player.getCurrentTime();
              if (!dur) return;
              [25, 50, 75].forEach(function (pct) {
                if (!sent[pct] && cur / dur >= pct / 100) {
                  sent[pct] = true;
                  capture("video_progress", { video_id: id, percent: pct, page: location.pathname });
                }
              });
            } catch (e) {}
          }
          player = new w.YT.Player(frame, {
            events: {
              onStateChange: function (ev) {
                if (ev.data === 1) {
                  if (!sent.start) { sent.start = true; capture("video_start", { video_id: id, page: location.pathname }); }
                  if (!timer) timer = setInterval(progress, 1000);
                } else {
                  if (timer) { clearInterval(timer); timer = null; }
                  if (ev.data === 0 && !sent.done) { sent.done = true; capture("video_complete", { video_id: id, page: location.pathname }); }
                }
              }
            }
          });
        })(frames[j]);
      }
    }

    if (w.YT && w.YT.Player) { attach(); return; }
    var previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = function () { if (previous) { try { previous(); } catch (e) {} } attach(); };
    var yt = d.createElement("script");
    yt.src = "https://www.youtube.com/iframe_api";
    yt.async = true;
    d.head.appendChild(yt);
  }

  function boot() {
    if (!w.posthog || !w.posthog.init) return;
    w.posthog.init(CFG.key, {
      api_host: CFG.apiHost,
      ui_host: CFG.uiHost,
      cookieless_mode: "always",      // no cookies, no local/session storage, no banner
      persistence: "memory",
      respect_dnt: true,
      autocapture: true,              // clicks on buttons, links, catalog tiles
      capture_pageview: "history_change",
      capture_pageleave: true,        // time on page + scroll depth
      enable_heatmaps: true,
      capture_dead_clicks: false,
      capture_performance: false,     // Cloudflare Web Analytics already covers Core Web Vitals
      disable_session_recording: true,
      disable_surveys: true,
      mask_personal_data_properties: true,
      before_send: beforeSend,
      debug: /[?&]sbd_analytics_debug=1/.test(location.search)
    });
    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", trackEmbeds);
    else trackEmbeds();
  }

  var s = d.createElement("script");
  s.src = CFG.apiHost + "/lib.js";
  s.async = true;
  s.onload = boot;
  (d.head || d.documentElement).appendChild(s);
`;
