import assert from 'node:assert/strict';
import { createCrawler } from '../src/crawler.js';

const firstPage = `
<input id="s_keyword" value="test"><input id="s_type" value="search_subject_memo">
<div class="gall_listwrap list"><table class="gall_list"><tbody class="listwrap2">
<tr class="ub-content us-post" data-no="1"><td class="gall_num">1</td><td class="gall_tit ub-word"><a href="/board/view/?id=programming&no=1&s_type=search_subject_memo&s_keyword=test">one</a></td><td class="gall_writer ub-writer" data-nick="a"></td><td class="gall_date">26/07/06</td><td class="gall_count">1</td><td class="gall_recommend">0</td></tr>
</tbody></table></div>
<a href="/board/lists/?id=programming&page=1&search_pos=-1&s_type=search_subject_memo&s_keyword=test" class="search_next">다음 검색</a>`;

const secondPage = `
<input id="s_keyword" value="test"><input id="s_type" value="search_subject_memo">
<div class="gall_listwrap list"><table class="gall_list"><tbody class="listwrap2">
<tr class="ub-content us-post" data-no="1"><td class="gall_num">1</td><td class="gall_tit ub-word"><a href="/board/view/?id=programming&no=1&s_type=search_subject_memo&s_keyword=test">one duplicate</a></td><td class="gall_writer ub-writer" data-nick="a"></td><td class="gall_date">26/07/06</td><td class="gall_count">1</td><td class="gall_recommend">0</td></tr>
<tr class="ub-content us-post" data-no="2"><td class="gall_num">2</td><td class="gall_tit ub-word"><a href="/board/view/?id=programming&no=2&s_type=search_subject_memo&s_keyword=test">two</a></td><td class="gall_writer ub-writer" data-nick="b"></td><td class="gall_date">26/07/05</td><td class="gall_count">2</td><td class="gall_recommend">1</td></tr>
</tbody></table></div>`;

test('crawler follows discovered hrefs, delays requests, and dedupes posts', async () => {
  const fetched = [];
  const delays = [];
  const crawler = createCrawler({
    fetchHtml: async (url) => {
      fetched.push(url);
      return { status: 200, html: fetched.length === 1 ? firstPage : secondPage };
    },
    delay: async (ms) => {
      delays.push(ms);
    }
  });

  const result = await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { maxResults: 100, requestDelayMs: 50, dedupeResults: true }
  });

  assert.equal(result.status, 'completed');
  assert.equal(fetched.length, 2);
  assert.equal(delays.length, 2);
  assert.equal(result.results.length, 2);
  assert.deepEqual(result.results.map((item) => item.postId), ['1', '2']);
});

test('crawler progress includes accumulated results after each parsed page', async () => {
  const progressEvents = [];
  const fetched = [];
  const crawler = createCrawler({
    fetchHtml: async (url) => {
      fetched.push(url);
      return { status: 200, html: fetched.length === 1 ? firstPage : secondPage };
    },
    delay: async () => {},
    sendProgress: (progress) => {
      progressEvents.push({ ...progress, fetchedCount: fetched.length });
    }
  });

  await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { maxResults: 100, requestDelayMs: 1, dedupeResults: true }
  });

  const firstPageEvent = progressEvents.find((event) => event.fetchedCount === 1 && Array.isArray(event.results));
  assert.ok(firstPageEvent, 'expected progress after first parsed page to include accumulated results');
  assert.deepEqual(firstPageEvent.results.map((item) => item.postId), ['1']);
});

test('crawler surfaces parser failures instead of completing silently', async () => {
  const crawler = createCrawler({
    fetchHtml: async () => ({ status: 200, html: '<html><body><p>unexpected structure</p></body></html>' }),
    delay: async () => {}
  });

  const result = await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { maxResults: 100, requestDelayMs: 1 }
  });

  assert.equal(result.status, 'error');
  assert.equal(result.error.code, 'RESULT_AREA_NOT_FOUND');
});

