import assert from 'node:assert/strict';
import {
  parseResults,
  findNextSearchRangeUrl,
  detectSearchContext,
  detectBlockedPage,
  PARSER_VERSION
} from '../src/parser.js';

const observedHtml = `
<!doctype html>
<html>
<head><title>프로그래밍 갤러리 - 커뮤니티 포털 디시인사이드</title></head>
<body>
  <input type="hidden" id="list_url" value="https://gall.dcinside.com/board/lists/?id=programming">
  <input type="hidden" id="gallery_name" value="프로그래밍">
  <input type="hidden" id="s_type" value="search_subject_memo">
  <input type="hidden" id="s_keyword" value="test">
  <input type="hidden" id="current_params" value="&s_type=search_subject_memo&s_keyword=test&page=1">
  <div class="gall_listwrap list">
    <table class="gall_list">
      <tbody class="listwrap2">
        <tr class="ub-content ">
          <td class="gall_num">AD</td>
          <td class="gall_tit ub-word"><a href="https://example.invalid/ad">ad</a></td>
        </tr>
        <tr class="ub-content us-post" data-no="2932353" data-type="icon_txt">
          <td class="gall_num">2932353</td>
          <td class="gall_tit ub-word">
            <a href="/board/view/?id=programming&no=2932353&s_type=search_subject_memo&s_keyword=test&page=1"><em></em>AI 딸깍이 안 되는 이유</a>
          </td>
          <td class="gall_writer ub-writer" data-nick="guiyom.org" data-uid="concerto7106" data-ip="" data-loc="list"><span class="nickname in"><em>guiyom.org</em></span></td>
          <td class="gall_date">26/07/06</td>
          <td class="gall_count">12</td>
          <td class="gall_recommend">0</td>
        </tr>
        <tr class="ub-content us-post" data-no="2929405" data-type="icon_txt">
          <td class="gall_num">2929405</td>
          <td class="gall_tit ub-word">
            <a href="/board/view/?id=programming&no=2929405&s_type=search_subject_memo&s_keyword=test&page=1"><em></em>행렬이 싫어서 다 찢었어요</a>
            <a class="reply_numbox" href="https://gall.dcinside.com/board/view/?id=programming&no=2929405&t=cv&s_type=search_subject_memo&s_keyword=test&page=1"><span class="reply_num">[3]</span></a>
          </td>
          <td class="gall_writer ub-writer" data-nick="프갤러" data-uid="" data-ip="61.102" data-loc="list"><span class="nickname"><em>프갤러</em></span><span class="ip">(61.102)</span></td>
          <td class="gall_date">26/07/05</td>
          <td class="gall_count">34</td>
          <td class="gall_recommend">1</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="bottom_paging_wrap re">
    <div class="bottom_paging_box iconpaging">
      <em>1</em>
      <a href="/board/lists/?id=programming&page=1&search_pos=-2860402&s_type=search_subject_memo&s_keyword=test" class="search_next">다음 검색<span></span></a>
    </div>
  </div>
  <section id="kakao_search">
    <div class="bottom_paging_box iconpaging">
      <a href="javascript:ajax_list_search(16)" class="sp_pagingicon page_next">다음</a>
    </div>
  </section>
</body>
</html>`;

