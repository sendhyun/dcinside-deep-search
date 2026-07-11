import { createCrawler } from './src/crawler.js';
import { MESSAGES } from './src/messaging.js';
import { clearAllLocalData, getOptions, saveContext, saveDiagnostics, saveResults } from './src/storage.js';
import { ERROR_CODES, STATUS, makeError } from './src/errors.js';
import { displayResults, mergeResults } from './src/resultAggregation.js';
import { configureSidePanel, openMainUi } from './src/browserUi.js';
import { CANONICAL_ORIGIN, isCanonicalGalleryListUrl, parseDcinsideEntryUrl } from './src/dcinsideUrls.js';

let currentRun = null;

chrome.runtime.onInstalled.addListener(() => {
  configureSidePanel(chrome);
});

chrome.action.onClicked?.addListener(async (tab) => {
  await openMainUi(chrome, tab).catch(() => {});
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function askContent(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function unsupportedPageResult(url) {
  const entry = parseDcinsideEntryUrl(url || '');
  const messages = {
    'unsupported-host': '지원하지 않는 디시인사이드 호스트입니다.',
    'unsupported-path': '지원하지 않는 갤러리 경로입니다.',
    'missing-gallery-id': '갤러리 id를 찾지 못했습니다.'
  };
  return {
    ok: false,
    error: makeError(ERROR_CODES.UNSUPPORTED_PAGE, messages[entry.reason] || '지원 가능한 디시인사이드 갤러리 페이지가 아닙니다.', { reason: entry.reason })
  };
}

function supportedTab(tab) {
  if (!tab?.id) return { ok: false, result: { ok: false, error: makeError(ERROR_CODES.UNSUPPORTED_PAGE, '활성 탭을 찾지 못했습니다.') } };
  const entry = parseDcinsideEntryUrl(tab.url || '');
  return entry.ok ? { ok: true, entry } : { ok: false, result: unsupportedPageResult(tab.url) };
}

function validCrawlUrl(url, galleryId = '') {
  return isCanonicalGalleryListUrl(url, galleryId) && new URL(url).origin === CANONICAL_ORIGIN;
}

function broadcast(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
}

function isCurrentRunAborted(abortController) {
  return abortController.signal.aborted || currentRun?.abortController !== abortController;
}

function isStaleRun(abortController) {
  return currentRun?.abortController !== abortController;
}

function markStopped(result) {
  result.status = STATUS.STOPPED;
  result.error = makeError(ERROR_CODES.USER_STOPPED, '사용자가 중지했습니다.');
  return result;
}

function mergedProgress(resultMap, progress, keyword, searchIndex, totalSearches, completedVisitedCount, maxResults) {
  const previewMap = new Map(resultMap);
  mergeResults(previewMap, progress.results || [], keyword);
  const results = displayResults(previewMap, maxResults);
  return {
    ...progress,
    visitedCount: completedVisitedCount + (progress.visitedCount || 0),
    results,
    resultCount: results.length,
    currentKeyword: keyword,
    currentSearchIndex: searchIndex,
    totalSearches
  };
}

async function runDiscovery() {
  const tab = await getActiveTab();
  const active = supportedTab(tab);
  if (!active.ok) return active.result;
  const result = await askContent(tab.id, { type: MESSAGES.RUN_DISCOVERY });
  if (result?.ok) {
    await saveContext(result.discovery.context);
    await saveDiagnostics(result.discovery);
  }
  return result;
}

async function startCrawl(payload) {
  const requestedSearches = Array.isArray(payload.searchRequests) && payload.searchRequests.length > 0
    ? payload.searchRequests
    : [{ url: payload.startUrl, keyword: payload.context?.keyword || '' }];
  const invalidRequest = requestedSearches.find((request) => !validCrawlUrl(request.url, payload.context?.galleryId));
  if (invalidRequest) {
    return {
      status: STATUS.ERROR,
      results: [],
      resultCount: 0,
      diagnostics: [],
      error: makeError(ERROR_CODES.UNSUPPORTED_PAGE, '수집 URL은 gall.dcinside.com의 갤러리 목록 URL이어야 합니다.', { url: invalidRequest.url })
    };
  }
  if (currentRun) {
    currentRun.abortController.abort();
  }
  const abortController = new AbortController();
  currentRun = { abortController };
  const options = { ...(await getOptions()), ...(payload.options || {}) };
  const searchRequests = requestedSearches;
  const resultMap = new Map();
  const visitedUrls = new Set();
  const diagnostics = [];
  let finalResult = null;

  for (const searchRequest of searchRequests) {
    if (isCurrentRunAborted(abortController)) break;

    const currentSearchIndex = searchRequests.indexOf(searchRequest) + 1;
    const galleryId = parseDcinsideEntryUrl(searchRequest.url).galleryId;
    const crawler = createCrawler({
      fetchHtml: async (url, signal) => {
        if (!validCrawlUrl(url, galleryId)) {
          throw new Error('허용되지 않은 다음 검색 URL입니다.');
        }
        const response = await fetch(url, {
          credentials: 'include',
          signal,
          headers: { Accept: 'text/html,application/xhtml+xml' }
        });
        const html = await response.text();
        return { status: response.status, html };
      },
      sendProgress: (progress) => {
        if (isCurrentRunAborted(abortController)) {
          broadcast({ type: MESSAGES.CRAWL_PROGRESS, progress: { status: STATUS.STOPPED } });
          return;
        }
        const aggregateProgress = mergedProgress(
          resultMap,
          progress,
          searchRequest.keyword,
          currentSearchIndex,
          searchRequests.length,
          visitedUrls.size,
          options.maxResults
        );
        broadcast({ type: MESSAGES.CRAWL_PROGRESS, progress: aggregateProgress });
      }
    });

    const result = await crawler.run({
      startUrl: searchRequest.url,
      options: {
        ...options,
        maxResults: options.maxResults
      },
      signal: abortController.signal
    });
    if (isCurrentRunAborted(abortController)) {
      markStopped(result);
    }
    (result.visitedUrls || []).forEach((url) => visitedUrls.add(url));
    if (isCurrentRunAborted(abortController)) {
      markStopped(result);
    }
    mergeResults(resultMap, result.results, searchRequest.keyword);
    if (result.error?.code === ERROR_CODES.MAX_RESULTS_REACHED) {
      result.status = STATUS.COMPLETED;
      result.error = null;
    }
    if (isCurrentRunAborted(abortController)) {
      markStopped(result);
    }
    diagnostics.push(...(result.diagnostics || []));
    const results = displayResults(resultMap, options.maxResults);
    finalResult = {
      ...result,
      visitedUrls: [...visitedUrls],
      visitedCount: visitedUrls.size,
      results,
      resultCount: results.length,
      diagnostics,
      currentKeyword: searchRequest.keyword,
      currentSearchIndex,
      totalSearches: searchRequests.length
    };

    if (isCurrentRunAborted(abortController)) break;
    if (result.status !== STATUS.COMPLETED) break;
  }

  const fallbackResults = displayResults(resultMap, options.maxResults);
  const result = finalResult || {
    status: abortController.signal.aborted ? STATUS.STOPPED : STATUS.COMPLETED,
    step: 0,
    visitedUrls: [...visitedUrls],
    visitedCount: visitedUrls.size,
    results: fallbackResults,
    resultCount: fallbackResults.length,
    lastRequestUrl: '',
    lastNextUrl: '',
    error: null,
    diagnostics,
    currentSearchIndex: 0,
    totalSearches: searchRequests.length
  };
  if (isCurrentRunAborted(abortController) && result.status !== STATUS.STOPPED) {
    markStopped(result);
  }

  if (isCurrentRunAborted(abortController)) {
    markStopped(result);
  }
  if (isStaleRun(abortController)) {
    return result;
  }
  await saveResults(result.results);
  await saveDiagnostics(result.diagnostics);
  broadcast({ type: MESSAGES.CRAWL_PROGRESS, progress: result });
  if (currentRun?.abortController === abortController) {
    currentRun = null;
  }
  return result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message?.type === MESSAGES.GET_CONTEXT) {
      const tab = await getActiveTab();
      const active = supportedTab(tab);
      const result = active.ok ? await askContent(tab.id, { type: MESSAGES.GET_CONTEXT }) : active.result;
      sendResponse(result);
      return;
    }
    if (message?.type === MESSAGES.RUN_DISCOVERY) {
      sendResponse(await runDiscovery());
      return;
    }
    if (message?.type === MESSAGES.START_CRAWL) {
      startCrawl(message).catch((error) => {
        broadcast({
          type: MESSAGES.CRAWL_PROGRESS,
          progress: {
            status: STATUS.ERROR,
            error: { code: 'CRAWL_START_FAILED', message: error.message }
          }
        });
        currentRun = null;
      });
      sendResponse({ ok: true, status: STATUS.RUNNING });
      return;
    }
    if (message?.type === MESSAGES.STOP_CRAWL) {
      currentRun?.abortController.abort();
      broadcast({ type: MESSAGES.CRAWL_PROGRESS, progress: { status: STATUS.STOPPED } });
      sendResponse({ ok: true });
      return;
    }
    if (message?.type === MESSAGES.CLEAR_RESULTS) {
      await clearAllLocalData();
      sendResponse({ ok: true });
      return;
    }
    sendResponse({ ok: false, error: '알 수 없는 메시지입니다.' });
  })();
  return true;
});
