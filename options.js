import { getOptions, saveOptions } from './src/storage.js';

const fields = {
  maxResults: document.querySelector('#maxResults'),
  requestDelayMs: document.querySelector('#requestDelayMs'),
  dedupeResults: document.querySelector('#dedupeResults'),
  allowUncertainNextUrl: document.querySelector('#allowUncertainNextUrl')
};
const status = document.querySelector('#status');

function readOptions() {
  return {
    maxResults: Number(fields.maxResults.value) || 100,
    requestDelayMs: Number(fields.requestDelayMs.value) || 1200,
    dedupeResults: fields.dedupeResults.checked,
    allowUncertainNextUrl: fields.allowUncertainNextUrl.checked
  };
}

async function init() {
  const options = await getOptions();
  fields.maxResults.value = options.maxResults;
  fields.requestDelayMs.value = options.requestDelayMs;
  fields.dedupeResults.checked = options.dedupeResults;
  fields.allowUncertainNextUrl.checked = options.allowUncertainNextUrl;
}

document.querySelector('#save').addEventListener('click', async () => {
  await saveOptions(readOptions());
  status.textContent = '저장했습니다.';
});

init();
