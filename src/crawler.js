import { ERROR_CODES, STATUS, makeError } from './errors.js';
import { createDelay, DEFAULT_REQUEST_DELAY_MS } from './rateLimit.js';
import { detectBlockedPage, findNextSearchRangeUrl, parseResults } from './parser.js';

export const DEFAULT_OPTIONS = Object.freeze({
  maxResults: 30,
  requestDelayMs: DEFAULT_REQUEST_DELAY_MS,
  dedupeResults: true,
  allowUncertainNextUrl: false,
  maxRetryPerUrl: 1
});

async function defaultFetchHtml(url, signal) {
  const response = await fetch(url, {
    credentials: 'include',
    signal,
    headers: {
      Accept: 'text/html,application/xhtml+xml'
    }
  });
  return { status: response.status, html: await response.text() };
}

function resultKey(item) {
  return item.postId || item.url;
}

async function fetchWithRetry(fetchHtml, url, signal, maxRetryPerUrl) {
  let attempt = 0;
  let lastError;
  while (attempt <= maxRetryPerUrl) {
    try {
      return await fetchHtml(url, signal);
    } catch (error) {
      lastError = error;
      if (signal?.aborted || error.name === 'AbortError') throw error;
      attempt += 1;
      if (attempt > maxRetryPerUrl) throw lastError;
    }
  }
  throw lastError;
}

export function createCrawler(deps = {}) {
  const fetchHtml = deps.fetchHtml || defaultFetchHtml;
  const delay = deps.delay || createDelay();
  const sendProgress = deps.sendProgress || (() => {});

  return {
    async run({ startUrl, options = {}, signal } = {}) {
      const config = { ...DEFAULT_OPTIONS, ...options };
      const queue = [startUrl];
      const visitedUrls = new Set();
      const resultMap = new Map();
      const diagnostics = [];
      let status = STATUS.RUNNING;
      let error = null;
      let step = 0;
      let lastRequestUrl = '';
      let lastNextUrl = '';
      const stopForAbort = () => {
        status = STATUS.STOPPED;
        error = makeError(ERROR_CODES.USER_STOPPED, '사용자가 중지했습니다.');
      };
      const stopForMaxResults = () => {
        status = STATUS.STOPPED;
        error = makeError(ERROR_CODES.MAX_RESULTS_REACHED, '최대 수집 글 수에 도달했습니다.');
      };
      const hasReachedMaxResults = () => resultMap.size >= config.maxResults;
      const progressSnapshot = () => ({
        status,
        step,
        visitedCount: visitedUrls.size,
        resultCount: resultMap.size,
        results: [...resultMap.values()],
        lastRequestUrl,
        lastNextUrl,
        error
      });

      while (queue.length > 0) {
        if (signal?.aborted) {
          stopForAbort();
          break;
        }

        const url = queue.shift();
        if (!url || visitedUrls.has(url)) continue;

        visitedUrls.add(url);
        lastRequestUrl = url;
        try {
          await delay(config.requestDelayMs, signal);
        } catch (delayError) {
          if (signal?.aborted || delayError.name === 'AbortError') {
            stopForAbort();
            break;
          }
          status = STATUS.ERROR;
          error = makeError(ERROR_CODES.NETWORK_ERROR, delayError.message, { url });
          break;
        }

        sendProgress(progressSnapshot());

        let response;
        try {
          response = await fetchWithRetry(fetchHtml, url, signal, config.maxRetryPerUrl);
        } catch (fetchError) {
          if (signal?.aborted || fetchError.name === 'AbortError') {
            stopForAbort();
            break;
          }
          status = STATUS.ERROR;
          error = makeError(ERROR_CODES.NETWORK_ERROR, fetchError.message, { url });
          break;
        }

        if (signal?.aborted) {
          stopForAbort();
          break;
        }

        const blocked = detectBlockedPage(response.html, response.status);
        if (blocked.blocked) {
          status = STATUS.BLOCKED;
          error = makeError(blocked.code, blocked.reason, { url, status: response.status });
          break;
        }

        const parsed = parseResults(response.html, url, step);
        diagnostics.push({ url, parse: parsed.diagnostics, errors: parsed.errors });
        const fatalParseError = parsed.errors.find((item) => item.code === ERROR_CODES.RESULT_AREA_NOT_FOUND);
        if (fatalParseError) {
          status = STATUS.ERROR;
          error = fatalParseError;
          break;
        }
        parsed.results.forEach((item) => {
          if (hasReachedMaxResults()) return;
          const key = config.dedupeResults ? resultKey(item) : `${resultKey(item)}:${resultMap.size}`;
          if (!resultMap.has(key)) {
            resultMap.set(key, item);
          }
        });
        if (signal?.aborted) {
          stopForAbort();
          break;
        }
        if (hasReachedMaxResults()) {
          stopForMaxResults();
          sendProgress(progressSnapshot());
          break;
        }
        sendProgress(progressSnapshot());
        if (signal?.aborted) {
          stopForAbort();
          break;
        }

        const next = findNextSearchRangeUrl(response.html, url);
        diagnostics.push({ url, next });
        if (next.status === 'ok') {
          lastNextUrl = next.url;
          if (!visitedUrls.has(next.url)) queue.push(next.url);
        } else if (next.status === 'uncertain') {
          lastNextUrl = next.candidates[0]?.url || '';
          if (config.allowUncertainNextUrl && lastNextUrl && !visitedUrls.has(lastNextUrl)) {
            queue.push(lastNextUrl);
          } else {
            status = STATUS.ERROR;
            error = makeError(ERROR_CODES.NEXT_URL_UNCERTAIN, '다음 검색범위 링크 후보가 불확실합니다.', { candidates: next.candidates });
            break;
          }
        } else {
          status = STATUS.COMPLETED;
          break;
        }

        step += 1;
        sendProgress(progressSnapshot());
      }

      if (status === STATUS.RUNNING) {
        status = STATUS.COMPLETED;
      }

      const finalState = {
        status,
        step,
        visitedUrls: [...visitedUrls],
        visitedCount: visitedUrls.size,
        results: [...resultMap.values()],
        resultCount: resultMap.size,
        lastRequestUrl,
        lastNextUrl,
        error,
        diagnostics
      };
      sendProgress(finalState);
      return finalState;
    }
  };
}
