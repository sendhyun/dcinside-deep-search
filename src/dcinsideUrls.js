export const CANONICAL_ORIGIN = 'https://gall.dcinside.com';

export const ALLOWED_ENTRY_HOSTS = new Set([
  'gall.dcinside.com',
  'enter.dcinside.com'
]);

const ENTRY_PATHS = new Map([
  ['/board/lists/', { entryKind: 'regular-list', listPath: '/board/lists/' }],
  ['/board/view/', { entryKind: 'regular-view', listPath: '/board/lists/' }],
  ['/mgallery/board/lists/', { entryKind: 'minor-list', listPath: '/mgallery/board/lists/' }],
  ['/mgallery/board/view/', { entryKind: 'minor-view', listPath: '/mgallery/board/lists/' }]
]);

function normalizePathname(pathname) {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function invalid(reason, sourceUrl = '') {
  return {
    ok: false,
    reason,
    sourceUrl,
    sourceHost: '',
    entryKind: '',
    galleryId: '',
    listPath: '',
    canonicalListUrl: ''
  };
}

export function parseDcinsideEntryUrl(input, fallbackGalleryId = '') {
  let url;
  try {
    url = new URL(input);
  } catch {
    return invalid('invalid-url');
  }

  const sourceUrl = url.toString();
  if (url.protocol !== 'https:') return invalid('unsupported-scheme', sourceUrl);
  if (url.username || url.password) return invalid('credentials-not-allowed', sourceUrl);
  if (url.port) return invalid('unsupported-port', sourceUrl);
  if (!ALLOWED_ENTRY_HOSTS.has(url.hostname)) return invalid('unsupported-host', sourceUrl);

  const route = ENTRY_PATHS.get(normalizePathname(url.pathname));
  if (!route) return invalid('unsupported-path', sourceUrl);

  const galleryId = (url.searchParams.get('id') || fallbackGalleryId || '').trim();
  if (!galleryId) return invalid('missing-gallery-id', sourceUrl);

  const canonical = new URL(route.listPath, CANONICAL_ORIGIN);
  canonical.searchParams.set('id', galleryId);
  for (const key of ['s_type', 's_keyword']) {
    const value = url.searchParams.get(key);
    if (value) canonical.searchParams.set(key, value);
  }

  return {
    ok: true,
    reason: '',
    sourceUrl,
    sourceHost: url.hostname,
    entryKind: route.entryKind,
    galleryId,
    listPath: route.listPath,
    canonicalListUrl: canonical.toString()
  };
}

export function toCanonicalGalleryListUrl(input, fallbackGalleryId = '') {
  const parsed = parseDcinsideEntryUrl(input, fallbackGalleryId);
  return parsed.ok ? parsed.canonicalListUrl : '';
}

export function isCanonicalGalleryListUrl(input, galleryId = '') {
  const parsed = parseDcinsideEntryUrl(input);
  if (!parsed.ok || parsed.sourceHost !== 'gall.dcinside.com' || !parsed.entryKind.endsWith('-list')) return false;
  return !galleryId || parsed.galleryId === galleryId;
}
