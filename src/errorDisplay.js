import { ERROR_CODES, STATUS } from './errors.js';

const KNOWN_ERROR_DESCRIPTIONS = Object.freeze({
  [ERROR_CODES.UNSUPPORTED_PAGE]: '지원되는 디시 검색 결과 페이지로 인식하지 못했습니다.',
  [ERROR_CODES.KEYWORD_NOT_FOUND]: '검색어를 찾지 못했습니다. 검색 결과 페이지인지 확인하세요.',
  [ERROR_CODES.RESULT_AREA_NOT_FOUND]: '검색 결과 영역을 찾지 못했습니다. 진단이 필요합니다.',
  [ERROR_CODES.RESULT_PARSE_FAILED]: '글 목록을 읽지 못했습니다. 페이지 구조가 바뀌었을 수 있습니다.',
  [ERROR_CODES.NEXT_URL_NOT_FOUND]: '다음 검색 링크가 없어 더 이동하지 않았습니다.',
  [ERROR_CODES.NEXT_URL_UNCERTAIN]: '다음 검색 링크 후보가 애매해서 자동 이동을 멈췄습니다.',
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 요청이 실패했습니다. 잠시 후 다시 시도하세요.',
  [ERROR_CODES.BLOCKED_REQUEST]: '요청이 차단된 것 같습니다. 속도를 늦추거나 중단하세요.',
  [ERROR_CODES.CAPTCHA_SUSPECTED]: 'CAPTCHA 또는 자동입력 방지가 감지됐습니다.',
  [ERROR_CODES.PERMISSION_DENIED]: '권한이 부족합니다. 확장 권한과 현재 탭을 확인하세요.',
  [ERROR_CODES.USER_STOPPED]: '사용자가 수집을 중지했습니다.',
  [ERROR_CODES.MAX_RESULTS_REACHED]: '설정한 최대 수집 글 수에 도달했습니다.',
  [ERROR_CODES.COMPLETED]: '수집이 완료됐습니다.',
  CRAWL_START_FAILED: '수집 시작 중 오류가 발생했습니다.'
});

const STATUS_DESCRIPTIONS = Object.freeze({
  [STATUS.IDLE]: '대기 중입니다.',
  [STATUS.RUNNING]: '수집 중입니다.',
  [STATUS.STOPPED]: '수집이 중지됐습니다.',
  [STATUS.COMPLETED]: '수집이 완료됐습니다.',
  [STATUS.BLOCKED]: '차단 또는 CAPTCHA 가능성이 있어 중단했습니다.',
  [STATUS.ERROR]: '오류가 발생했습니다.'
});

function isQuotaError(message) {
  return /kQuotaBytes|quota exceeded|QUOTA_BYTES/i.test(String(message || ''));
}

function shortRawMessage(message) {
  const value = String(message || '').replace(/\s+/g, ' ').trim();
  if (!value) return '';
  return value.length > 90 ? `${value.slice(0, 87)}...` : value;
}

export function describeProgressError(progress = {}) {
  const error = progress.error || {};
  if (isQuotaError(error.message || error.code)) {
    return '저장공간이 가득 찼습니다. 목록 비우기를 실행한 뒤 다시 시도하세요.';
  }
  if (error.code && KNOWN_ERROR_DESCRIPTIONS[error.code]) {
    return KNOWN_ERROR_DESCRIPTIONS[error.code];
  }
  const raw = shortRawMessage(error.message || error.code);
  if (raw) return raw;
  return STATUS_DESCRIPTIONS[progress.status] || '';
}
