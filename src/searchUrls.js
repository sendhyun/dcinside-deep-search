export function parseKeywordInput(input = '', fallbackKeyword = '') {
  const source = input.trim() ? input : fallbackKeyword;
  const seen = new Set();
  return String(source || '')
    .split(/[\n,]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .filter((keyword) => {
      if (seen.has(keyword)) return false;
      seen.add(keyword);
      return true;
    });
}

export function buildSearchUrl(context, keyword) {
  const canonicalListUrl = context.canonicalListUrl || toCanonicalGalleryListUrl(context.currentUrl, context.galleryId);
  if (!canonicalListUrl) return '';
  const nextUrl = new URL(canonicalListUrl);
  const galleryId = context.galleryId || nextUrl.searchParams.get('id') || '';
  const searchType = context.searchType || nextUrl.searchParams.get('s_type') || 'search_subject_memo';

  nextUrl.searchParams.set('id', galleryId);
  nextUrl.searchParams.set('page', '1');
  nextUrl.searchParams.set('s_type', searchType);
  nextUrl.searchParams.set('s_keyword', keyword);

  return nextUrl.toString();
}

export function buildSearchRequests(context, keywordInput = '') {
  if (!context?.currentUrl && !context?.canonicalListUrl) return [];
  return parseKeywordInput(keywordInput, context.keyword)
    .map((keyword) => ({ keyword, url: buildSearchUrl(context, keyword) }))
    .filter((request) => request.url);
}
import { toCanonicalGalleryListUrl } from './dcinsideUrls.js';
