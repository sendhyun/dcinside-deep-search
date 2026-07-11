import assert from 'node:assert/strict';
import { displayResults, mergeResults } from '../src/resultAggregation.js';

test('mergeResults keeps later keyword results as candidates before display limiting', () => {
  const resultMap = new Map();

  mergeResults(resultMap, [
    { galleryId: 'g', postId: '100', title: 'A newer' },
    { galleryId: 'g', postId: '80', title: 'A older' }
  ], 'A');
  mergeResults(resultMap, [
    { galleryId: 'g', postId: '120', title: 'B newer' },
    { galleryId: 'g', postId: '90', title: 'B older' }
  ], 'B');

  assert.equal(resultMap.size, 4);
  assert.deepEqual(displayResults(resultMap, 2).map((item) => item.postId), ['120', '100']);
});

test('mergeResults preserves duplicate rows and matched keyword discovery order', () => {
  const resultMap = new Map();

  mergeResults(resultMap, [
    { galleryId: 'g', postId: '100', title: 'same post' }
  ], 'A');
  mergeResults(resultMap, [
    { galleryId: 'g', postId: '100', title: 'same post again' },
    { galleryId: 'g', postId: '120', title: 'B newer' }
  ], 'B');

  assert.equal(resultMap.size, 2);
  assert.deepEqual(resultMap.get('g:100').matchedKeywords, ['A', 'B']);
  assert.deepEqual(displayResults(resultMap, 10).map((item) => item.postId), ['120', '100']);
});
