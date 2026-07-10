import { MESSAGES } from './src/messaging.js';

const output = document.querySelector('#output');
const status = document.querySelector('#status');

document.querySelector('#openPanel').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (chrome.sidePanel?.open && tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    window.close();
  } else {
    status.textContent = '브라우저가 sidePanel API를 지원하지 않습니다.';
  }
});

document.querySelector('#diagnose').addEventListener('click', async () => {
  const result = await chrome.runtime.sendMessage({ type: MESSAGES.RUN_DISCOVERY });
  output.textContent = JSON.stringify(result, null, 2);
});
