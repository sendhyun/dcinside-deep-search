import assert from 'node:assert/strict';
import { DEFAULT_OPTIONS } from '../src/crawler.js';
import { getOptions, saveOptions } from '../src/storage.js';

function installStorageMock(initial = {}) {
  const state = { ...initial };
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) {
          if (Array.isArray(key)) {
            return Object.fromEntries(key.map((item) => [item, state[item]]));
          }
          return { [key]: state[key] };
        },
        async set(values) {
          Object.assign(state, values);
        },
        async remove(keys) {
          keys.forEach((key) => delete state[key]);
        }
      }
    }
  };
  return state;
}

test('default options do not expose HTML cache usage', async () => {
  const state = installStorageMock({
    resultCache: {
      old: { status: 200, html: '<html>old</html>' }
    }
  });

  const options = await getOptions();

  assert.equal('useCache' in DEFAULT_OPTIONS, false);
  assert.equal('useCache' in options, false);
  assert.equal(options.maxResults, 30);
  assert.equal(options.requestDelayMs, 300);
  assert.equal(state.resultCache, undefined);
});

test('legacy saved options remove cache usage and stored HTML cache', async () => {
  const state = installStorageMock({
    options: {
      maxSearchSteps: 10,
      requestDelayMs: 1200,
      useCache: true,
      dedupeResults: true,
      allowUncertainNextUrl: false,
      maxRetryPerUrl: 1
    },
    resultCache: {
      old: { status: 200, html: '<html>old</html>' }
    }
  });

  const options = await getOptions();

  assert.equal('useCache' in options, false);
  assert.equal('useCache' in state.options, false);
  assert.equal(options.maxResults, 10);
  assert.equal('maxSearchSteps' in options, false);
  assert.equal(state.resultCache, undefined);
});

test('saved options ignore HTML cache usage', async () => {
  installStorageMock();

  await saveOptions({ useCache: true });
  const options = await getOptions();

  assert.equal('useCache' in options, false);
});

test('saved numeric options are clamped to the UI-supported range', async () => {
  installStorageMock();

  await saveOptions({
    maxResults: -3,
    requestDelayMs: -100,
    dedupeResults: true,
    allowUncertainNextUrl: false
  });
  const options = await getOptions();

  assert.equal(options.maxResults, 1);
  assert.equal(options.requestDelayMs, 300);
});

test('legacy maxSearchSteps migrates to maxResults when maxResults is missing', async () => {
  const state = installStorageMock({
    options: {
      maxSearchSteps: 37,
      requestDelayMs: 1200,
      dedupeResults: true,
      allowUncertainNextUrl: false
    }
  });

  const options = await getOptions();

  assert.equal(options.maxResults, 37);
  assert.equal('maxSearchSteps' in options, false);
  assert.equal(state.options.maxResults, 37);
  assert.equal('maxSearchSteps' in state.options, false);
});
