(() => {
  const summarize = (element) => ({
    tag: element.tagName.toLowerCase(),
    id: element.id || '',
    className: element.className || '',
    name: element.getAttribute('name') || '',
    value: element.value || element.getAttribute('value') || '',
    text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160)
  });

  const absolute = (href) => {
    try {
      return new URL(href, location.href).toString();
    } catch {
      return href || '';
    }
  };
  const safeDecode = (value) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return '';
    }
  };

  const keyword =
    document.querySelector('#s_keyword')?.value ||
    document.querySelector('[name="search_keyword"]')?.value ||
    new URL(location.href).searchParams.get('s_keyword') ||
    '';

  const anchors = [...document.querySelectorAll('a[href]')].map((anchor) => ({
    text: (anchor.textContent || '').replace(/\s+/g, ' ').trim(),
    href: anchor.getAttribute('href') || '',
    url: absolute(anchor.getAttribute('href') || ''),
    className: anchor.className || ''
  }));

  const discovery = {
    collectedAt: new Date().toISOString(),
    currentUrl: location.href,
    title: document.title,
    contextCandidates: {
      galleryIdFromUrl: new URL(location.href).searchParams.get('id') || '',
      galleryName: document.querySelector('#gallery_name')?.value || '',
      keyword,
      searchType: document.querySelector('#s_type')?.value || new URL(location.href).searchParams.get('s_type') || '',
      currentParams: document.querySelector('#current_params')?.value || ''
    },
    inputCandidates: [...document.querySelectorAll('input, select')].slice(0, 100).map(summarize),
    resultAreaCandidates: [...document.querySelectorAll('.gall_listwrap, table, tbody')].slice(0, 60).map(summarize),
    repeatedPostCandidates: [...document.querySelectorAll('tr')].filter((row) => row.querySelector('a[href*="/board/view/"]')).slice(0, 40).map(summarize),
    searchRelatedLinks: anchors.filter((link) => /검색|search|s_keyword|search_pos/.test(`${link.text} ${link.href}`)).slice(0, 100),
    keywordPreservingLinks: anchors.filter((link) => keyword && safeDecode(link.url).includes(keyword)).slice(0, 100),
    suspectedNextSearchRangeLinks: anchors.filter((link) => /다음\s*검색/.test(link.text) || /\bsearch_next\b/.test(link.className) || /search_pos=/.test(link.href))
  };

  console.log('DCInside discovery JSON:', discovery);
  copy(JSON.stringify(discovery, null, 2));
  return discovery;
})();