const apistogrammaHtml = `
<!doctype html>
<html>
<head><title>아피스토그라마 갤러리</title></head>
<body>
  <input type="hidden" id="list_url" value="https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma">
  <input type="hidden" id="gallery_name" value="아피스토그라마">
  <input type="hidden" id="s_type" value="search_subject_memo">
  <input type="hidden" id="s_keyword" value="자반 축양장">
  <input type="hidden" id="current_params" value="&search_pos=-712643&s_type=search_subject_memo&s_keyword=자반 축양장&page=1">
  <div class="gall_listwrap list">
    <table class="gall_list">
      <tbody class="listwrap2">
        <tr class="ub-content us-post" data-no="718525" data-type="icon_pic">
          <td class="gall_num">718525</td>
          <td class="gall_subject">질문</td>
          <td class="gall_tit ub-word">
            <a href="/mgallery/board/view/?id=apistogramma&no=718525&search_pos=-712643&s_type=search_subject_memo&s_keyword=자반 축양장&page=1"><em></em>자반 축양장</a>
            <a class="reply_numbox" href="https://gall.dcinside.com/mgallery/board/view/?id=apistogramma&no=718525&t=cv&s_type=search_subject_memo&s_keyword=자반 축양장&page=1"><span class="reply_num">[18]</span></a>
          </td>
          <td class="gall_writer ub-writer" data-nick="아피스토그라마" data-ip="211.192"></td>
          <td class="gall_date">07.06</td>
          <td class="gall_count">232</td>
          <td class="gall_recommend">0</td>
        </tr>
        <tr class="ub-content us-post" data-no="718130" data-type="icon_txt">
          <td class="gall_num">718130</td>
          <td class="gall_subject">일반</td>
          <td class="gall_tit ub-word">
            <a href="/mgallery/board/view/?id=apistogramma&no=718130&search_pos=-712643&s_type=search_subject_memo&s_keyword=자반 축양장&page=1"><em></em>2자반 어항 몰래 들여왔는데 어떻게함</a>
            <a class="reply_numbox" href="https://gall.dcinside.com/mgallery/board/view/?id=apistogramma&no=718130&t=cv&s_type=search_subject_memo&s_keyword=자반 축양장&page=1"><span class="reply_num">[4]</span></a>
          </td>
          <td class="gall_writer ub-writer" data-nick="폼디와지무디"></td>
          <td class="gall_date">07.05</td>
          <td class="gall_count">112</td>
          <td class="gall_recommend">0</td>
        </tr>
        <tr class="ub-content us-post" data-no="715942" data-type="icon_pic">
          <td class="gall_num">715942</td>
          <td class="gall_subject">질문</td>
          <td class="gall_tit ub-word">
            <a href="/mgallery/board/view/?id=apistogramma&no=715942&search_pos=-712643&s_type=search_subject_memo&s_keyword=자반 축양장&page=1"><em></em>자반 축양장 필수?</a>
            <a class="reply_numbox" href="https://gall.dcinside.com/mgallery/board/view/?id=apistogramma&no=715942&t=cv&s_type=search_subject_memo&s_keyword=자반 축양장&page=1"><span class="reply_num">[1]</span></a>
          </td>
          <td class="gall_writer ub-writer" data-nick="베타인권"></td>
          <td class="gall_date">06.29</td>
          <td class="gall_count">147</td>
          <td class="gall_recommend">0</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="bottom_paging_box iconpaging">
    <em>1</em><a href="/mgallery/board/lists/?id=apistogramma&page=1&search_pos=-702643&s_type=search_subject_memo&s_keyword=자반 축양장" class="search_next">다음 검색<span></span></a>
  </div>
</body>
</html>`;

test('parser version is explicit for parser diagnostics', () => {
  assert.match(PARSER_VERSION, /^dcinside-observed-/);
});

