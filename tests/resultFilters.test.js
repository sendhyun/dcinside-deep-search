import assert from 'node:assert/strict';
import { filterResults } from '../src/resultFilters.js';

test('filterResults keeps only results with enough recommendations', () => {
  const results = [
    { title: 'low', author: 'a', recommends: 4 },
    { title: 'exact', author: 'b', recommends: 5 },
    { title: 'high', author: 'c', recommends: 12 }
  ];

  assert.deepEqual(filterResults(results, { minRecommends: 5 }).map((item) => item.title), ['exact', 'high']);
});

test('filterResults treats an empty recommendation filter as no minimum', () => {
  const results = [
    { title: 'zero', author: 'a', recommends: 0 },
    { title: 'many', author: 'b', recommends: 10 }
  ];

  assert.deepEqual(filterResults(results, { minRecommends: '' }).map((item) => item.title), ['zero', 'many']);
});
