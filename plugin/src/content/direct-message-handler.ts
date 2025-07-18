/**
 * 直接消息处理器
 * 用于处理来自popup的消息，即使内容脚本尚未完全初始化
 */

// 全局变量，存储内容脚本实例
let contentScriptInstance: any = null;

// 注册内容脚本实例
export function registerContentScript(instance: any) {
  contentScriptInstance = instance;
  console.log('Content script instance registered');
}

// 初始化消息监听器
export function initializeMessageListener() {
  // 添加消息监听器，处理来自popup的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      console.log('Direct message handler received message:', message);
      
      // 如果内容脚本实例已注册，则转发消息
      if (contentScriptInstance) {
        switch (message.type) {
          case 'enter_capture_mode':
            contentScriptInstance.enterCaptureMode();
            sendResponse({ success: true });
            break;
            
          case 'test_selector':
            const result = contentScriptInstance.testSelector(message.selector);
            sendResponse(result);
            break;
            
          default:
            console.warn('Unknown message type:', message.type);
            sendResponse({ success: false, error: '未知消息类型' });
        }
      } else {
        // 内容脚本实例尚未注册
        console.warn('Content script instance not registered yet');
        sendResponse({ success: false, error: '内容脚本尚未初始化' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: errorMessage });
    }
    
    return true; // 保持消息通道开放，以便异步响应
  });
  
  console.log('Direct message handler initialized');
}

// 立即初始化消息监听器
initializeMessageListener();