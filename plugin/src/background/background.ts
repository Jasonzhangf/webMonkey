import { CommunicationManager } from '../utils/CommunicationManager';

class BackgroundScript {
  private websocket: WebSocket | null = null;
  private contentScriptPort: chrome.runtime.Port | null = null;

  constructor() {
    this.connectWebSocket();
    chrome.runtime.onConnect.addListener(this.handleConnection.bind(this));
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  private connectWebSocket() {
    // Replace with your WebSocket server address
    this.websocket = new WebSocket('ws://localhost:8765');

    this.websocket.onopen = () => {
      console.log('Background: WebSocket connection established.');
    };

    this.websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Background: Received message from WebSocket:', message);
      if (this.contentScriptPort) {
        this.contentScriptPort.postMessage(message);
      }
    };

    this.websocket.onclose = () => {
      console.log('Background: WebSocket connection closed. Reconnecting...');
      setTimeout(() => this.connectWebSocket(), 1000);
    };

    this.websocket.onerror = (error) => {
      console.error('Background: WebSocket error:', error);
    };
  }

  private handleConnection(port: chrome.runtime.Port) {
    if (port.name === 'content-script') {
      this.contentScriptPort = port;
      console.log('Background: Content script connected.');

      port.onMessage.addListener((message) => {
        console.log('Background: Received message from content script:', message);
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send(JSON.stringify(message));
        } else {
          console.error('Background: WebSocket is not connected.');
        }
      });

      port.onDisconnect.addListener(() => {
        this.contentScriptPort = null;
        console.log('Background: Content script disconnected.');
      });
    }
  }

  // 处理来自content script的消息
  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean {
    console.log('Background: Received message:', message);
    
    if (message.type === 'BACKEND_REQUEST') {
      this.handleBackendRequest(message, sendResponse);
      return true; // 异步响应
    }
    
    return false;
  }

  // 处理后端请求
  private async handleBackendRequest(
    message: { action: string; data: any },
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const { action, data } = message;
      
      switch (action) {
        case 'SAVE_COOKIES':
          await this.saveCookiesToBackend(data, sendResponse);
          break;
          
        case 'LOAD_COOKIES':
          await this.loadCookiesFromBackend(data, sendResponse);
          break;
          
        default:
          sendResponse({
            success: false,
            error: `Unknown action: ${action}`
          });
      }
    } catch (error) {
      console.error('Background: Backend request failed:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 保存Cookie到后端
  private async saveCookiesToBackend(
    domainCookies: any,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const requestData = {
        type: 'COOKIE_SAVE',
        data: domainCookies,
        timestamp: Date.now()
      };

      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        // 发送到WebSocket服务器
        this.websocket.send(JSON.stringify(requestData));
        
        // 等待响应（简化处理，实际应该设置超时）
        const responsePromise = new Promise((resolve) => {
          const messageHandler = (event: MessageEvent) => {
            const response = JSON.parse(event.data);
            if (response.type === 'COOKIE_SAVE_RESPONSE') {
              this.websocket?.removeEventListener('message', messageHandler);
              resolve(response);
            }
          };
          this.websocket?.addEventListener('message', messageHandler);
          
          // 5秒超时
          setTimeout(() => {
            this.websocket?.removeEventListener('message', messageHandler);
            resolve({ success: false, error: 'Backend timeout' });
          }, 5000);
        });

        const response = await responsePromise;
        sendResponse(response);
      } else {
        // WebSocket未连接，尝试HTTP请求作为备选
        await this.saveViHttpBackup(domainCookies, sendResponse);
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 从后端加载Cookie
  private async loadCookiesFromBackend(
    requestData: { domain: string; url: string },
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const request = {
        type: 'COOKIE_LOAD',
        data: requestData,
        timestamp: Date.now()
      };

      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(request));
        
        const responsePromise = new Promise((resolve) => {
          const messageHandler = (event: MessageEvent) => {
            const response = JSON.parse(event.data);
            if (response.type === 'COOKIE_LOAD_RESPONSE') {
              this.websocket?.removeEventListener('message', messageHandler);
              resolve(response);
            }
          };
          this.websocket?.addEventListener('message', messageHandler);
          
          setTimeout(() => {
            this.websocket?.removeEventListener('message', messageHandler);
            resolve({ success: false, error: 'Backend timeout' });
          }, 5000);
        });

        const response = await responsePromise;
        sendResponse(response);
      } else {
        await this.loadViaHttpBackup(requestData, sendResponse);
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // HTTP备选方案 - 保存Cookie
  private async saveViHttpBackup(
    domainCookies: any,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const response = await fetch('http://localhost:5009/api/cookies/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(domainCookies)
      });

      if (response.ok) {
        const result = await response.json();
        sendResponse({ success: true, data: result });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: `HTTP backup failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  // HTTP备选方案 - 加载Cookie
  private async loadViaHttpBackup(
    requestData: { domain: string; url: string },
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const response = await fetch(`http://localhost:5009/api/cookies/load?domain=${encodeURIComponent(requestData.domain)}`);

      if (response.ok) {
        const result = await response.json();
        sendResponse({ success: true, data: result });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: `HTTP backup failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}

new BackgroundScript();
