import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const backgroundSource = await readFile(new URL('../background.js', import.meta.url), 'utf8');
const aggregationSource = await readFile(new URL('../src/resultAggregation.js', import.meta.url), 'utf8');

test('background fetch path does not read or write HTML cache', () => {
  assert.doesNotMatch(backgroundSource, /getCachedSearchResult/);
  assert.doesNotMatch(backgroundSource, /saveCachedSearchResult/);
  assert.doesNotMatch(backgroundSource, /createUrlCacheKey/);
  assert.doesNotMatch(backgroundSource, /options\.useCache/);
});

test('background handles searchRequests sequentially and merges matched keywords', () => {
  assert.match(backgroundSource, /payload\.searchRequests/);
  assert.match(backgroundSource, /for\s*\(\s*const\s+searchRequest\s+of\s+searchRequests\s*\)/);
  assert.match(backgroundSource, /await\s+crawler\.run\(\s*\{/);
  assert.match(backgroundSource, /mergeResults\(\s*resultMap,\s*result\.results,\s*searchRequest\.keyword\s*\)/);
  assert.match(aggregationSource, /matchedKeywords/);
  assert.doesNotMatch(backgroundSource, /Promise\.all/);
});

test('background validates active tabs and crawl URLs against the canonical gallery policy', () => {
  assert.match(backgroundSource, /parseDcinsideEntryUrl\(tab\.url/);
  assert.match(backgroundSource, /function\s+validCrawlUrl/);
  assert.match(backgroundSource, /isCanonicalGalleryListUrl/);
  assert.match(backgroundSource, /CANONICAL_ORIGIN/);
  assert.match(backgroundSource, /허용되지 않은 다음 검색 URL/);
});

test('background checks abort before starting the next search and before expensive final work', () => {
  assert.match(backgroundSource, /function\s+isCurrentRunAborted\s*\(/);
  assert.match(backgroundSource, /if\s*\(\s*isCurrentRunAborted\(\s*abortController\s*\)\s*\)\s*break/);
  assert.match(backgroundSource, /const\s+result\s*=\s*await\s+crawler\.run\(\s*\{[\s\S]*?\}\s*\);\s*if\s*\(\s*isCurrentRunAborted\(\s*abortController\s*\)\s*\)/);
  assert.match(backgroundSource, /if\s*\(\s*isCurrentRunAborted\(\s*abortController\s*\)\s*\)\s*\{\s*markStopped\(result\);\s*\}/);
  assert.match(backgroundSource, /mergeResults\([\s\S]*?if\s*\(\s*isCurrentRunAborted\(\s*abortController\s*\)\s*\)\s*\{\s*markStopped\(result\)/);
  assert.match(backgroundSource, /if\s*\(\s*isCurrentRunAborted\(\s*abortController\s*\)\s*&&\s*result\.status\s*!==\s*STATUS\.STOPPED\s*\)/);
  assert.match(backgroundSource, /if\s*\(\s*isCurrentRunAborted\(\s*abortController\s*\)\s*\)\s*\{\s*markStopped\(result\);\s*\}\s*if\s*\(\s*isStaleRun\(\s*abortController\s*\)\s*\)/);
  assert.match(backgroundSource, /if\s*\(\s*isStaleRun\(\s*abortController\s*\)\s*\)\s*\{\s*return\s+result;\s*\}\s*await\s+saveResults/);
});

test('background always sends a stopped final progress when the active run is aborted', () => {
  assert.match(backgroundSource, /function\s+markStopped\s*\(/);
  assert.match(backgroundSource, /result\.status\s*=\s*STATUS\.STOPPED/);
  assert.match(backgroundSource, /makeError\(ERROR_CODES\.USER_STOPPED/);
  assert.match(backgroundSource, /broadcast\(\s*\{\s*type:\s*MESSAGES\.CRAWL_PROGRESS,\s*progress:\s*result\s*\}\s*\)/);
});

test('background does not stop later search requests when aggregate display maxResults is reached', () => {
  assert.doesNotMatch(backgroundSource, /function\s+hasReachedMaxResults\s*\(/);
  assert.doesNotMatch(backgroundSource, /function\s+markMaxResultsReached\s*\(/);
  assert.doesNotMatch(backgroundSource, /if\s*\(\s*hasReachedMaxResults\(\s*resultMap,\s*options\s*\)\s*\)\s*break/);
  assert.match(backgroundSource, /mergeResults\(previewMap,\s*progress\.results\s*\|\|\s*\[\],\s*keyword\)/);
  assert.doesNotMatch(backgroundSource, /aggregateProgress\.resultCount\s*>=\s*options\.maxResults[\s\S]*?abortController\.abort\(\)/);
  assert.match(backgroundSource, /mergeResults\(resultMap,\s*result\.results,\s*searchRequest\.keyword\)/);
  assert.match(backgroundSource, /result\.error\?\.code\s*===\s*ERROR_CODES\.MAX_RESULTS_REACHED/);
  assert.match(backgroundSource, /displayResults\(resultMap,\s*options\.maxResults\)/);
});

test('background exposes aggregate results through sorted merged ordering', () => {
  assert.match(backgroundSource, /import\s+\{\s*displayResults,\s*mergeResults\s*\}\s+from\s+'\.\/src\/resultAggregation\.js'/);
  assert.match(backgroundSource, /const\s+results\s*=\s*displayResults\(previewMap,\s*maxResults\)/);
  assert.match(backgroundSource, /const\s+results\s*=\s*displayResults\(resultMap,\s*options\.maxResults\)/);
  assert.match(backgroundSource, /const\s+fallbackResults\s*=\s*displayResults\(resultMap,\s*options\.maxResults\)/);
  assert.match(backgroundSource, /results:\s*fallbackResults/);
  assert.doesNotMatch(backgroundSource, /results:\s*\[\.\.\.resultMap\.values\(\)\]/);
  assert.doesNotMatch(backgroundSource, /results:\s*\[\.\.\.previewMap\.values\(\)\]/);
});
