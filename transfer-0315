export const homepageShareUrl = 'https://securebydesigninc.com/';
export const learningShareNote = 'If this helped you, help someone else find it.';
const feedback = {
  opened: 'Share options opened.',
  copied: 'Link copied. Ready to pass it on.',
  cancelled: 'You can copy the link instead.',
  manual: 'Select and copy the link below.',
};

export function publicShareUrl() {
  return homepageShareUrl;
}

export async function copyPublicLink(browser) {
  try {
    if (!browser.clipboard?.writeText) return 'manual';
    await browser.clipboard.writeText(homepageShareUrl);
    return 'copied';
  } catch {
    return 'manual';
  }
}

export async function sharePublicLink(browser) {
  if (typeof browser.share === 'function') {
    try {
      await browser.share({ title: 'Secure By Design', url: homepageShareUrl });
      return 'opened';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  return copyPublicLink(browser);
}

export function renderFooterShare() {
  return `<div class="footer-share" data-footer-share>
    <button type="button" class="footer-share-button" data-share-action title="Share Secure By Design">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>
      Pass it on
    </button>
    <output class="footer-share-status" aria-live="polite" aria-atomic="true"></output>
    <div class="footer-share-manual" hidden>
      <label for="footer-share-link">Secure By Design homepage</label>
      <input id="footer-share-link" type="text" readonly>
      <button type="button" class="footer-share-button" data-copy-action>Copy link</button>
    </div>
  </div>`;
}

export function mountFooterShare(root, browser) {
  const button = root.querySelector('[data-share-action]');
  const copyButton = root.querySelector('[data-copy-action]');
  const status = root.querySelector('output');
  const manual = root.querySelector('.footer-share-manual');
  const input = root.querySelector('input');
  let pending = false;
  let disposed = false;
  status.textContent = '';
  input.value = homepageShareUrl;
  manual.hidden = true;
  button.disabled = copyButton.disabled = false;

  async function run(copyOnly) {
    if (pending) return;
    pending = true;
    button.disabled = copyButton.disabled = true;
    status.textContent = 'Please wait…';
    try {
      const result = await (copyOnly
        ? copyPublicLink(browser)
        : sharePublicLink(browser));
      if (disposed) return;
      status.textContent = feedback[result];
      if (result === 'cancelled' || result === 'manual') manual.hidden = false;
    } finally {
      pending = false;
      if (!disposed) button.disabled = copyButton.disabled = false;
    }
  }
  const share = () => {
    void run(false);
  };
  const copy = () => {
    void run(true);
  };
  const select = () => input.select();
  button.addEventListener('click', share);
  copyButton.addEventListener('click', copy);
  input.addEventListener('focus', select);
  return () => {
    disposed = true;
    button.removeEventListener('click', share);
    copyButton.removeEventListener('click', copy);
    input.removeEventListener('focus', select);
  };
}
