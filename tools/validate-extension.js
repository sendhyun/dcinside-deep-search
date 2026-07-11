import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'sidepanel.html',
  'sidepanel.js',
  'sidepanel.css',
  'popup.html',
  'popup.js',
  'popup.css',
  'options.html',
  'options.js',
  'options.css',
  'src/crawler.js',
  'src/parser.js',
  'src/discovery.js',
  'src/storage.js',
  'src/messaging.js',
  'src/csv.js',
  'src/rateLimit.js',
  'src/errors.js',
  'src/resultOrdering.js',
  'src/resultAggregation.js',
  'docs/DISCOVERY.md',
  'docs/INVARIANTS.md',
  'tools/dc-discovery-snippet.js',
  'README.md'
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`missing ${file}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const sidepanelHtml = fs.readFileSync(path.join(root, 'sidepanel.html'), 'utf8');
const allowedHosts = ['https://gall.dcinside.com/*', 'https://enter.dcinside.com/*'];

function samePatterns(patterns) {
  return Array.isArray(patterns)
    && patterns.length === allowedHosts.length
    && new Set(patterns).size === patterns.length
    && patterns.every((pattern) => allowedHosts.includes(pattern));
}
if (manifest.manifest_version !== 3) errors.push('manifest_version must be 3');
for (const permission of manifest.permissions || []) {
  if (!['activeTab', 'storage', 'sidePanel'].includes(permission)) {
    errors.push(`unexpected permission ${permission}`);
  }
}
if (!samePatterns(manifest.host_permissions)) {
  errors.push('host_permissions must exactly match the DCInside entry allowlist');
}
if (!samePatterns(manifest.content_scripts?.[0]?.matches)) {
  errors.push('content script matches must exactly match the DCInside entry allowlist');
}
if (!samePatterns(manifest.web_accessible_resources?.[0]?.matches)) {
  errors.push('web accessible resource matches must exactly match the DCInside entry allowlist');
}
if (!manifest.background?.type || manifest.background.type !== 'module') {
  errors.push('background service worker must be type module');
}
if (sidepanelHtml.includes('diagnoseBtn') || sidepanelHtml.includes('현재 페이지 진단')) {
  errors.push('sidepanel must start discovery from 수집 시작 without a separate diagnosis button');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('extension structure ok');
}
