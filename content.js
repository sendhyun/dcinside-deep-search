const moduleUrl = chrome.runtime.getURL('src/discovery.js');

async function getDiscoveryModule() {
  return import(moduleUrl);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const { runDiscoveryFromDocument } = await getDiscoveryModule();
    if (message?.type === 'GET_CONTEXT') {
      const discovery = runDiscoveryFromDocument(document, location.href);
      sendResponse({
        ok: discovery.context.ok || discovery.galleryContext.ok,
        context: discovery.context,
        galleryContext: discovery.galleryContext
      });
      return;
    }
    if (message?.type === 'RUN_DISCOVERY') {
      const discovery = runDiscoveryFromDocument(document, location.href);
      sendResponse({ ok: true, discovery });
      return;
    }
    sendResponse({ ok: false, error: '지원하지 않는 content 메시지입니다.' });
  })();
  return true;
});
