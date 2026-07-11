import assert from 'node:assert/strict';
import { runDiscoveryFromDocument } from '../src/discovery.js';

function createAnchor(href, text = 'broken link') {
  return {
    textContent: text,
    className: '',
    getAttribute(name) {
      return name === 'href' ? href : '';
    }
  };
}

function createFakeDocument(html, anchors = []) {
  return {
    title: 'fake dcinside page',
    documentElement: { outerHTML: html },
    querySelectorAll(selector) {
      if (selector === 'a[href]') return anchors;
      return [];
    }
  };
}

test('runDiscoveryFromDocument ignores malformed percent-encoded links', () => {
  const html = `
    <input id="s_keyword" value="test">
    <input id="s_type" value="search_subject_memo">
    <div class="gall_listwrap list"><table class="gall_list"><tbody>
      <tr class="ub-content us-post" data-no="1">
        <td class="gall_tit"><a href="/board/view/?id=programming&no=1&s_keyword=test">one</a></td>
      </tr>
    </tbody></table></div>`;
  const doc = createFakeDocument(html, [
    createAnchor('/board/lists/?id=programming&s_keyword=%ED')
  ]);

  const discovery = runDiscoveryFromDocument(
    doc,
    'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test'
  );

  assert.equal(discovery.context.ok, true);
  assert.equal(discovery.galleryContext.ok, true);
  assert.deepEqual(discovery.keywordPreservingLinks, []);
});

test('runDiscoveryFromDocument includes gallery context for main list pages', () => {
  const html = '<input id="gallery_name" value="프로그래밍">';
  const discovery = runDiscoveryFromDocument(
    createFakeDocument(html),
    'https://gall.dcinside.com/board/lists/?id=programming'
  );

  assert.equal(discovery.context.ok, false);
  assert.equal(discovery.galleryContext.ok, true);
  assert.equal(discovery.galleryContext.galleryId, 'programming');
});
