import { MESSAGES } from './src/messaging.js';
import { describeProgressError } from './src/errorDisplay.js';
import { createResultRow } from './src/resultDisplay.js';
import { filterResults } from './src/resultFilters.js';
import { buildSearchRequests } from './src/searchUrls.js';
import { getOptions, getResults, saveOptions } from './src/storage.js';

const elements = {
  siteStatus: document.querySelector('#siteStatus'),
  statusBadge: document.querySelector('#statusBadge'),
  galleryValue: document.querySelector('#galleryValue'),
  keywordValue: document.querySelector('#keywordValue'),
  searchTypeValue: document.querySelector('#searchTypeValue'),
  startUrlValue: document.querySelector('#startUrlValue'),
  startBtn: document.querySelector('#startBtn'),
  stopBtn: document.querySelector('#stopBtn'),
  clearBtn: document.querySelector('#clearBtn'),
  keywordInput: document.querySelector('#keywordInput'),
  maxResults: document.querySelector('#maxResults'),
  requestDelayMs: document.querySelector('#requestDelayMs'),
  dedupeResults: document.querySelector('#dedupeResults'),
  allowUncertainNextUrl: document.querySelector('#allowUncertainNextUrl'),
  stepValue: document.querySelector('#stepValue'),
  visitedValue: document.querySelector('#visitedValue'),
  resultCountValue: document.querySelector('#resultCountValue'),
  errorValue: document.querySelector('#errorValue'),
  lastRequestValue: document.querySelector('#lastRequestValue'),
  lastNextValue: document.querySelector('#lastNextValue'),
  titleFilter: document.querySelector('#titleFilter'),
  authorFilter: document.querySelector('#authorFilter'),
  recommendFilter: document.querySelector('#recommendFilter'),
  resultsList: document.querySelector('#resultsList'),
  visibleCount: document.querySelector('#visibleCount')
};

const state = {
  context: null,
  galleryContext: null,
  diagnostics: null,
  results: [],
  progress: null,
  keywordTouched: false,
  stopRequestedAt: 0,
  renderScheduled: false
};

function send(message) {
  return chrome.runtime.sendMessage(message);
}

function currentOptions() {
  return {
    maxResults: Number(elements.maxResults.value) || 30,
    requestDelayMs: Number(elements.requestDelayMs.value) || 300,
    dedupeResults: elements.dedupeResults.checked,
    allowUncertainNextUrl: elements.allowUncertainNextUrl.checked
  };
}

async function persistOptions() {
  await saveOptions(currentOptions());
}

function setStatus(status, description = '') {
  const value = status || 'idle';
  elements.statusBadge.textContent = value;
  elements.statusBadge.className = `badge ${value}`;
  elements.statusBadge.title = description;
  if (description) {
    elements.statusBadge.dataset.description = description;
    elements.statusBadge.tabIndex = 0;
  } else {
    delete elements.statusBadge.dataset.description;
    elements.statusBadge.removeAttribute('tabindex');
  }
}

function renderContext(context) {
  state.context = context;
  elements.galleryValue.textContent = context?.galleryName || context?.galleryId || 'unknown';
  elements.keywordValue.textContent = context?.keyword || 'unknown';
  elements.searchTypeValue.textContent = context?.searchType || 'unknown';
  elements.startUrlValue.textContent = context?.currentUrl || 'unknown';
  elements.siteStatus.textContent = context?.ok ? '지원 가능한 검색 결과 페이지로 인식했습니다.' : '검색 결과 페이지로 인식하지 못했습니다.';
  if (!state.keywordTouched && context?.keyword) {
    elements.keywordInput.value = context.keyword;
  }
}

function renderGalleryContext(galleryContext) {
  state.galleryContext = galleryContext;
  if (state.context?.ok) return;
  elements.galleryValue.textContent = galleryContext?.galleryName || galleryContext?.galleryId || 'unknown';
  elements.keywordValue.textContent = '입력 필요';
  elements.searchTypeValue.textContent = galleryContext?.searchType || 'unknown';
  elements.startUrlValue.textContent = galleryContext?.currentUrl || 'unknown';
  elements.siteStatus.textContent = galleryContext?.ok ? '지원 가능한 갤러리 목록 페이지로 인식했습니다.' : '지원 가능한 디시인사이드 갤러리 페이지가 아닙니다.';
}

function shouldIgnoreProgress(progress = {}) {
  return state.stopRequestedAt > 0
    && progress.status === 'running'
    && state.progress?.status === 'stopped';
}

function updateProgress(progress = {}) {
  if (shouldIgnoreProgress(progress)) return;
  state.progress = progress;
  if (progress.status && progress.status !== 'running' && progress.status !== 'stopped') {
    state.stopRequestedAt = 0;
  }
  setStatus(progress.status, describeProgressError(progress));
  elements.stepValue.textContent = progress.step ?? 0;
  elements.visitedValue.textContent = progress.visitedCount ?? progress.visitedUrls?.length ?? 0;
  elements.resultCountValue.textContent = progress.resultCount ?? progress.results?.length ?? state.results.length;
  elements.errorValue.textContent = progress.error?.message || progress.error?.code || '없음';
  elements.lastRequestValue.textContent = progress.lastRequestUrl || '없음';
  elements.lastNextValue.textContent = progress.lastNextUrl || '없음';
  if (progress.results) {
    state.results = progress.results;
    scheduleRenderResults();
  }
}

