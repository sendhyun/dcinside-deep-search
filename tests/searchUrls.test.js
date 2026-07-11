import assert from 'node:assert/strict';
import { buildSearchRequests, buildSearchUrl, parseKeywordInput } from '../src/searchUrls.js';

const minorContext = {
  currentUrl: 'https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma&page=1&search_pos=-712643&s_type=search_subject_memo&s_keyword=%EC%9E%90%EB%B0%98',
  galleryId: 'apistogramma',
  searchType: 'search_subject_memo',
  keyword: '자반'
};

test('parseKeywordInput splits newline keywords', () => {
  assert.deepEqual(parseKeywordInput('축양장\n여과기\n조명', '자반'), ['축양장', '여과기', '조명']);
});

test('parseKeywordInput splits comma keywords', () => {
  assert.deepEqual(parseKeywordInput('축양장, 여과기, 조명', '자반'), ['축양장', '여과기', '조명']);
});

test('parseKeywordInput trims blanks and removes duplicates', () => {
  assert.deepEqual(parseKeywordInput(' 축양장, , 여과기\n축양장 ', '자반'), ['축양장', '여과기']);
});

test('parseKeywordInput uses fallback keyword for empty input', () => {
  assert.deepEqual(parseKeywordInput('', '자반'), ['자반']);
});

test('buildSearchUrl removes search_pos from current URL', () => {
  const url = buildSearchUrl(minorContext, '축양장');

  assert.equal(new URL(url).searchParams.has('search_pos'), false);
});

test('buildSearchUrl sets id, first page, search type, and keyword', () => {
  const url = new URL(buildSearchUrl(minorContext, '축양장'));

  assert.equal(url.searchParams.get('id'), 'apistogramma');
  assert.equal(url.searchParams.get('page'), '1');
  assert.equal(url.searchParams.get('s_type'), 'search_subject_memo');
  assert.equal(url.searchParams.get('s_keyword'), '축양장');
});

test('buildSearchUrl preserves regular gallery list pathname', () => {
  const url = buildSearchUrl(
    {
      ...minorContext,
      currentUrl: 'https://gall.dcinside.com/board/lists/?id=aquarium&page=3&search_pos=-2&s_type=search_subject&s_keyword=자반'
    },
    '여과기'
  );

  assert.equal(new URL(url).pathname, '/board/lists/');
});

test('buildSearchUrl preserves minor gallery list pathname', () => {
  const url = buildSearchUrl(minorContext, '여과기');

  assert.equal(new URL(url).pathname, '/mgallery/board/lists/');
});

test('buildSearchRequests maps parsed keywords to sequential request objects', () => {
  const requests = buildSearchRequests(minorContext, '축양장, 여과기');

  assert.deepEqual(
    requests.map((request) => request.keyword),
    ['축양장', '여과기']
  );
  assert.equal(requests[0].url, buildSearchUrl(minorContext, '축양장'));
  assert.equal(requests[1].url, buildSearchUrl(minorContext, '여과기'));
});

test('buildSearchUrl creates a search URL from minor gallery main context', () => {
  const url = new URL(buildSearchUrl({
    currentUrl: 'https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma',
    galleryId: 'apistogramma',
    searchType: 'search_subject_memo'
  }, '자반 축양장'));

  assert.equal(url.pathname, '/mgallery/board/lists/');
  assert.equal(url.searchParams.get('id'), 'apistogramma');
  assert.equal(url.searchParams.get('page'), '1');
  assert.equal(url.searchParams.get('s_type'), 'search_subject_memo');
  assert.equal(url.searchParams.get('s_keyword'), '자반 축양장');
  assert.equal(url.searchParams.has('search_pos'), false);
});

test('buildSearchUrl creates a search URL from regular gallery main context with default search type', () => {
  const url = new URL(buildSearchUrl({
    currentUrl: 'https://gall.dcinside.com/board/lists/?id=programming',
    galleryId: 'programming'
  }, '테스트'));

  assert.equal(url.pathname, '/board/lists/');
  assert.equal(url.searchParams.get('id'), 'programming');
  assert.equal(url.searchParams.get('page'), '1');
  assert.equal(url.searchParams.get('s_type'), 'search_subject_memo');
  assert.equal(url.searchParams.get('s_keyword'), '테스트');
});

test('buildSearchUrl canonicalizes enter and view contexts before searching', () => {
  const url = new URL(buildSearchUrl({
    currentUrl: 'https://enter.dcinside.com/mgallery/board/lists/?id=apistogramma',
    galleryId: 'apistogramma',
    searchType: 'search_subject_memo'
  }, '테스트'));
  const viewUrl = new URL(buildSearchUrl({
    currentUrl: 'https://gall.dcinside.com/mgallery/board/view/?id=apistogramma&no=720217&page=1',
    galleryId: 'apistogramma',
    searchType: 'search_subject_memo'
  }, '테스트'));

  assert.equal(url.origin, 'https://gall.dcinside.com');
  assert.equal(url.pathname, '/mgallery/board/lists/');
  assert.equal(viewUrl.origin, 'https://gall.dcinside.com');
  assert.equal(viewUrl.searchParams.has('no'), false);
});

test('buildSearchRequests can require explicit input for gallery main context', () => {
  const requests = buildSearchRequests({
    currentUrl: 'https://gall.dcinside.com/board/lists/?id=programming',
    galleryId: 'programming',
    searchType: 'search_subject_memo'
  }, '');

  assert.deepEqual(requests, []);
});