test('detectSearchContext extracts observed hidden fields and next availability', () => {
  const context = detectSearchContext(observedHtml, 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test');

  assert.equal(context.ok, true);
  assert.equal(context.galleryId, 'programming');
  assert.equal(context.galleryName, '프로그래밍');
  assert.equal(context.keyword, 'test');
  assert.equal(context.searchType, 'search_subject_memo');
  assert.equal(context.hasNextSearchRange, true);
});

test('parseResults extracts observed post rows and skips non-post rows', () => {
  const parsed = parseResults(observedHtml, 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test', 2);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.results.length, 2);
  assert.equal(parsed.results[0].postId, '2932353');
  assert.equal(parsed.results[0].title, 'AI 딸깍이 안 되는 이유');
  assert.equal(parsed.results[0].author, 'guiyom.org');
  assert.equal(parsed.results[0].url, 'https://gall.dcinside.com/board/view/?id=programming&no=2932353&s_type=search_subject_memo&s_keyword=test&page=1');
  assert.equal(parsed.results[1].commentCount, 3);
  assert.equal(parsed.results[1].searchStep, 2);
});

test('parseResults extracts apistogramma keyword rows and mgallery next search href', () => {
  const currentUrl = 'https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma&page=1&search_pos=-712643&s_type=search_subject_memo&s_keyword=%EC%9E%90%EB%B0%98%20%EC%B6%95%EC%96%91%EC%9E%A5';
  const parsed = parseResults(apistogrammaHtml, currentUrl, 0);
  const next = findNextSearchRangeUrl(apistogrammaHtml, currentUrl);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.results.length, 3);
  assert.deepEqual(parsed.results.map((item) => item.postId), ['718525', '718130', '715942']);
  assert.equal(parsed.results[0].title, '자반 축양장');
  assert.equal(parsed.results[0].commentCount, 18);
  assert.equal(parsed.results[0].url, 'https://gall.dcinside.com/mgallery/board/view/?id=apistogramma&no=718525&search_pos=-712643&s_type=search_subject_memo&s_keyword=%EC%9E%90%EB%B0%98%20%EC%B6%95%EC%96%91%EC%9E%A5&page=1');
  assert.equal(next.status, 'ok');
  assert.equal(next.url, 'https://gall.dcinside.com/mgallery/board/lists/?id=apistogramma&page=1&search_pos=-702643&s_type=search_subject_memo&s_keyword=%EC%9E%90%EB%B0%98%20%EC%B6%95%EC%96%91%EC%9E%A5');
  assert.equal(next.candidates[0].evidence.includes('search_pos delta 10000'), true);
});

test('findNextSearchRangeUrl accepts only the observed search range href', () => {
  const next = findNextSearchRangeUrl(observedHtml, 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test');

  assert.equal(next.status, 'ok');
  assert.equal(next.url, 'https://gall.dcinside.com/board/lists/?id=programming&page=1&search_pos=-2860402&s_type=search_subject_memo&s_keyword=test');
  assert.equal(next.candidates[0].evidence.includes('class search_next'), true);
  assert.equal(next.candidates[0].evidence.includes('search_pos changed'), true);
});

test('findNextSearchRangeUrl refuses ambiguous next candidates by default', () => {
  const html = `
  <input id="s_keyword" value="test">
  <input id="s_type" value="search_subject_memo">
  <a href="/board/lists/?id=programming&page=1&search_pos=-1&s_type=search_subject_memo&s_keyword=test" class="search_next">다음 검색</a>
  <a href="/board/lists/?id=programming&page=1&search_pos=-2&s_type=search_subject_memo&s_keyword=test" class="search_next">다음 검색</a>`;

  const next = findNextSearchRangeUrl(html, 'https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=test');

  assert.equal(next.status, 'uncertain');
  assert.equal(next.url, null);
  assert.equal(next.candidates.length, 2);
});

test('parseResults safely reports missing result rows', () => {
  const parsed = parseResults('<html><body><p>empty</p></body></html>', 'https://gall.dcinside.com/board/lists/?id=programming', 0);

  assert.equal(parsed.ok, false);
  assert.equal(parsed.results.length, 0);
  assert.equal(parsed.errors[0].code, 'RESULT_AREA_NOT_FOUND');
});

test('detectBlockedPage catches HTTP and text blocking indicators', () => {
  assert.equal(detectBlockedPage('<html></html>', 429).blocked, true);
  assert.equal(detectBlockedPage('<html><body>자동입력 방지 CAPTCHA</body></html>', 200).blocked, true);
  assert.equal(detectBlockedPage('<html><body>normal</body></html>', 200).blocked, false);
});

test('detectBlockedPage ignores normal page script error handler text', () => {
  const html = `
    <html>
      <body>
        <div class="gall_listwrap list">정상 검색 결과</div>
        <script>
          alert('시스템 오류로 작업이 중지되었습니다. 잠시 후 다시 이용해 주세요.');
        </script>
      </body>
    </html>`;

  assert.equal(detectBlockedPage(html, 200).blocked, false);
});
