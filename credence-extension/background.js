// CredenceAI — Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'verify-selection',
    title: 'Verify with CredenceAI',
    contexts: ['selection']
  });
  console.log('CredenceAI Fact Checker installed.');
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'verify-selection' && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      command: 'run_fact_check',
      text: info.selectionText
    });
  }
});
