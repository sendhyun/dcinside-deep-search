import assert from 'node:assert/strict';
import { resultsToCsv } from '../src/csv.js';
import { createDelay, DEFAULT_REQUEST_DELAY_MS } from '../src/rateLimit.js';

test('resultsToCsv escapes commas, quotes, and newlines', () => {
  const csv = resultsToCsv([
    {
      galleryId: 'programming',
      keyword: 'a,b',
      searchType: 'search_subject_memo',
      title: 'line "one"\nline two',
      author: 'tester',
      date: '26/07/06',
      views: '12',
      recommends: '1',
      commentCount: 3,
      postId: '2929405',
      url: 'https://gall.dcinside.com/board/view/?id=programming&no=2929405',
      searchStep: 1,
      sourceUrl: 'https://gall.dcinside.com/board/lists/?id=programming'
    }
  ]);

  assert.match(csv, /^index,galleryId,keyword,searchType,title,/);
  assert.match(csv, /"a,b"/);
  assert.match(csv, /"line ""one""\nline two"/);
});

test('resultsToCsv neutralizes spreadsheet formula-leading values', () => {
  const csv = resultsToCsv([
    {
      galleryId: 'programming',
      keyword: '=cmd|test',
      searchType: 'search_subject_memo',
      title: '+SUM(1,1)',
      author: '@user',
      date: '26/07/06',
      views: '12',
      recommends: '1',
      commentCount: 0,
      postId: '1',
      url: 'https://gall.dcinside.com/board/view/?id=programming&no=1',
      searchStep: 1,
      sourceUrl: 'https://gall.dcinside.com/board/lists/?id=programming'
    }
  ]);

  assert.match(csv, /"'=cmd\|test"/);
  assert.match(csv, /"'\+SUM\(1,1\)"/);
  assert.match(csv, /'@user/);
});

test('createDelay waits at least the requested time', async () => {
  const delay = createDelay();
  const started = Date.now();
  await delay(20);
  assert.ok(Date.now() - started >= 18);
  assert.equal(DEFAULT_REQUEST_DELAY_MS, 300);
});
