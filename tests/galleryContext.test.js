import assert from 'node:assert/strict';
import { detectGalleryContext, detectSearchContext } from '../src/parser.js';

const mainHtml = `
  <input id="gallery_name" value="아피스토그라마">
  <input id="list_url" value="/mgallery/board/lists/?id=apistogramma">
`;

test('detectGalleryContext accepts regular gallery list URL without keyword', () => {
  const context = detectGalleryContext('', 'https://gall.dcinside.com/board/lists/?id=programming');

  assert.equal(context.ok, true);
  assert.equal(context.galleryId, 'programming');
  assert.equal(context.listPath, '/board/lists/');
  assert.equal(context.canonicalListUrl, 'https://gall.dcinside.com/board/lists/?id=programming');
  assert.equal(context.supportsInternalSearch, true);
});

test('detectGalleryContext accepts minor gallery list URL without keyword', () => {
  const context = detectGalleryContext(mainHtml, 'https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma');

  assert.equal(context.ok, true);
  assert.equal(context.galleryId, 'apistogramma');
  assert.equal(context.galleryName, '아피스토그라마');
  assert.equal(context.listPath, '/mgallery/board/lists/');
  assert.equal(context.entryKind, 'minor-list');
  assert.equal(context.supportsInternalSearch, true);
});

test('detectGalleryContext accepts gall view and enter list entries', () => {
  const view = detectGalleryContext('', 'https://gall.dcinside.com/mgallery/board/view/?id=apistogramma&no=720217&page=1');
  const enter = detectGalleryContext(mainHtml, 'https://enter.dcinside.com/mgallery/board/lists/?id=apistogramma');

  assert.equal(view.ok, true);
  assert.equal(view.entryKind, 'minor-view');
  assert.equal(view.canonicalListUrl, 'https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma');
  assert.equal(enter.ok, true);
  assert.equal(enter.sourceHost, 'enter.dcinside.com');
  assert.equal(enter.canonicalListUrl, 'https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma');
});

test('detectGalleryContext can read gallery id from hidden list_url', () => {
  const context = detectGalleryContext(mainHtml, 'https://gall.dcinside.com/mgallery/board/lists/');

  assert.equal(context.ok, true);
  assert.equal(context.galleryId, 'apistogramma');
});

test('detectGalleryContext rejects list pages without gallery id', () => {
  const context = detectGalleryContext('', 'https://gall.dcinside.com/board/lists/');

  assert.equal(context.ok, false);
  assert.equal(context.supportsInternalSearch, false);
  assert.equal(context.reasons.length, 1);
});

test('detectGalleryContext rejects unsupported pathnames', () => {
  const context = detectGalleryContext('', 'https://gall.dcinside.com/mini/board/lists/?id=mini');

  assert.equal(context.ok, false);
  assert.equal(context.supportsInternalSearch, false);
});

test('detectGalleryContext defaults search type when it is missing', () => {
  const context = detectGalleryContext('', 'https://gall.dcinside.com/board/lists/?id=programming');

  assert.equal(context.searchType, 'search_subject_memo');
});

test('detectSearchContext still rejects main list page without keyword', () => {
  const context = detectSearchContext('', 'https://gall.dcinside.com/board/lists/?id=programming');

  assert.equal(context.ok, false);
});
