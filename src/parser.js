import { ERROR_CODES, makeError } from './errors.js';
import { parseDcinsideEntryUrl } from './dcinsideUrls.js';

export const PARSER_VERSION = 'dcinside-observed-2026-07-11-v2';

export const OBSERVED_RULES = Object.freeze({
  contextInputs: {
    keyword: '#s_keyword',
    searchType: '#s_type',
    currentParams: '#current_params',
    galleryName: '#gallery_name',
    listUrl: '#list_url'
  },
  resultTable: '.gall_listwrap.list table.gall_list',
  postRows: 'tr.ub-content.us-post[data-no]',
  titleLink: '.gall_tit a[href*="/board/view/"]:not(.reply_numbox)',
  author: '.gall_writer',
  date: '.gall_date',
  views: '.gall_count',
  recommends: '.gall_recommend',
  commentCount: '.reply_numbox .reply_num',
  nextSearch: 'a.search_next[href]'
});

const BLOCK_TEXT_PATTERNS = [
  /captcha/i,
  /자동입력/,
  /비정상.{0,12}접근/,
  /접근.{0,12}차단/,
  /잠시 후 다시 이용/,
  /too many requests/i
];

function parseDocument(html) {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(html, 'text/html');
  }
  return null;
}

function text(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function stripTags(value) {
  return text(String(value || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' '));
}

function attr(fragment, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
  return fragment.match(pattern)?.[1] || '';
}

function inputValue(html, id) {
  const pattern = new RegExp(`<input\\b[^>]*id=["']${id}["'][^>]*>`, 'i');
  const match = html.match(pattern);
  return match ? attr(match[0], 'value') : '';
}

function absolutize(href, currentUrl) {
  try {
    return new URL(href.replaceAll('&amp;', '&'), currentUrl).toString();
  } catch {
    return '';
  }
}

function queryParam(url, key) {
  try {
    return new URL(url).searchParams.get(key) || '';
  } catch {
    return '';
  }
}

function extractGalleryId(html, currentUrl) {
  const fromUrl = queryParam(currentUrl, 'id');
  if (fromUrl) return fromUrl;
  const listUrl = inputValue(html, 'list_url');
  return queryParam(absolutize(listUrl, currentUrl), 'id');
}

function extractContextFallback(html, currentUrl) {
  return {
    galleryId: extractGalleryId(html, currentUrl),
    galleryName: inputValue(html, 'gallery_name'),
    keyword: inputValue(html, 's_keyword') || queryParam(currentUrl, 's_keyword'),
    searchType: inputValue(html, 's_type') || queryParam(currentUrl, 's_type'),
    currentParams: inputValue(html, 'current_params'),
    currentUrl,
    parserVersion: PARSER_VERSION
  };
}

function extractContextFromDoc(doc, html, currentUrl) {
  const read = (selector) => doc.querySelector(selector)?.getAttribute('value') || '';
  const listUrl = absolutize(read(OBSERVED_RULES.contextInputs.listUrl), currentUrl);
  return {
    galleryId: queryParam(currentUrl, 'id') || queryParam(listUrl, 'id'),
    galleryName: read(OBSERVED_RULES.contextInputs.galleryName),
    keyword: read(OBSERVED_RULES.contextInputs.keyword) || queryParam(currentUrl, 's_keyword'),
    searchType: read(OBSERVED_RULES.contextInputs.searchType) || queryParam(currentUrl, 's_type'),
    currentParams: read(OBSERVED_RULES.contextInputs.currentParams),
    currentUrl,
    parserVersion: PARSER_VERSION
  };
}

function entryError(entry) {
  const messages = {
    'invalid-url': '잘못된 URL입니다.',
    'unsupported-scheme': 'HTTPS 디시인사이드 URL만 지원합니다.',
    'credentials-not-allowed': '사용자 정보가 포함된 URL은 지원하지 않습니다.',
    'unsupported-port': '기본 HTTPS 포트가 아닌 URL은 지원하지 않습니다.',
    'unsupported-host': '지원하지 않는 디시인사이드 호스트입니다.',
    'unsupported-path': '지원하지 않는 갤러리 경로입니다.',
    'missing-gallery-id': '갤러리 id를 찾지 못했습니다.'
  };
  return makeError(ERROR_CODES.UNSUPPORTED_PAGE, messages[entry.reason] || '지원하지 않는 디시인사이드 URL입니다.', { reason: entry.reason });
}

export function detectBlockedPage(html, status = 200) {
  if (status === 403 || status === 429) {
    return { blocked: true, code: ERROR_CODES.BLOCKED_REQUEST, reason: `HTTP ${status}` };
  }
  // Normal DCInside pages include generic retry text inside JavaScript error handlers.
  // Block detection must inspect visible page text, not raw scripts.
  const visibleText = stripTags(html || '');
  const found = BLOCK_TEXT_PATTERNS.find((pattern) => pattern.test(visibleText));
  if (found) {
    return { blocked: true, code: ERROR_CODES.CAPTCHA_SUSPECTED, reason: String(found) };
  }
  return { blocked: false };
}

export function detectGalleryContext(html, currentUrl) {
  const doc = parseDocument(html);
  const context = doc ? extractContextFromDoc(doc, html, currentUrl) : extractContextFallback(html, currentUrl);
  const entry = parseDcinsideEntryUrl(currentUrl, context.galleryId);
  const reasons = [];

  if (!entry.ok) reasons.push(entryError(entry));

  return {
    ok: reasons.length === 0,
    galleryId: entry.galleryId || context.galleryId,
    galleryName: context.galleryName,
    listPath: entry.listPath,
    currentUrl,
    sourceUrl: entry.sourceUrl || currentUrl,
    sourceHost: entry.sourceHost,
    entryKind: entry.entryKind,
    canonicalListUrl: entry.canonicalListUrl,
    searchType: context.searchType || 'search_subject_memo',
    supportsInternalSearch: entry.ok,
    parserVersion: PARSER_VERSION,
    reasons
  };
}

export function detectSearchContext(html, currentUrl) {
  const doc = parseDocument(html);
  const context = doc ? extractContextFromDoc(doc, html, currentUrl) : extractContextFallback(html, currentUrl);
  const entry = parseDcinsideEntryUrl(currentUrl, context.galleryId);
  const reasons = [];
  if (!entry.ok) reasons.push(entryError(entry));
  if (!context.keyword) reasons.push(makeError(ERROR_CODES.KEYWORD_NOT_FOUND, '검색어를 찾지 못했습니다.'));
  if (!context.searchType) reasons.push(makeError(ERROR_CODES.UNSUPPORTED_PAGE, '검색 타입을 찾지 못했습니다.'));
  const next = findNextSearchRangeUrl(html, currentUrl);
  return {
    ok: reasons.length === 0,
    ...context,
    galleryId: entry.galleryId || context.galleryId,
    sourceUrl: entry.sourceUrl || currentUrl,
    sourceHost: entry.sourceHost,
    entryKind: entry.entryKind,
    listPath: entry.listPath,
    canonicalListUrl: entry.canonicalListUrl,
    hasNextSearchRange: next.status === 'ok',
    nextSearchRangeUrl: next.url,
    nextCandidates: next.candidates,
    reasons
  };
}

function cleanTitle(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll('em, .reply_numbox').forEach((node) => node.remove());
  return text(clone.textContent);
}

function parseCommentCount(value) {
  const match = String(value || '').match(/\[(\d+)\]/);
  return match ? Number(match[1]) : 0;
}

function parseDomRows(doc, currentUrl, searchStep, context) {
  const table = doc.querySelector(OBSERVED_RULES.resultTable);
  if (!table) {
    return { areaFound: false, results: [] };
  }
  const rows = [...table.querySelectorAll(OBSERVED_RULES.postRows)];
  const results = rows.map((row) => {
    const titleAnchor = row.querySelector(OBSERVED_RULES.titleLink);
    const title = titleAnchor ? cleanTitle(titleAnchor) : '';
    const href = titleAnchor?.getAttribute('href') || '';
    const url = href ? absolutize(href, currentUrl) : '';
    const writer = row.querySelector(OBSERVED_RULES.author);
    const author = writer?.getAttribute('data-nick') || text(writer?.querySelector('.nickname em')?.textContent) || text(writer?.textContent);
    const postId = row.getAttribute('data-no') || text(row.querySelector('.gall_num')?.textContent);
    if (!title || !url) return null;
    return {
      title,
      author,
      date: text(row.querySelector(OBSERVED_RULES.date)?.textContent),
      views: text(row.querySelector(OBSERVED_RULES.views)?.textContent),
      recommends: text(row.querySelector(OBSERVED_RULES.recommends)?.textContent),
      commentCount: parseCommentCount(row.querySelector(OBSERVED_RULES.commentCount)?.textContent),
      postId,
      url,
      galleryId: context.galleryId,
      keyword: context.keyword,
      searchType: context.searchType,
      searchStep,
      sourceUrl: currentUrl
    };
  }).filter(Boolean);
  return { areaFound: true, results };
}

function parseFallbackRows(html, currentUrl, searchStep, context) {
  const hasTable = /class=["'][^"']*\bgall_list\b/i.test(html);
  if (!hasTable) {
    return { areaFound: false, results: [] };
  }
  const rows = [...html.matchAll(/<tr\b[^>]*class=["'][^"']*\bus-post\b[^"']*["'][^>]*data-no=["']([^"']+)["'][^>]*>([\s\S]*?)<\/tr>/gi)];
  const results = rows.map((match) => {
    const rowAttrs = match[0].slice(0, match[0].indexOf('>') + 1);
    const body = match[2];
    const postId = attr(rowAttrs, 'data-no') || match[1];
    const titleCell = body.match(/<td\b[^>]*class=["'][^"']*\bgall_tit\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)?.[1] || '';
    const titleLink = titleCell.match(/<a\b(?![^>]*reply_numbox)[^>]*href=["']([^"']*\/board\/view\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
    const url = titleLink ? absolutize(titleLink[1], currentUrl) : '';
    const title = titleLink ? stripTags(titleLink[2]) : '';
    const writerCell = body.match(/<td\b[^>]*class=["'][^"']*\bgall_writer\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
    const writerAttrs = writerCell ? writerCell[0].slice(0, writerCell[0].indexOf('>') + 1) : '';
    const author = attr(writerAttrs, 'data-nick') || stripTags(writerCell?.[1] || '');
    const date = stripTags(body.match(/<td\b[^>]*class=["'][^"']*\bgall_date\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)?.[1] || '');
    const views = stripTags(body.match(/<td\b[^>]*class=["'][^"']*\bgall_count\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)?.[1] || '');
    const recommends = stripTags(body.match(/<td\b[^>]*class=["'][^"']*\bgall_recommend\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)?.[1] || '');
    const commentCount = parseCommentCount(titleCell.match(/class=["'][^"']*\breply_num\b[^"']*["'][^>]*>([^<]+)/i)?.[1]);
    if (!title || !url) return null;
    return { title, author, date, views, recommends, commentCount, postId, url, galleryId: context.galleryId, keyword: context.keyword, searchType: context.searchType, searchStep, sourceUrl: currentUrl };
  }).filter(Boolean);
  return { areaFound: true, results };
}

export function parseResults(html, currentUrl, searchStep = 0) {
  const blocked = detectBlockedPage(html, 200);
  if (blocked.blocked) {
    return { ok: false, results: [], errors: [makeError(blocked.code, blocked.reason)], diagnostics: { blocked } };
  }
  const doc = parseDocument(html);
  const context = doc ? extractContextFromDoc(doc, html, currentUrl) : extractContextFallback(html, currentUrl);
  const parsed = doc ? parseDomRows(doc, currentUrl, searchStep, context) : parseFallbackRows(html, currentUrl, searchStep, context);
  if (!parsed.areaFound) {
    return { ok: false, results: [], errors: [makeError(ERROR_CODES.RESULT_AREA_NOT_FOUND, '검색 결과 영역을 찾지 못했습니다.')], diagnostics: { rules: OBSERVED_RULES } };
  }
  return {
    ok: parsed.results.length > 0,
    results: parsed.results,
    errors: parsed.results.length > 0 ? [] : [makeError(ERROR_CODES.RESULT_PARSE_FAILED, '게시글 행을 찾지 못했거나 결과가 없습니다.')],
    diagnostics: { resultCount: parsed.results.length, rules: OBSERVED_RULES }
  };
}

function anchorsFromDoc(doc) {
  return [...doc.querySelectorAll('a[href]')].map((anchor) => ({
    href: anchor.getAttribute('href') || '',
    text: text(anchor.textContent),
    className: anchor.getAttribute('class') || ''
  }));
}

function anchorsFallback(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: attr(match[1], 'href'),
    text: stripTags(match[2]),
    className: attr(match[1], 'class')
  })).filter((anchor) => anchor.href);
}

function scoreNextCandidate(anchor, currentUrl, context) {
  const evidence = [];
  const href = anchor.href || '';
  if (!href || href.startsWith('javascript:')) return null;
  const url = absolutize(href, currentUrl);
  if (!url) return null;
  const nextEntry = parseDcinsideEntryUrl(url);
  if (!nextEntry.ok || nextEntry.sourceHost !== 'gall.dcinside.com' || !nextEntry.entryKind.endsWith('-list')) return null;
  const current = new URL(currentUrl);
  const next = new URL(url);
  if (nextEntry.galleryId !== (context.galleryId || queryParam(currentUrl, 'id'))) return null;
  let score = 0;
  if (anchor.className.split(/\s+/).includes('search_next')) {
    score += 4;
    evidence.push('class search_next');
  }
  if (/다음\s*검색/.test(anchor.text)) {
    score += 3;
    evidence.push('text 다음 검색');
  }
  if (queryParam(url, 'id') && queryParam(url, 'id') === (context.galleryId || queryParam(currentUrl, 'id'))) {
    score += 2;
    evidence.push('gallery id preserved');
  }
  if (queryParam(url, 's_keyword') && queryParam(url, 's_keyword') === (context.keyword || queryParam(currentUrl, 's_keyword'))) {
    score += 2;
    evidence.push('keyword preserved');
  }
  if (queryParam(url, 's_type') && queryParam(url, 's_type') === (context.searchType || queryParam(currentUrl, 's_type'))) {
    score += 2;
    evidence.push('search type preserved');
  }
  const currentSearchPos = current.searchParams.get('search_pos') || '';
  const nextSearchPos = next.searchParams.get('search_pos') || '';
  if (nextSearchPos && nextSearchPos !== currentSearchPos) {
    score += 4;
    evidence.push('search_pos changed');
    const currentNumber = Number(currentSearchPos);
    const nextNumber = Number(nextSearchPos);
    if (Number.isFinite(currentNumber) && Number.isFinite(nextNumber)) {
      evidence.push(`search_pos delta ${nextNumber - currentNumber}`);
    }
  }
  if (anchor.className.includes('page_next') || href.includes('ajax_list_search')) {
    score -= 8;
    evidence.push('excluded page pagination signal');
  }
  return { url, text: anchor.text, className: anchor.className, score, evidence };
}

export function findNextSearchRangeUrl(html, currentUrl) {
  const doc = parseDocument(html);
  const context = doc ? extractContextFromDoc(doc, html, currentUrl) : extractContextFallback(html, currentUrl);
  const anchors = doc ? anchorsFromDoc(doc) : anchorsFallback(html);
  const candidates = anchors.map((anchor) => scoreNextCandidate(anchor, currentUrl, context)).filter(Boolean).sort((a, b) => b.score - a.score);
  const confident = candidates.filter((candidate) => candidate.score >= 13);
  if (confident.length === 1) {
    return { status: 'ok', url: confident[0].url, candidates, reason: 'single confident observed search-range link' };
  }
  if (confident.length > 1) {
    return { status: 'uncertain', url: null, candidates: confident, reason: 'multiple confident next search-range candidates' };
  }
  return { status: 'none', url: null, candidates, reason: 'no confident next search-range link' };
}
