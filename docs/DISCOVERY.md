# DISCOVERY.md

Discovery date: 2026-07-08

## Access

Direct discovery was possible only after allowing an escalated `curl.exe` network request. The sandboxed request failed to connect through the local proxy.

Observed sample URL:

```text
https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test
```

Observed second search-range URL:

```text
https://gall.dcinside.com/board/lists/?id=programming&page=1&search_pos=-2860402&s_type=search_subject_memo&s_keyword=test
```

## Observed Context Fields

- Gallery id: query parameter `id=programming`; also present in hidden `#list_url` as `https://gall.dcinside.com/board/lists/?id=programming`.
- Gallery name: hidden input `#gallery_name` value `프로그래밍`.
- Search type: hidden input `#s_type` value `search_subject_memo`; bottom select `#search_type` has options `search_subject_memo`, `search_subject`, `search_memo`, `search_name`.
- Search keyword: hidden input `#s_keyword` value `test`; bottom search input `name="search_keyword"` also contained the keyword.
- Current range params: hidden input `#current_params`, e.g. `&s_type=search_subject_memo&s_keyword=test&page=1` and later `&search_pos=-2860402&s_type=search_subject_memo&s_keyword=test&page=1`.
- Search range movement parameter observed: `search_pos`. This is recorded as observed, not assumed.

## Observed Result List Structure

Main gallery result area:

```html
<div class="gall_listwrap list">
  <table class="gall_list">
    <tbody class="listwrap2">
      <tr class="ub-content us-post" data-no="2932353" data-type="icon_txt">
        <td class="gall_num">2932353</td>
        <td class="gall_tit ub-word">
          <a href="/board/view/?id=programming&no=2932353&s_type=search_subject_memo&s_keyword=test&page=1">...</a>
        </td>
        <td class="gall_writer ub-writer" data-nick="guiyom.org" data-uid="concerto7106" data-ip="" data-loc="list">...</td>
        <td class="gall_date">...</td>
        <td class="gall_count">...</td>
        <td class="gall_recommend">0</td>
      </tr>
    </tbody>
  </table>
</div>
```

Additional observed sample from the user's target case:

```text
https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma&s_type=search_subject_memo&s_keyword=자반%20축양장
```

This minor-gallery search used the same post row shape with an extra `td.gall_subject` column:

```html
<tr class="ub-content us-post" data-no="718525" data-type="icon_pic">
  <td class="gall_num">718525</td>
  <td class="gall_subject">질문</td>
  <td class="gall_tit ub-word">
    <a href="/mgallery/board/view/?id=apistogramma&no=718525&s_type=search_subject_memo&s_keyword=자반 축양장&page=1">자반 축양장</a>
    <a class="reply_numbox" href="..."><span class="reply_num">[18]</span></a>
  </td>
</tr>
```

The next search-range link was:

```html
<a href="/mgallery/board/lists/?id=apistogramma&page=1&search_pos=-702643&s_type=search_subject_memo&s_keyword=자반 축양장" class="search_next">다음 검색...</a>
```

For the user-provided starting URL, `search_pos=-712643`; the observed next link used `search_pos=-702643`, a `+10000` delta. This is evidence that DCInside searches in 10,000-post ranges for this gallery. The extension records that delta as diagnostic evidence, but it still follows only the actual href found in the current HTML.

Observed repeated post rows use `tr.ub-content.us-post` with `data-no`. Non-post rows observed include survey rows, `AD`, and `tr.ub-content.empty_list.power_lk`.

Observed column roles:

- Post id: `tr[data-no]`, also `td.gall_num`.
- Title link: `td.gall_tit a[href*="/board/view/"]`, excluding `a.reply_numbox`.
- Author: `td.gall_writer`, with `data-nick` when available. The visible nickname is inside `.nickname em`.
- Date: `td.gall_date`.
- Views: `td.gall_count`.
- Recommends: `td.gall_recommend`.
- Comments: `a.reply_numbox span.reply_num`, text like `[3]`.
- Notice/ad distinction: non-post rows do not have `us-post` or usable `data-no`; ad rows can contain `AD`, `empty_list`, or links to external domains.

## Observed Next Search-Range Links

Initial page:

```html
<a href="/board/lists/?id=programming&page=1&search_pos=-2860402&s_type=search_subject_memo&s_keyword=test" class="search_next">다음 검색...</a>
```

Second range:

```html
<a href="/board/lists/?id=programming&page=1&search_pos=-2870402&s_type=search_subject_memo&s_keyword=test" class="search_prev">이전 검색</a>
<a href="/board/lists/?id=programming&page=1&search_pos=-2850402&s_type=search_subject_memo&s_keyword=test" class="search_next">다음 검색</a>
```

Important distinction: unrelated page-number links also contain the text `다음`, e.g. `javascript:ajax_list_search(16)` with class `page_next` in `#kakao_search`. These are not search-range links because they are JavaScript pagination links, not HTML `href` URLs preserving current gallery/search params and changing `search_pos`.

## Result-Zero State

For a random keyword, the main table had class `gall_list empty` and `tbody.listwrap2` contained non-post empty/ad rows. A next search-range link still existed:

```html
<a href="/board/lists/?id=programming&page=1&search_pos=-2860402&s_type=search_subject_memo&s_keyword=zzzzzzzzzzzzzzzzzzzzzzzz" class="search_next">다음 검색...</a>
```

The page also included a template for a Kakao search no-data row, but that is a separate global search section and should not be parsed as gallery results.

## Block / CAPTCHA / Login Signals

Observed normal unauthenticated pages include login links to `sign.dcinside.com/login`, so login links alone are not a blocking signal. No live CAPTCHA, HTTP 403, or HTTP 429 page was observed. Parser/crawler should treat HTTP status 403/429 as blocking and inspect text for CAPTCHA/자동입력/비정상/차단 indicators as a conservative stop condition.

## Selector Candidates

Confirmed on the observed sample:

- Context: `#s_keyword`, `#s_type`, `#current_params`, `#gallery_name`, `#list_url`.
- Result table: `.gall_listwrap.list table.gall_list`.
- Post rows: `tr.ub-content.us-post[data-no]`.
- Title link: `.gall_tit a[href*="/board/view/"]:not(.reply_numbox)`.
- Author: `.gall_writer[data-nick]` or `.gall_writer .nickname em`.
- Date/views/recommends: `.gall_date`, `.gall_count`, `.gall_recommend`.
- Comment count: `.reply_numbox .reply_num`.
- Next search range: `a.search_next[href]`, verified by comparing URL params.

## Uncertainties

- Mini and mobile gallery URL structures were not separately sampled.
- 2026-07-11 `enter.dcinside.com/mgallery/board/lists/?id=apistogramma`를 HTTP 응답으로 확인했다. HTTP 200이며 리다이렉트는 없었다. HTML은 `#list_url=https://enter.dcinside.com/mgallery/board/lists/?id=apistogramma`, `#gallery_name=아피스토그라마`, `#s_keyword`, `.gall_listwrap.list`를 포함했고, canonical meta와 로그인/글쓰기 URL도 `enter`를 가리켰다. 갤러리 제목 링크는 `gall.dcinside.com`을 가리킨다. 따라서 `enter`는 콘텐츠 스크립트 진입 host로 허용하되, 크롤러 fetch에는 사용하지 않고 `gall` 목록 URL로 변환한다.
- The exact terminal state when no older search range exists was not observed.
- CAPTCHA and rate-limit pages were not observed directly.
- The parser must keep diagnostic candidate reporting because DCInside may change classes or HTML placement.
