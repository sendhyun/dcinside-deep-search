# INVARIANTS.md

- Automatic collection starts only after the user clicks `수집 시작`.
- Board pagination and search-range movement are separate concepts.
- Search-range movement follows only an actual `href` found in the current HTML.
- Visited URLs are never requested twice in one run.
- Collected posts are deduplicated by `postId` when available, otherwise by canonical URL.
- Requests are delayed by the configured rate limit.
- Fast repeated requests are not allowed.
- Suspected blocking, CAPTCHA, HTTP 403, or HTTP 429 stops collection.
- The stop button aborts the current run as soon as the extension can observe it.
- Parser failures are surfaced in the UI as diagnostics, not silent success.
- Unverified DOM structures are treated as unsupported or diagnostic-required.
- Search result HTML is not cached or reused between collection runs.
- Results stay in `chrome.storage.local` only and are never sent to an external server.
- Entry URLs are accepted only from the explicit `gall.dcinside.com` and `enter.dcinside.com` HTTPS allowlist.
- Every crawl request, including next search-range requests, stays on `https://gall.dcinside.com` and the same gallery id.
- A source entry URL and its canonical crawl list URL are stored separately; post-only query parameters never enter crawl URLs.