test('crawler follows next search range while maxResults still allows more results', async () => {
  const fetched = [];
  const crawler = createCrawler({
    fetchHtml: async (url) => {
      fetched.push(url);
      return { status: 200, html: fetched.length === 1 ? firstPage : secondPage };
    },
    delay: async () => {}
  });

  const result = await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { maxResults: 10, requestDelayMs: 1, dedupeResults: true }
  });

  assert.equal(result.status, 'completed');
  assert.equal(fetched.length, 2);
  assert.deepEqual(result.results.map((item) => item.postId), ['1', '2']);
});

test('maxResults stops before following the next search range after enough unique results', async () => {
  const fetched = [];
  const crawler = createCrawler({
    fetchHtml: async (url) => {
      fetched.push(url);
      return { status: 200, html: fetched.length === 1 ? firstPage : secondPage };
    },
    delay: async () => {}
  });

  const result = await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { maxResults: 1, requestDelayMs: 1, dedupeResults: true }
  });

  assert.equal(result.status, 'stopped');
  assert.equal(result.error.code, 'MAX_RESULTS_REACHED');
  assert.equal(fetched.length, 1);
  assert.deepEqual(result.results.map((item) => item.postId), ['1']);
});

test('maxResults truncates parsed rows to the requested unique result count', async () => {
  const crawler = createCrawler({
    fetchHtml: async () => ({ status: 200, html: secondPage }),
    delay: async () => {}
  });

  const result = await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { maxResults: 1, requestDelayMs: 1, dedupeResults: true }
  });

  assert.equal(result.status, 'stopped');
  assert.equal(result.error.code, 'MAX_RESULTS_REACHED');
  assert.deepEqual(result.results.map((item) => item.postId), ['1']);
});

test('crawler stops on uncertain next URL unless explicitly allowed', async () => {
  const ambiguous = `${firstPage}<a href="/board/lists/?id=programming&page=1&search_pos=-2&s_type=search_subject_memo&s_keyword=test" class="search_next">다음 검색</a>`;
  const crawler = createCrawler({
    fetchHtml: async () => ({ status: 200, html: ambiguous }),
    delay: async () => {}
  });

  const result = await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { maxResults: 100, requestDelayMs: 1, allowUncertainNextUrl: false }
  });

  assert.equal(result.status, 'error');
  assert.equal(result.error.code, 'NEXT_URL_UNCERTAIN');
});

test('crawler retries a transient fetch error up to maxRetryPerUrl', async () => {
  let attempts = 0;
  const crawler = createCrawler({
    fetchHtml: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary network failure');
      return { status: 200, html: secondPage };
    },
    delay: async () => {}
  });

  const result = await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { maxRetryPerUrl: 1, requestDelayMs: 1 }
  });

  assert.equal(attempts, 2);
  assert.equal(result.status, 'completed');
  assert.equal(result.results.length, 2);
});

test('crawler stops during rate-limit delay when aborted', async () => {
  const abortController = new AbortController();
  const crawler = createCrawler({
    fetchHtml: async () => {
      throw new Error('fetch should not run after abort');
    },
    delay: async (ms, signal) => {
      abortController.abort();
      if (signal?.aborted) {
        const error = new Error('aborted');
        error.name = 'AbortError';
        throw error;
      }
    }
  });

  const result = await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { requestDelayMs: 1 },
    signal: abortController.signal
  });

  assert.equal(result.status, 'stopped');
  assert.equal(result.error.code, 'USER_STOPPED');
});

test('crawler stops after fetch when the signal is aborted before parsing results', async () => {
  const abortController = new AbortController();
  const crawler = createCrawler({
    fetchHtml: async () => {
      abortController.abort();
      return { status: 200, html: secondPage };
    },
    delay: async () => {}
  });

  const result = await crawler.run({
    startUrl: 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test',
    options: { requestDelayMs: 1 },
    signal: abortController.signal
  });

  assert.equal(result.status, 'stopped');
  assert.equal(result.error.code, 'USER_STOPPED');
  assert.equal(result.results.length, 0);
});
