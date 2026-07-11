import assert from 'node:assert/strict';
import { CANONICAL_ORIGIN, parseDcinsideEntryUrl, toCanonicalGalleryListUrl } from '../src/dcinsideUrls.js';

test('canonicalizes gall minor list URLs', () => {
  const parsed = parseDcinsideEntryUrl('https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.entryKind, 'minor-list');
  assert.equal(parsed.canonicalListUrl, `${CANONICAL_ORIGIN}/mgallery/board/lists/?id=apistogramma`);
});

test('canonicalizes gall minor view URLs without post-only parameters', () => {
  const parsed = parseDcinsideEntryUrl('https://gall.dcinside.com/mgallery/board/view/?id=apistogramma&no=720217&page=1&s_type=search_subject_memo&s_keyword=%EC%9E%90%EB%B0%98&search_pos=-1');
  const canonical = new URL(parsed.canonicalListUrl);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.entryKind, 'minor-view');
  assert.equal(canonical.origin, CANONICAL_ORIGIN);
  assert.equal(canonical.pathname, '/mgallery/board/lists/');
  assert.equal(canonical.searchParams.get('id'), 'apistogramma');
  assert.equal(canonical.searchParams.get('s_keyword'), '자반');
  assert.equal(canonical.searchParams.has('no'), false);
  assert.equal(canonical.searchParams.has('page'), false);
  assert.equal(canonical.searchParams.has('search_pos'), false);
});

test('canonicalizes enter list URLs to gall', () => {
  const parsed = parseDcinsideEntryUrl('https://enter.dcinside.com/mgallery/board/lists/?id=apistogramma');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.sourceHost, 'enter.dcinside.com');
  assert.equal(parsed.canonicalListUrl, `${CANONICAL_ORIGIN}/mgallery/board/lists/?id=apistogramma`);
});

test('canonicalizes regular view and list paths with or without trailing slash', () => {
  const view = parseDcinsideEntryUrl('https://gall.dcinside.com/board/view?id=programming&no=1');
  const list = parseDcinsideEntryUrl('https://gall.dcinside.com/board/lists/?id=programming');

  assert.equal(view.entryKind, 'regular-view');
  assert.equal(view.canonicalListUrl, `${CANONICAL_ORIGIN}/board/lists/?id=programming`);
  assert.equal(list.entryKind, 'regular-list');
  assert.equal(toCanonicalGalleryListUrl(list.sourceUrl), `${CANONICAL_ORIGIN}/board/lists/?id=programming`);
});

test('rejects unsupported or unsafe entry URLs', () => {
  const cases = [
    'https://gall.dcinside.com/mgallery/board/lists/',
    'https://gall.dcinside.com/mini/board/lists/?id=mini',
    'http://gall.dcinside.com/board/lists/?id=programming',
    'https://gall.dcinside.com:444/board/lists/?id=programming',
    'https://user:pass@gall.dcinside.com/board/lists/?id=programming',
    'https://evil.dcinside.com/board/lists/?id=programming',
    'https://dcinside.com.evil.test/board/lists/?id=programming',
    'https://gall-dcinside.com/board/lists/?id=programming',
    'javascript:alert(1)'
  ];

  for (const input of cases) {
    assert.equal(parseDcinsideEntryUrl(input).ok, false, input);
  }
});
