import { detectGalleryContext, detectSearchContext, findNextSearchRangeUrl, parseResults, OBSERVED_RULES } from './parser.js';

function summarizeElement(element) {
  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || '',
    className: element.className || '',
    name: element.getAttribute('name') || '',
    value: element.value || element.getAttribute('value') || '',
    text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  };
}

function linkSummary(anchor, currentUrl) {
  let absoluteUrl = '';
  try {
    absoluteUrl = new URL(anchor.getAttribute('href') || '', currentUrl).toString();
  } catch {
    absoluteUrl = anchor.getAttribute('href') || '';
  }
  return {
    text: (anchor.textContent || '').replace(/\s+/g, ' ').trim(),
    href: anchor.getAttribute('href') || '',
    url: absoluteUrl,
    className: anchor.className || ''
  };
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

export function runDiscoveryFromDocument(doc = document, currentUrl = location.href) {
  const html = doc.documentElement.outerHTML;
  const context = detectSearchContext(html, currentUrl);
  const galleryContext = detectGalleryContext(html, currentUrl);
  const parsed = parseResults(html, currentUrl, 0);
  const next = findNextSearchRangeUrl(html, currentUrl);
  const keyword = context.keyword || '';
  const links = [...doc.querySelectorAll('a[href]')].map((anchor) => linkSummary(anchor, currentUrl));
  const keywordLinks = links.filter((link) => keyword && safeDecode(link.url).includes(keyword)).slice(0, 50);

  return {
    collectedAt: new Date().toISOString(),
    currentUrl,
    title: doc.title,
    context,
    galleryContext,
    observedRules: OBSERVED_RULES,
    inputCandidates: [...doc.querySelectorAll('input, select')].slice(0, 80).map(summarizeElement),
    resultAreaCandidates: [...doc.querySelectorAll('.gall_listwrap, table, tbody')].slice(0, 40).map(summarizeElement),
    repeatedPostCandidates: [...doc.querySelectorAll('tr')].filter((row) => row.querySelector('a[href*="/board/view/"]')).slice(0, 20).map(summarizeElement),
    searchRelatedLinks: links.filter((link) => /검색|search|s_keyword|search_pos/.test(`${link.text} ${link.href}`)).slice(0, 80),
    keywordPreservingLinks: keywordLinks,
    nextCandidates: next.candidates,
    parserSelectedRules: {
      resultTable: OBSERVED_RULES.resultTable,
      postRows: OBSERVED_RULES.postRows,
      nextSearch: OBSERVED_RULES.nextSearch
    },
    parserRejectedReason: next.status === 'uncertain' ? next.reason : '',
    sampleResults: parsed.results.slice(0, 3),
    parserErrors: parsed.errors
  };
}
