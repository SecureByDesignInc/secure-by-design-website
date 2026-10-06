import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  copyPublicLink,
  mountFooterShare,
  publicShareUrl,
  renderFooterShare,
  sharePublicLink,
} from '../public/footer-share.mjs';

const origin = 'https://securebydesigninc.com';
const homepage = origin + '/';
const flush = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

class Element {
  disabled = false;
  hidden = false;
  textContent = '';
  value = '';
  selections = 0;
  listeners = new Map();
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }
  dispatch(type) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
  select() { this.selections += 1; }
}

function footer() {
  const nodes = {
    button: new Element(),
    copyButton: new Element(),
    status: new Element(),
    manual: new Element(),
    input: new Element(),
  };
  const selectors = new Map([
    ['[data-share-action]', nodes.button],
    ['[data-copy-action]', nodes.copyButton],
    ['output', nodes.status],
    ['.footer-share-manual', nodes.manual],
    ['input', nodes.input],
  ]);
  return {
    ...nodes,
    root: {
      querySelector(selector) {
        assert.ok(selectors.has(selector), `Unexpected selector: ${selector}`);
        return selectors.get(selector);
      },
      set innerHTML(_value) { assert.fail('Mounted controls must not be replaced'); },
    },
  };
}

test('every public page shares the homepage without page, query, or fragment data', () => {
  for (const path of ['/', '/videos', '/inside-the-network', '/rmf-series', '/careers']) {
    assert.equal(publicShareUrl(`${origin}${path}?email=private@example.invalid#secret-token`), homepage);
  }
  assert.equal(publicShareUrl('/videos///?token=secret#episode-library'), homepage);
  assert.equal(publicShareUrl('/career-explorer?profile=private#saved'), homepage);
  assert.equal(publicShareUrl('/blog/what-is-active-directory#notes'), homepage);
  assert.equal(publicShareUrl('/career-explorer/roles/321?name=private'), homepage);
});

test('private, unknown, external, and malformed destinations share only the homepage', () => {
  for (const value of [
    '/account?token=secret', '/my-progress#recovery/secret',
    '/career-records', '/resource-subscribers', '/community-contributions',
    '/resource-preferences#unsubscribe/secret', '/signin-with-chatgpt?return_to=/career-records',
    '/api/career-records/private-id', '/blog/private-notes', '/career-explorer/roles/999',
    '/videos/private-id', 'https://elsewhere.example/videos?token=secret',
    '//elsewhere.example/videos', 'http://securebydesigninc.com/videos',
    'javascript:alert(1)', 'https://[invalid',
  ]) assert.equal(publicShareUrl(value), homepage, value);
});

test('native sharing starts immediately with the Secure By Design title and homepage', async () => {
  let payload;
  const operation = sharePublicLink({
    share: async (data) => { payload = data; },
    clipboard: { writeText: async () => assert.fail('Native sharing must not copy') },
  }, '/videos?email=private#secret');
  assert.deepEqual(payload, { title: 'Secure By Design', url: homepage });
  assert.equal(await operation, 'opened');
});

test('native cancellation never writes to the clipboard', async () => {
  assert.equal(await sharePublicLink({
    share: async () => { throw Object.assign(new Error('Cancelled'), { name: 'AbortError' }); },
    clipboard: { writeText: async () => assert.fail('Cancellation must not copy') },
  }, '/videos'), 'cancelled');
});

test('unsupported or failed native sharing waits for a successful homepage copy', async () => {
  const write = deferred();
  let copied;
  let settled = false;
  const operation = sharePublicLink({ clipboard: { writeText: (value) => {
    copied = value;
    return write.promise;
  } } }, '/my-progress?token=secret');
  void operation.then(() => { settled = true; });
  await flush();
  assert.equal(settled, false);
  assert.equal(copied, homepage);
  write.resolve();
  assert.equal(await operation, 'copied');

  assert.equal(await sharePublicLink({
    share: async () => { throw new Error('Sharing blocked'); },
    clipboard: { writeText: async (value) => { copied = value; } },
  }, '/rmf-series#prepare'), 'copied');
  assert.equal(copied, homepage);
});

