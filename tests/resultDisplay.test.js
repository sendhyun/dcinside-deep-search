import assert from 'node:assert/strict';
import { createResultRow, formatResultMeta } from '../src/resultDisplay.js';

function createFakeDocument() {
  return {
    createElement(tagName) {
      return {
        tagName: tagName.toUpperCase(),
        children: [],
        className: '',
        href: '',
        target: '',
        rel: '',
        textContent: '',
        append(...nodes) {
          this.children.push(...nodes);
        },
        querySelector(selector) {
          return this.children.find((child) => selector === `.${child.className}`) || null;
        }
      };
    }
  };
}

test('formatResultMeta hides post id and displays one-based search step', () => {
  const meta = formatResultMeta({
    author: '코너',
    date: '03.18',
    views: 217,
    recommends: 0,
    commentCount: 11,
    postId: '676663',
    searchStep: 4
  });

  assert.equal(meta, '코너 | 03.18 | 조회 217 | 추천 0 | 댓글 11 | 단계 5');
  assert.equal(meta.includes('글 676663'), false);
});

test('formatResultMeta appends matched keywords when present', () => {
  const meta = formatResultMeta({
    author: '코너',
    date: '03.18',
    views: 217,
    recommends: 0,
    commentCount: 11,
    searchStep: 4,
    matchedKeywords: ['축양장', '여과기']
  });

  assert.equal(meta, '코너 | 03.18 | 조회 217 | 추천 0 | 댓글 11 | 단계 5 | 검색어 축양장, 여과기');
});

test('createResultRow makes the whole result row a link', () => {
  const row = createResultRow(createFakeDocument(), {
    title: '자반 축양장 추천좀',
    url: 'https://gall.dcinside.com/mgallery/board/view/?id=apistogramma&no=676663',
    author: '코너',
    date: '03.18',
    views: 217,
    recommends: 0,
    commentCount: 11,
    searchStep: 4
  });

  assert.equal(row.tagName, 'A');
  assert.equal(row.className, 'result-row');
  assert.equal(row.href, 'https://gall.dcinside.com/mgallery/board/view/?id=apistogramma&no=676663');
  assert.equal(row.target, '_blank');
  assert.equal(row.rel, 'noreferrer');
  assert.equal(row.querySelector('.result-title').tagName, 'SPAN');
  assert.equal(row.querySelector('.result-meta').textContent, '코너 | 03.18 | 조회 217 | 추천 0 | 댓글 11 | 단계 5');
});
