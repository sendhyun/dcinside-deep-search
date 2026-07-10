export const MESSAGES = Object.freeze({
  GET_CONTEXT: 'GET_CONTEXT',
  RUN_DISCOVERY: 'RUN_DISCOVERY',
  START_CRAWL: 'START_CRAWL',
  STOP_CRAWL: 'STOP_CRAWL',
  CLEAR_RESULTS: 'CLEAR_RESULTS',
  CRAWL_PROGRESS: 'CRAWL_PROGRESS',
  OPEN_SIDE_PANEL: 'OPEN_SIDE_PANEL'
});

export function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}