test('missing or rejected clipboard access uses manual copying without false success', async () => {
  assert.equal(await sharePublicLink({}, '/videos'), 'manual');
  assert.equal(await copyPublicLink({ clipboard: {
    writeText: async () => { throw new Error('Permission denied'); },
  } }, '/videos'), 'manual');
});

test('footer markup exposes a labeled manual link and persistent polite status', () => {
  const markup = renderFooterShare();
  assert.match(markup, /<button[^>]*type="button"[^>]*data-share-action/);
  assert.match(markup, /Pass it on/);
  assert.match(markup, /<output[^>]*aria-live="polite"[^>]*aria-atomic="true"><\/output>/);
  assert.match(markup, /<label for="footer-share-link">Secure By Design homepage<\/label>/);
  assert.match(markup, /<input id="footer-share-link"[^>]*readonly/);
});

test('mounted footer rejects duplicate in-flight clicks and re-enables controls afterward', async () => {
  const view = footer();
  const request = deferred();
  let calls = 0;
  const cleanup = mountFooterShare(view.root, {
    share: () => { calls += 1; return request.promise; },
  }, '/videos');
  assert.equal(view.input.value, homepage);
  view.button.dispatch('click');
  view.button.dispatch('click');
  view.copyButton.dispatch('click');
  assert.equal(calls, 1);
  assert.equal(view.button.disabled, true);
  assert.equal(view.copyButton.disabled, true);
  assert.equal(view.status.textContent, 'Please wait…');
  request.resolve();
  await flush();
  assert.equal(view.status.textContent, 'Share options opened.');
  assert.equal(view.button.disabled, false);
  assert.equal(view.copyButton.disabled, false);
  view.button.dispatch('click');
  await flush();
  assert.equal(calls, 2);
  cleanup();
});

test('manual controls stay mounted during and after copying and support selecting the URL', async () => {
  const view = footer();
  const browser = { share: async () => { throw { name: 'AbortError' }; } };
  const cleanup = mountFooterShare(view.root, browser, '/resource-preferences#unsubscribe/secret');
  view.button.dispatch('click');
  await flush();
  assert.equal(view.manual.hidden, false);
  assert.equal(view.input.value, homepage);
  view.input.dispatch('focus');
  assert.equal(view.input.selections, 1);
  const originalInput = view.input;
  const originalCopyButton = view.copyButton;
  const write = deferred();
  browser.clipboard = { writeText: (value) => {
    assert.equal(value, homepage);
    return write.promise;
  } };
  view.copyButton.dispatch('click');
  assert.equal(view.manual.hidden, false);
  write.resolve();
  await flush();
  assert.equal(view.status.textContent, 'Link copied. Ready to pass it on.');
  assert.equal(view.manual.hidden, false);
  assert.equal(view.root.querySelector('input'), originalInput);
  assert.equal(view.root.querySelector('[data-copy-action]'), originalCopyButton);
  assert.equal(view.copyButton.disabled, false);
  cleanup();
});

test('cleanup removes listeners and an old pending request cannot alter a remounted footer', async () => {
  const view = footer();
  const request = deferred();
  let oldCalls = 0;
  const cleanup = mountFooterShare(view.root, {
    share: () => { oldCalls += 1; return request.promise; },
  }, '/videos');
  view.button.dispatch('click');
  cleanup();
  view.button.dispatch('click');
  view.input.dispatch('focus');
  assert.equal(oldCalls, 1);
  assert.equal(view.input.selections, 0);
  const cleanupAgain = mountFooterShare(view.root, {}, '/rmf-series');
  request.resolve();
  await flush();
  assert.equal(view.status.textContent, '');
  assert.equal(view.input.value, homepage);
  assert.equal(view.button.disabled, false);
  view.button.dispatch('click');
  await flush();
  assert.equal(view.status.textContent, 'Select and copy the link below.');
  assert.equal(view.manual.hidden, false);
  cleanupAgain();
});
