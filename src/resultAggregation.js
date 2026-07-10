import { sortMergedResults } from './resultOrdering.js';

export function resultKey(item) {
  return item.postId ? `${item.galleryId || ''}:${item.postId}` : item.url;
}

export function mergeResults(resultMap, results = [], keyword = '') {
  results.forEach((item) => {
    const key = resultKey(item);
    const existing = resultMap.get(key);

    if (existing) {
      const keywords = new Set(existing.matchedKeywords || [existing.keyword].filter(Boolean));
      if (keyword) keywords.add(keyword);
      resultMap.set(key, { ...existing, matchedKeywords: [...keywords] });
      return;
    }

    resultMap.set(key, {
      ...item,
      matchedKeywords: keyword ? [keyword] : [item.keyword].filter(Boolean)
    });
  });
}

export function displayResults(resultMap, maxResults = Number.POSITIVE_INFINITY) {
  return sortMergedResults([...resultMap.values()]).slice(0, maxResults);
}
