function normalizedText(value) {
  return String(value || '').trim().toLowerCase();
}

function minimumRecommendation(value) {
  if (value === '' || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : null;
}

export function filterResults(results, filters = {}) {
  const titleFilter = normalizedText(filters.title);
  const authorFilter = normalizedText(filters.author);
  const minRecommends = minimumRecommendation(filters.minRecommends);

  return results.filter((item) => {
    if (titleFilter && !normalizedText(item.title).includes(titleFilter)) return false;
    if (authorFilter && !normalizedText(item.author).includes(authorFilter)) return false;
    if (minRecommends !== null && Number(item.recommends || 0) < minRecommends) return false;
    return true;
  });
}
