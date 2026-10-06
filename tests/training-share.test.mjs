import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  copyTrainingLink,
  shareTrainingLink,
  trainingShareUrl,
} from '../app/videos/training-share-utils.mjs';

test('training native sharing starts immediately and shares only the homepage', async () => {
  let payload;
  const result = shareTrainingLink({
    share: async (data) => {
      payload = data;
    },
    clipboard: {
      writeText: async () => assert.fail('must not copy after native share'),
    },
  });
  assert.deepEqual(payload, {
    title: 'Secure By Design',
    url: 'https://securebydesigninc.com/',
  });
  assert.equal(await result, 'opened');
});

test('cancelling native sharing does not overwrite the clipboard', async () => {
  assert.equal(
    await shareTrainingLink({
      share: async () => {
        throw Object.assign(new Error('cancelled'), { name: 'AbortError' });
      },
      clipboard: { writeText: async () => assert.fail('cancel must not copy') },
    }),
    'cancelled',
  );
});

test('unavailable native sharing copies the homepage and waits for completion', async () => {
  let finish;
  let written;
  let settled = false;
  const result = shareTrainingLink({
    clipboard: {
      writeText: (value) => {
        written = value;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    },
  });
  void result.then(() => {
    settled = true;
  });
  await Promise.resolve();
  assert.equal(settled, false);
  assert.equal(trainingShareUrl, 'https://securebydesigninc.com/');
  assert.equal(written, 'https://securebydesigninc.com/');
  finish();
  assert.equal(await result, 'copied');
});

test('non-cancellation share failures fall back to copying', async () => {
  let written;
  assert.equal(
    await shareTrainingLink({
      share: async () => {
        throw new Error('unavailable');
      },
      clipboard: {
        writeText: async (value) => {
          written = value;
        },
      },
    }),
    'copied',
  );
  assert.equal(written, 'https://securebydesigninc.com/');
});

test('missing or denied clipboard access offers manual copying', async () => {
  assert.equal(trainingShareUrl, 'https://securebydesigninc.com/');
  assert.equal(await shareTrainingLink({}), 'manual');
  assert.equal(
    await copyTrainingLink({
      clipboard: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    }),
    'manual',
  );
});
