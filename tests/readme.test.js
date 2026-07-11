import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const extensionReadme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const rootReadme = await readFile(new URL('../../README.md', import.meta.url), 'utf8');

test('README documents gallery main search input workflow', () => {
  for (const readme of [extensionReadme, rootReadme]) {
    assert.match(readme, /갤러리 메인/);
    assert.match(readme, /검색어를 입력/);
    assert.match(readme, /줄바꿈 또는 쉼표/);
    assert.match(readme, /순차/);
    assert.match(readme, /최신순/);
    assert.match(readme, /요청 제한/);
  }
});
