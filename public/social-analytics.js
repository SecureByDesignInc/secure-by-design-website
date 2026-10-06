// Standalone Community pages track only explicitly tagged social links.
// Use the existing Plausible outbound-click goal; leave pageviews and forms alone.
window.plausible = window.plausible || function () {
  (window.plausible.q = window.plausible.q || []).push(arguments);
};
window.plausible.init = window.plausible.init || function (options) {
  window.plausible.o = options || {};
};
window.plausible.init({
  autoCapturePageviews: false,
  outboundLinks: false,
  fileDownloads: false,
  formSubmissions: false,
  transformRequest: function (payload) {
    // Avoid query parameters and referrers on private Community routes.
    payload.u = window.location.origin + window.location.pathname;
    payload.r = null;
    return payload;
  }
});
