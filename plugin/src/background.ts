/**
 * Browser Extension Background Script
 * 浏览器插件后台脚本
 */

import { CommunicationManager } from './utils/CommunicationManager';
import { PluginStatusMessage } from '../../shared/communication';

class BackgroundService {
  private communicationManager: CommunicationManager;
  private activeConnections: Map<number, chrome.runtime.Port> = new Map();

  constructor() {
    this.communicationManager = new CommunicationManager();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Web Automation Plugin installed:', details.reason);
      this.initializePlugin();
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab.url);
      }
    });

    // Handle content script connections
    chrome.runtime.onConnect.addListener((port) => {
      this.handleContentScriptConnection(port);
    });

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  private async initializePlugin(): Promise<void> {
    try {
      // Connect to orchestrator backend
      await this.communicationManager.connect();
      
      // Send plugin status
      const statusMessage: PluginStatusMessage = {
        id: crypto.randomUUID(),
        type: 'plugin_status',
        timestamp: new Date().toISOString(),
        source: 'plugin',
        target: 'orchestrator',
        payload: {
          status: 'connected',
          page_url: '',
          ready: true
        }
      };
      
      await this.communicationManager.sendMessage(statusMessage);
      
      console.log('Plugin initialized and connected to orchestrator');
    } catch (error) {
      console.error('Failed to initialize plugin:', error);
    }
  }

  private handleTabUpdate(tabId: number, url: string): void {
    // Inject content script if needed
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(error => {
      console.log('Content script already injected or failed to inject:', error);
    });

    // Notify orchestrator about page change
    const statusMessage: PluginStatusMessage = {
      id: crypto.randomUUID(),
      type: 'plugin_status',
      timestamp: new Date().toISOString(),
      source: 'plugin',
      target: 'orchestrator',
      payload: {
        status: 'connected',
        page_url: url,
        ready: true
      }
    };

    this.communicationManager.sendMessage(statusMessage).catch(error => {
      console.error('Failed to send page update:', error);
    });
  }

  private handleContentScriptConnection(port: chrome.runtime.Port): void {
    const tabId = port.sender?.tab?.id;
    if (tabId) {
      this.activeConnections.set(tabId, port);
      
      port.onDisconnect.addListener(() => {
        this.activeConnections.delete(tabId);
      });

      port.onMessage.addListener((message) => {
        this.forwardToOrchestrator(message, tabId);
      });
    }
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'element_selected':
        case 'operation_defined':
          await this.forwardToOrchestrator(message, sender.tab?.id);
          sendResponse({ success: true });
          break;
          
        case 'node_connection_request':
          await this.forwardToContentScript(message, message.payload.tab_id);
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  private async forwardToOrchestrator(message: any, tabId?: number): Promise<void> {
    if (this.communicationManager.isConnected()) {
      await this.communicationManager.sendMessage({
        ...message,
        source: 'plugin',
        target: 'orchestrator',
        tab_id: tabId
      });
    }
  }

  private async forwardToContentScript(message: any, tabId: number): Promise<void> {
    const port = this.activeConnections.get(tabId);
    if (port) {
      port.postMessage(message);
    } else {
      // Try to send via tabs API
      try {
        await chrome.tabs.sendMessage(tabId, message);
      } catch (error) {
        console.error('Failed to send message to content script:', error);
      }
    }
  }
}

// Initialize background service
const backgroundService = new BackgroundService();

export { BackgroundService };