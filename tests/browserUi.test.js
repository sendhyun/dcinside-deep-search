import assert from 'node:assert/strict';
import { configureSidePanel, openMainUi } from '../src/browserUi.js';

test('openMainUi uses sidePanel when it is available', async () => {
  const calls = [];
  const chromeApi = {
    sidePanel: { open: async (options) => calls.push(options) },
    tabs: { create: async () => assert.fail('tab fallback should not run') },
    runtime: { getURL: () => 'chrome-extension://id/sidepanel.html' }
  };

  assert.equal(await openMainUi(chromeApi, { windowId: 3 }), 'side-panel');
  assert.deepEqual(calls, [{ windowId: 3 }]);
});

test('openMainUi falls back to an extension tab when sidePanel is absent or rejects', async () => {
  const opened = [];
  const chromeApi = {
    sidePanel: { open: async () => { throw new Error('API unavailable'); } },
    tabs: { create: async (options) => opened.push(options) },
    runtime: { getURL: (path) => `chrome-extension://id/${path}` }
  };

  assert.equal(await openMainUi(chromeApi, { windowId: 3 }), 'tab');
  assert.deepEqual(opened, [{ url: 'chrome-extension://id/sidepanel.html' }]);
});

test('configureSidePanel ignores unavailable or rejecting implementations', async () => {
  configureSidePanel({});
  configureSidePanel({ sidePanel: { setPanelBehavior: () => Promise.reject(new Error('API unavailable')) } });
});
