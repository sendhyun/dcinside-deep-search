import assert from 'node:assert/strict';
import { sortMergedResults } from '../src/resultOrdering.js';

test('sortMergedResults interleaves multi-keyword results by numeric post id descending', () => {
  const results = [
    { postId: '100', keyword: 'A' },
    { postId: '80', keyword: 'A' },
    { postId: '120', keyword: 'B' },
    { postId: '90', keyword: 'B' }
  ];

  const sorted = sortMergedResults(results);

  assert.deepEqual(sorted.map((item) => item.postId), ['120', '100', '90', '80']);
});

test('sortMergedResults keeps merged keyword rows intact', () => {
  const duplicate = { postId: '100', matchedKeywords: ['A', 'B'] };
  const sorted = sortMergedResults([
    { postId: '80', matchedKeywords: ['A'] },
    duplicate,
    { postId: '120', matchedKeywords: ['B'] }
  ]);

  assert.equal(sorted.length, 3);
  assert.deepEqual(sorted[1].matchedKeywords, ['A', 'B']);
  assert.equal(sorted[1], duplicate);
});

test('sortMergedResults handles missing numeric post ids without mutating items', () => {
  const unreadableFirst = { postId: '', searchStep: 2, title: 'first unreadable' };
  const unreadableSecond = { url: 'https://example.test/post', searchStep: 2, title: 'second unreadable' };
  const numeric = { postId: '120', searchStep: 1, title: 'numeric' };
  const results = [unreadableFirst, numeric, unreadableSecond];

  const sorted = sortMergedResults(results);

  assert.deepEqual(sorted, [numeric, unreadableFirst, unreadableSecond]);
  assert.deepEqual(results, [unreadableFirst, numeric, unreadableSecond]);
});
