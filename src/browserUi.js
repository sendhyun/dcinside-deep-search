export async function openMainUi(chromeApi, tab) {
  if (chromeApi.sidePanel?.open && tab?.windowId) {
    try {
      await chromeApi.sidePanel.open({ windowId: tab.windowId });
      return 'side-panel';
    } catch {
      // Fall through to the portable extension-tab UI.
    }
  }

  await chromeApi.tabs.create({ url: chromeApi.runtime.getURL('sidepanel.html') });
  return 'tab';
}

export function configureSidePanel(chromeApi) {
  if (!chromeApi.sidePanel?.setPanelBehavior) return;
  chromeApi.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}