function filteredResults() {
  return filterResults(state.results, {
    title: elements.titleFilter.value,
    author: elements.authorFilter.value,
    minRecommends: elements.recommendFilter.value
  });
}

function renderResults() {
  const items = filteredResults();
  elements.visibleCount.textContent = `${items.length}개 표시`;
  elements.resultsList.textContent = '';
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = '표시할 결과가 없습니다.';
    elements.resultsList.append(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    fragment.append(createResultRow(document, item));
  });
  elements.resultsList.append(fragment);
}

function scheduleRenderResults() {
  if (state.renderScheduled) return;
  state.renderScheduled = true;
  requestAnimationFrame(() => {
    state.renderScheduled = false;
    renderResults();
  });
}

function renderDiagnostics(diagnostics) {
  state.diagnostics = diagnostics;
}

async function runDiagnosis() {
  const result = await send({ type: MESSAGES.RUN_DISCOVERY });
  if (!result?.ok) {
    elements.siteStatus.textContent = result?.error || '진단 실패';
    renderDiagnostics(result);
    return null;
  }
  renderContext(result.discovery.context);
  renderGalleryContext(result.discovery.galleryContext);
  renderDiagnostics(result.discovery);
  return result.discovery;
}

async function startCrawl() {
  await persistOptions();
  state.stopRequestedAt = 0;
  setStatus('running', '현재 페이지를 확인한 뒤 수집을 시작합니다.');
  elements.siteStatus.textContent = '현재 페이지를 확인하는 중입니다.';
  const discovery = await runDiagnosis();
  const context = discovery?.context;
  const galleryContext = discovery?.galleryContext;
  const crawlContext = context?.ok ? context : galleryContext;
  const startUrl = crawlContext?.currentUrl;
  if (!startUrl || !crawlContext?.ok) {
    setStatus('error', '지원 가능한 디시인사이드 갤러리 페이지가 아닙니다.');
    elements.siteStatus.textContent = galleryContext?.supportsInternalSearch === false
      ? '현재 페이지 형식에서는 내부 검색 URL을 만들 수 없습니다.'
      : '지원 가능한 디시인사이드 갤러리 페이지가 아닙니다.';
    return;
  }
  if (!context?.ok && !elements.keywordInput.value.trim()) {
    setStatus('error', '갤러리 메인에서는 수집할 검색어를 입력하세요.');
    elements.siteStatus.textContent = '갤러리 메인에서는 수집할 검색어를 입력하세요.';
    return;
  }
  const searchRequests = buildSearchRequests(crawlContext, elements.keywordInput.value);
  if (searchRequests.length === 0) {
    setStatus('error', '수집할 검색어를 찾지 못했습니다.');
    elements.siteStatus.textContent = '수집할 검색어를 입력하거나 검색 결과 페이지에서 실행하세요.';
    return;
  }
  state.results = [];
  renderResults();
  elements.siteStatus.textContent = '수집 중입니다. 글 목록이 아래에 쌓입니다.';
  const result = await send({
    type: MESSAGES.START_CRAWL,
    startUrl: searchRequests[0].url,
    searchRequests,
    context: crawlContext,
    options: currentOptions()
  });
  updateProgress(result);
  if (result?.diagnostics) renderDiagnostics(result.diagnostics);
}

function requestStop() {
  state.stopRequestedAt = Date.now();
  state.progress = { ...(state.progress || {}), status: 'stopped' };
  setStatus('stopped', '중지 요청을 보냈습니다.');
  elements.siteStatus.textContent = '중지 요청을 보냈습니다.';
  send({ type: MESSAGES.STOP_CRAWL });
}

async function init() {
  const options = await getOptions();
  elements.maxResults.value = options.maxResults;
  elements.requestDelayMs.value = options.requestDelayMs;
  elements.dedupeResults.checked = options.dedupeResults;
  elements.allowUncertainNextUrl.checked = options.allowUncertainNextUrl;
  state.results = await getResults();
  renderResults();
  const contextResult = await send({ type: MESSAGES.GET_CONTEXT });
  if (contextResult?.context) renderContext(contextResult.context);
  if (contextResult?.galleryContext) renderGalleryContext(contextResult.galleryContext);
}

elements.startBtn.addEventListener('click', startCrawl);
elements.stopBtn.addEventListener('click', requestStop);
elements.keywordInput.addEventListener('input', () => {
  state.keywordTouched = true;
});
elements.clearBtn.addEventListener('click', async () => {
  await send({ type: MESSAGES.CLEAR_RESULTS });
  state.stopRequestedAt = 0;
  state.results = [];
  renderResults();
  updateProgress({ status: 'stopped' });
  elements.siteStatus.textContent = '취합 목록과 최근 상태를 비웠습니다.';
});
[elements.maxResults, elements.requestDelayMs, elements.dedupeResults, elements.allowUncertainNextUrl].forEach((control) => {
  control.addEventListener('change', persistOptions);
});
[elements.titleFilter, elements.authorFilter, elements.recommendFilter].forEach((control) => {
  control.addEventListener('input', renderResults);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === MESSAGES.CRAWL_PROGRESS) {
    updateProgress(message.progress);
  }
});

init();
