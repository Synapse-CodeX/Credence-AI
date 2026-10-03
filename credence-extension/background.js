// CredenceAI — Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'verify-selection',
    title: 'Verify with CredenceAI',
    contexts: ['selection']
  });

  console.log('CredenceAI Fact Checker installed.');
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'verify-selection' || !tab?.id) {
    return;
  }

  const message = {
    command: 'run_fact_check',
    text: info.selectionText || ''
  };

  try {
    // First try to send the message to the existing content script.
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    console.log(
      'Content script not available. Injecting it into the page...'
    );

    try {
      // Inject content script into the current page.
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Inject styles as well.
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
      });

      // Give the injected script a moment to initialize.
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send the selected text to the newly injected content script.
      await chrome.tabs.sendMessage(tab.id, message);

    } catch (injectionError) {
      console.error(
        'Failed to inject CredenceAI content script:',
        injectionError
      );
    }
  }
});