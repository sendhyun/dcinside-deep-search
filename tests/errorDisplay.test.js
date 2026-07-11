import assert from 'node:assert/strict';
import { ERROR_CODES } from '../src/errors.js';
import { describeProgressError } from '../src/errorDisplay.js';

test('describeProgressError explains chrome storage quota errors', () => {
  const description = describeProgressError({
    status: 'error',
    error: { message: 'Resource::kQuotaBytes quota exceeded' }
  });

  assert.equal(description, '저장공간이 가득 찼습니다. 목록 비우기를 실행한 뒤 다시 시도하세요.');
});

test('describeProgressError explains known extension error codes', () => {
  const description = describeProgressError({
    status: 'error',
    error: { code: ERROR_CODES.NEXT_URL_UNCERTAIN }
  });

  assert.equal(description, '다음 검색 링크 후보가 애매해서 자동 이동을 멈췄습니다.');
});

test('describeProgressError explains max result limit stops', () => {
  const description = describeProgressError({
    status: 'stopped',
    error: { code: ERROR_CODES.MAX_RESULTS_REACHED }
  });

  assert.equal(description, '설정한 최대 수집 글 수에 도달했습니다.');
});

test('describeProgressError falls back to a short raw error message', () => {
  const description = describeProgressError({
    status: 'error',
    error: { message: 'Unexpected runtime failure while saving progress to local storage' }
  });

  assert.equal(description, 'Unexpected runtime failure while saving progress to local storage');
});
