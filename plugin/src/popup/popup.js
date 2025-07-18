/**
 * Popup Script for Web Automation Orchestrator Extension
 */

class PopupController {
  constructor() {
    this.statusElement = document.getElementById('status');
    this.connectBtn = document.getElementById('connect-btn');
    this.captureBtn = document.getElementById('capture-btn');
    this.testBtn = document.getElementById('test-btn');
    this.recordBtn = document.getElementById('record-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.helpBtn = document.getElementById('help-btn');
    this.currentUrlElement = document.getElementById('current-url');
    this.connectionStatusElement = document.getElementById('connection-status');
    this.captureResultElement = document.getElementById('capture-result');
    this.selectorDisplayElement = document.getElementById('selector-display');
    
    // 存储当前选择器
    this.currentSelector = null;
    
    this.init();
  }
  
  async init() {
    this.setupEventListeners();
    await this.updateStatus();
    await this.updateCurrentTab();
    await this.loadSavedSelector();
  }
  
  setupEventListeners() {
    this.connectBtn.addEventListener('click', () => this.handleConnect());
    this.captureBtn.addEventListener('click', () => this.handleCapture());
    this.testBtn.addEventListener('click', () => this.handleTest());
    this.recordBtn.addEventListener('click', () => this.handleRecord());
    this.settingsBtn.addEventListener('click', () => this.handleSettings());
    this.helpBtn.addEventListener('click', () => this.handleHelp());
  }
  
  async loadSavedSelector() {
    try {
      const result = await chrome.storage.local.get(['currentSelector', 'selectorMetadata']);
      if (result.currentSelector) {
        this.currentSelector = result.currentSelector;
        this.selectorMetadata = result.selectorMetadata;
        this.displaySelector(this.currentSelector, this.selectorMetadata);
      }
      
      // 添加消息监听器，接收选择器更新
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'selector_updated') {
          this.currentSelector = message.selector;
          this.selectorMetadata = message.metadata;
          this.displaySelector(this.currentSelector, this.selectorMetadata);
        }
      });
    } catch (error) {
      console.error('Failed to load saved selector:', error);
    }
  }
  
  async updateStatus() {
    try {
      // Check connection status with background script
      const response = await chrome.runtime.sendMessage({ type: 'get_status' });
      
      if (response && response.connected) {
        this.setConnectedStatus();
      } else {
        this.setDisconnectedStatus();
      }
    } catch (error) {
      console.error('Failed to get status:', error);
      this.setDisconnectedStatus();
    }
  }
  
  async updateCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        this.currentUrlElement.textContent = url.hostname;
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
      this.currentUrlElement.textContent = '未知';
    }
  }
  
  setConnectedStatus() {
    this.statusElement.className = 'status connected';
    this.statusElement.textContent = '已连接到编排器';
    this.connectBtn.textContent = '断开连接';
    this.connectionStatusElement.textContent = '已连接';
  }
  
  setDisconnectedStatus() {
    this.statusElement.className = 'status disconnected';
    this.statusElement.textContent = '未连接到编排器';
    this.connectBtn.textContent = '连接编排器';
    this.connectionStatusElement.textContent = '未连接';
  }
  
  async handleConnect() {
    try {
      if (this.connectBtn.textContent === '连接编排器') {
        // Attempt to connect
        this.connectBtn.textContent = '连接中...';
        this.connectBtn.disabled = true;
        
        const response = await chrome.runtime.sendMessage({ type: 'connect_orchestrator' });
        
        if (response && response.success) {
          this.setConnectedStatus();
        } else {
          throw new Error(response?.error || '连接失败');
        }
      } else {
        // Disconnect
        await chrome.runtime.sendMessage({ type: 'disconnect_orchestrator' });
        this.setDisconnectedStatus();
      }
    } catch (error) {
      console.error('Connection error:', error);
      this.setDisconnectedStatus();
      alert('连接失败: ' + error.message);
    } finally {
      this.connectBtn.disabled = false;
    }
  }
  
  handleSettings() {
    // Open settings page
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  }
  
  handleHelp() {
    // Open help page
    chrome.tabs.create({ url: 'https://github.com/your-repo/web-automation-orchestrator' });
  }
  
  async handleCapture() {
    try {
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        alert('无法获取当前标签页');
        return;
      }
      
      // 检查标签页URL
      if (!tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
        alert('只能在HTTP或HTTPS页面上捕获元素');
        return;
      }
      
      try {
        // 尝试注入内容脚本（如果尚未注入）
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // 检查内容脚本是否已注入
            return typeof window.waoContentScriptInjected !== 'undefined';
          }
        });
        
        // 发送消息到当前标签页，进入捕获模式
        const response = await chrome.tabs.sendMessage(tab.id, { 
          type: 'enter_capture_mode'
        });
        
        if (response && response.success) {
          // 关闭弹出窗口，让用户可以在页面上选择元素
          window.close();
        } else {
          alert('无法进入捕获模式: ' + (response?.error || '未知错误'));
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        
        // 尝试重新注入内容脚本
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          alert('内容脚本已重新注入，请再次点击"捕获元素"按钮');
        } catch (injectError) {
          console.error('注入内容脚本失败:', injectError);
          alert('无法注入内容脚本，请刷新页面后重试');
        }
      }
    } catch (error) {
      console.error('捕获元素失败:', error);
      alert('捕获元素失败: ' + error.message);
    }
  }
  
  async handleTest() {
    try {
      if (!this.currentSelector) {
        alert('没有可测试的选择器');
        return;
      }
      
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        alert('无法获取当前标签页');
        return;
      }
      
      // 发送消息到当前标签页，测试选择器
      const response = await chrome.tabs.sendMessage(tab.id, { 
        type: 'test_selector',
        selector: this.currentSelector
      });
      
      if (response && response.success) {
        if (response.found) {
          alert('选择器测试成功！找到匹配元素。');
        } else {
          alert('选择器测试失败！未找到匹配元素。');
        }
      } else {
        alert('无法测试选择器: ' + (response?.error || '未知错误'));
      }
    } catch (error) {
      console.error('测试选择器失败:', error);
      alert('测试选择器失败: ' + error.message);
    }
  }
  
  async handleRecord() {
    try {
      if (!this.currentSelector) {
        alert('没有可记录的选择器');
        return;
      }
      
      // 保存选择器到存储
      await chrome.storage.local.set({ savedSelector: this.currentSelector });
      
      // 发送消息到后台脚本，记录选择器
      const response = await chrome.runtime.sendMessage({ 
        type: 'record_selector',
        selector: this.currentSelector
      });
      
      if (response && response.success) {
        alert('选择器已成功记录！');
      } else {
        alert('无法记录选择器: ' + (response?.error || '未知错误'));
      }
    } catch (error) {
      console.error('记录选择器失败:', error);
      alert('记录选择器失败: ' + error.message);
    }
  }
  
  displaySelector(selector, metadata) {
    if (!selector) return;
    
    this.captureResultElement.style.display = 'block';
    
    // 显示选择器信息
    let html = '';
    
    if (selector.css) {
      html += `<div class="selector-item">
        <div class="selector-label">CSS选择器:</div>
        <div class="selector-value">${selector.css}</div>
      </div>`;
    }
    
    if (selector.attributes && Object.keys(selector.attributes).length > 0) {
      html += `<div class="selector-item">
        <div class="selector-label">属性选择器:</div>
        <div class="selector-value">${JSON.stringify(selector.attributes, null, 2)}</div>
      </div>`;
    }
    
    // 显示元素元数据
    if (metadata) {
      html += `<div class="selector-item">
        <div class="selector-label">元素信息:</div>
        <div class="selector-value">
          <div>标签: ${metadata.tagName}</div>
          ${metadata.text ? `<div>文本: ${metadata.text.substring(0, 50)}${metadata.text.length > 50 ? '...' : ''}</div>` : ''}
        </div>
      </div>`;
    }
    
    this.selectorDisplayElement.innerHTML = html;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});