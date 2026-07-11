import { MESSAGES } from './src/messaging.js';
import { openMainUi } from './src/browserUi.js';

const output = document.querySelector('#output');
const status = document.querySelector('#status');

document.querySelector('#openPanel').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const openedAs = await openMainUi(chrome, tab);
    status.textContent = openedAs === 'side-panel' ? '사이드 패널을 열었습니다.' : '확장 탭에서 도구를 열었습니다.';
    window.close();
  } catch (error) {
    status.textContent = `도구를 열지 못했습니다: ${error.message}`;
  }
});

document.querySelector('#diagnose').addEventListener('click', async () => {
  const result = await chrome.runtime.sendMessage({ type: MESSAGES.RUN_DISCOVERY });
  output.textContent = JSON.stringify(result, null, 2);
});
