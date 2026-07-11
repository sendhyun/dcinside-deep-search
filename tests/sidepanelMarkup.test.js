import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sidepanelHtml = await readFile(new URL('../sidepanel.html', import.meta.url), 'utf8');
const optionsHtml = await readFile(new URL('../options.html', import.meta.url), 'utf8');

function labelForInput(id) {
  const pattern = new RegExp(`<label\\b([^>]*)>\\s*<input\\b[^>]*id=["']${id}["'][^>]*>`, 'i');
  const match = sidepanelHtml.match(pattern);
  return match?.[1] || '';
}

test('collection setting checkboxes expose hover descriptions', () => {
  const expected = {
    dedupeResults: '같은 글',
    allowUncertainNextUrl: '불확실한 다음 링크'
  };

  for (const [id, text] of Object.entries(expected)) {
    const attrs = labelForInput(id);
    assert.match(attrs, /class=["'][^"']*\bsetting-toggle\b/);
    assert.match(attrs, /data-description=["'][^"']+["']/);
    assert.match(attrs, new RegExp(text));
  }
});

test('list filters expose title author and minimum recommendation controls only', () => {
  assert.match(sidepanelHtml, /id=["']titleFilter["']/);
  assert.match(sidepanelHtml, /id=["']authorFilter["']/);
  assert.match(sidepanelHtml, /id=["']recommendFilter["']/);
  assert.doesNotMatch(sidepanelHtml, /id=["']urlFilter["']/);
  assert.doesNotMatch(sidepanelHtml, /id=["']stepFilter["']/);
  assert.doesNotMatch(sidepanelHtml, /id=["']sortMode["']/);
});

test('list filter controls keep visible labels when fields have values', () => {
  const expected = {
    titleFilter: '제목',
    authorFilter: '작성자',
    recommendFilter: '최소 추천 수'
  };

  for (const [id, label] of Object.entries(expected)) {
    const pattern = new RegExp(`<label\\b[^>]*class=["'][^"']*\\bfilter-field\\b[^"']*["'][^>]*>\\s*<span>${label}</span>\\s*<input\\b[^>]*id=["']${id}["']`, 'i');
    assert.match(sidepanelHtml, pattern);
  }

  assert.doesNotMatch(sidepanelHtml, /placeholder=["']제목 필터["']/);
  assert.doesNotMatch(sidepanelHtml, /placeholder=["']작성자 필터["']/);
  assert.doesNotMatch(sidepanelHtml, /placeholder=["']추천 수 이상["']/);
});

test('sidepanel exposes minimal multi-keyword input before collection controls', () => {
  assert.match(sidepanelHtml, /<section class=["']section search-input-section["']>/);
  assert.match(sidepanelHtml, /<h2>수집할 검색어<\/h2>/);
  assert.match(sidepanelHtml, /<textarea\b[^>]*id=["']keywordInput["'][^>]*placeholder=["']검색어를 줄바꿈 또는 쉼표로 구분해서 입력["']/);
  assert.match(sidepanelHtml, /갤러리 메인에서는 검색어를 입력해야 수집을 시작할 수 있습니다\./);
  assert.ok(sidepanelHtml.indexOf('id="keywordInput"') < sidepanelHtml.indexOf('id="startBtn"'));
});

test('collection limit setting is labeled as maximum collected result count', () => {
  assert.match(sidepanelHtml, /최대 수집 글 수\s*<input id=["']maxResults["'][^>]*type=["']number["']/);
  assert.match(optionsHtml, /최대 수집 글 수\s*<input id=["']maxResults["'][^>]*type=["']number["']/);
  assert.doesNotMatch(sidepanelHtml, /최대 검색 범위 이동 횟수/);
  assert.doesNotMatch(optionsHtml, /최대 검색 범위 이동 횟수/);
});

test('manual HTML cache clear button is not exposed', () => {
  assert.doesNotMatch(sidepanelHtml, /id=["']cacheBtn["']/);
  assert.doesNotMatch(sidepanelHtml, /HTML 캐시 비우기/);
});

test('HTML cache setting is not exposed in extension UI', () => {
  assert.doesNotMatch(sidepanelHtml, /id=["']useCache["']/);
  assert.doesNotMatch(sidepanelHtml, /캐시 사용/);
  assert.doesNotMatch(optionsHtml, /id=["']useCache["']/);
  assert.doesNotMatch(optionsHtml, /캐시 사용/);
});
