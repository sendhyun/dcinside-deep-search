const tests = [];

globalThis.test = (name, fn) => {
  tests.push({ name, fn });
};

await import('./parser.test.js');
await import('./csv-rateLimit.test.js');
await import('./crawler.test.js');
await import('./resultDisplay.test.js');
await import('./resultOrdering.test.js');
await import('./resultAggregation.test.js');
await import('./resultFilters.test.js');
await import('./errorDisplay.test.js');
await import('./storage.test.js');
await import('./discovery.test.js');
await import('./galleryContext.test.js');
await import('./searchUrls.test.js');
await import('./dcinsideUrls.test.js');
await import('./browserUi.test.js');
await import('./sidepanelMarkup.test.js');
await import('./sidepanelSource.test.js');
await import('./backgroundSource.test.js');
await import('./readme.test.js');

let failed = 0;

for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

console.log(`${tests.length - failed}/${tests.length} tests passed`);

if (failed > 0) {
  process.exitCode = 1;
}
