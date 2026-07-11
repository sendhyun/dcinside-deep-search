import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sidepanelSource = await readFile(new URL('../sidepanel.js', import.meta.url), 'utf8');
const contentSource = await readFile(new URL('../content.js', import.meta.url), 'utf8');

test('content GET_CONTEXT returns galleryContext with search context', () => {
  assert.match(contentSource, /galleryContext:\s*discovery\.galleryContext/);
  assert.match(contentSource, /discovery\.context\.ok\s*\|\|\s*discovery\.galleryContext\.ok/);
});

test('sidepanel distinguishes source and canonical crawl URLs', () => {
  assert.match(sidepanelSource, /function\s+contextUrlLabel/);
  assert.match(sidepanelSource, /canonicalListUrl/);
  assert.match(sidepanelSource, /현재 페이지를 갤러리 목록 URL로 변환해 수집합니다/);
});

test('sidepanel start flow accepts galleryContext and requires keyword on gallery main', () => {
  assert.match(sidepanelSource, /state\s*=\s*\{[\s\S]*galleryContext:\s*null/);
  assert.match(sidepanelSource, /const\s+crawlContext\s*=\s*context\?\.ok\s*\?\s*context\s*:\s*galleryContext/);
  assert.match(sidepanelSource, /갤러리 메인에서는 수집할 검색어를 입력하세요/);
  assert.match(sidepanelSource, /현재 페이지 형식에서는 내부 검색 URL을 만들 수 없습니다/);
});

test('sidepanel reads and sends maxResults instead of maxSearchSteps', () => {
  assert.match(sidepanelSource, /maxResults:\s*document\.querySelector\('#maxResults'\)/);
  assert.match(sidepanelSource, /maxResults:\s*Number\(elements\.maxResults\.value\)\s*\|\|\s*30/);
  assert.match(sidepanelSource, /elements\.maxResults\.value\s*=\s*options\.maxResults/);
  assert.match(sidepanelSource, /\[elements\.maxResults,\s*elements\.requestDelayMs/);
  assert.doesNotMatch(sidepanelSource, /maxSearchSteps/);
});

test('sidepanel stop click updates local state immediately and ignores late running progress', () => {
  assert.match(sidepanelSource, /stopRequestedAt:\s*0/);
  assert.match(sidepanelSource, /function\s+requestStop\s*\(/);
  assert.match(sidepanelSource, /state\.stopRequestedAt\s*=\s*Date\.now\(\)/);
  assert.match(sidepanelSource, /setStatus\('stopped',\s*'중지 요청을 보냈습니다\.'\)/);
  assert.match(sidepanelSource, /function\s+shouldIgnoreProgress\s*\(\s*progress\s*=\s*\{\}\s*\)/);
  assert.match(sidepanelSource, /progress\.status\s*===\s*'running'[\s\S]*state\.progress\?\.status\s*===\s*'stopped'/);
  assert.match(sidepanelSource, /if\s*\(\s*shouldIgnoreProgress\(progress\)\s*\)\s*return/);
});

test('sidepanel schedules result rendering instead of rendering every progress message immediately', () => {
  assert.match(sidepanelSource, /renderScheduled:\s*false/);
  assert.match(sidepanelSource, /function\s+scheduleRenderResults\s*\(/);
  assert.match(sidepanelSource, /requestAnimationFrame\(\(\)\s*=>\s*\{/);
  assert.match(sidepanelSource, /scheduleRenderResults\(\)/);
  assert.doesNotMatch(sidepanelSource, /if\s*\(\s*progress\.results\s*\)\s*\{[\s\S]{0,120}renderResults\(\)/);
});
