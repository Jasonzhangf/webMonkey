/**
 * Simple test script to verify extension functionality
 * 简单的测试脚本来验证扩展功能
 */

// Test the background script functionality
console.log('Testing Web Automation Orchestrator Extension...');

// Test 1: Check if manifest is valid
try {
  const manifest = chrome.runtime.getManifest();
  console.log('✓ Manifest loaded successfully:', manifest.name, 'v' + manifest.version);
} catch (error) {
  console.error('✗ Failed to load manifest:', error);
}

// Test 2: Check if background script is running
chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
  if (response) {
    console.log('✓ Background script is responding');
    console.log('Connection status:', response.connected ? 'Connected' : 'Disconnected');
  } else {
    console.error('✗ Background script is not responding');
  }
});

// Test 3: Check if content script can be injected
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        return typeof window.waoContentScriptInjected !== 'undefined';
      }
    }, (results) => {
      if (results && results[0]) {
        console.log('✓ Content script injection test passed');
      } else {
        console.log('ℹ Content script not yet injected (normal for new tabs)');
      }
    });
  }
});

console.log('Extension test completed. Check console for results.');