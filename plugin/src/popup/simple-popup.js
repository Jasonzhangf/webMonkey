/**
 * 简化版弹出窗口脚本
 */

class SimplePopup {
  constructor() {
    this.init();
  }
  
  async init() {
    console.log('初始化弹出窗口...');
    
    // 绑定按钮事件
    this.bindEvents();
    
    // 检查当前页面状态
    await this.checkPageStatus();
  }
  
  bindEvents() {
    // 切换选择模式
    document.getElementById('toggleSelection').addEventListener('click', () => {
      this.toggleSelectionMode();
    });
    
    // 清空选择
    document.getElementById('clearSelection').addEventListener('click', () => {
      this.clearSelection();
    });
    
    // 显示菜单
    document.getElementById('showMenu').addEventListener('click', () => {
      this.showFloatingMenu();
    });
    
    // 打开测试页面
    document.getElementById('testPage').addEventListener('click', () => {
      this.openTestPage();
    });
  }
  
  async checkPageStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        this.updateStatus('无法获取当前页面信息', 'disconnected');
        return;
      }
      
      // 检查是否是有效的网页
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.updateStatus('当前页面不支持元素选择', 'disconnected');
        return;
      }
      
      // 尝试注入内容脚本
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return window.waoSimpleContentScriptReady || false;
          }
        });
        
        this.updateStatus('页面已就绪，可以开始选择元素', 'connected');
      } catch (error) {
        console.log('内容脚本未注入，准备注入...');
        await this.injectContentScript(tab.id);
      }
      
    } catch (error) {
      console.error('检查页面状态失败:', error);
      this.updateStatus('检查页面状态失败', 'disconnected');
    }
  }
  
  async injectContentScript(tabId) {
    try {
      // 注入CSS
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['content.css']
      });
      
      // 注入JS
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['simple-content.js']
      });
      
      this.updateStatus('内容脚本已注入，页面就绪', 'connected');
    } catch (error) {
      console.error('注入内容脚本失败:', error);
      this.updateStatus('无法在当前页面工作', 'disconnected');
    }
  }
  
  updateStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status status-${type}`;
  }
  
  async toggleSelectionMode() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        alert('无法获取当前页面');
        return;
      }
      
      // 发送消息到内容脚本
      await chrome.tabs.sendMessage(tab.id, {
        type: 'toggle_selection_mode'
      });
      
      // 关闭弹出窗口
      window.close();
      
    } catch (error) {
      console.error('切换选择模式失败:', error);
      alert('操作失败，请刷新页面后重试');
    }
  }
  
  async clearSelection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        alert('无法获取当前页面');
        return;
      }
      
      await chrome.tabs.sendMessage(tab.id, {
        type: 'clear_selection'
      });
      
      alert('选择已清空');
      
    } catch (error) {
      console.error('清空选择失败:', error);
      alert('操作失败');
    }
  }
  
  async showFloatingMenu() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        alert('无法获取当前页面');
        return;
      }
      
      await chrome.tabs.sendMessage(tab.id, {
        type: 'show_floating_menu'
      });
      
      window.close();
      
    } catch (error) {
      console.error('显示浮动菜单失败:', error);
      alert('操作失败');
    }
  }
  
  openTestPage() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('test-page.html')
    });
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new SimplePopup();
});