function valueOrUnknown(value) {
  return value === undefined || value === null || value === '' ? 'unknown' : value;
}

export function displaySearchStep(searchStep) {
  const step = Number(searchStep);
  return Number.isFinite(step) ? step + 1 : 'unknown';
}

export function formatResultMeta(item) {
  const parts = [
    valueOrUnknown(item.author) === 'unknown' ? '작성자 unknown' : item.author,
    valueOrUnknown(item.date) === 'unknown' ? '날짜 unknown' : item.date,
    `조회 ${valueOrUnknown(item.views)}`,
    `추천 ${valueOrUnknown(item.recommends)}`,
    `댓글 ${valueOrUnknown(item.commentCount ?? 0)}`,
    `단계 ${displaySearchStep(item.searchStep)}`
  ];
  if (Array.isArray(item.matchedKeywords) && item.matchedKeywords.length > 0) {
    parts.push(`검색어 ${item.matchedKeywords.join(', ')}`);
  }
  return parts.join(' | ');
}

export function createResultRow(documentRef, item) {
  const row = documentRef.createElement('a');
  row.className = 'result-row';
  row.href = item.url;
  row.target = '_blank';
  row.rel = 'noreferrer';

  const title = documentRef.createElement('span');
  title.className = 'result-title';
  title.textContent = item.title;

  const meta = documentRef.createElement('span');
  meta.className = 'result-meta';
  meta.textContent = formatResultMeta(item);

  row.append(title, meta);
  return row;
}
