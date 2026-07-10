const COLUMNS = [
  'index',
  'galleryId',
  'keyword',
  'searchType',
  'title',
  'author',
  'date',
  'views',
  'recommends',
  'commentCount',
  'postId',
  'url',
  'searchStep',
  'sourceUrl'
];

function escapeCsv(value) {
  const rawText = value == null ? '' : String(value);
  const text = /^[=+\-@]/.test(rawText) ? `'${rawText}` : rawText;
  if (/^[']?[=+\-@]/.test(text) || /[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function resultsToCsv(results) {
  const lines = [COLUMNS.join(',')];
  results.forEach((item, index) => {
    lines.push(COLUMNS.map((column) => {
      if (column === 'index') return index + 1;
      return escapeCsv(item[column]);
    }).join(','));
  });
  return `${lines.join('\n')}\n`;
}

export function downloadCsv(results, filename = 'dcinside-deep-search.csv') {
  const blob = new Blob([resultsToCsv(results)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
