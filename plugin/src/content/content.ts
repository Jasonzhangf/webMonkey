/**
 * Content Script - 页面内容脚本
 * Injected into web pages to provide element selection and operation definition
 */

import { ElementData } from '../../../shared/types';
import { PluginStatusMessage } from '../../../shared/communication';
import { ElementSelector } from './ElementSelector';
import { registerContentScript } from './direct-message-handler';

interface BoundOperation {
  id: string;
  element: HTMLElement;
  elementData: ElementData;
  action: string;
  delay: number;
  timestamp: number;
}

class ContentScript {
  private isActive: boolean = false;

  private port: chrome.runtime.Port | null = null;
  private operationMenu: HTMLElement | null = null;
  private floatingMenu: HTMLElement | null = null;
  private operationListMenu: HTMLElement | null = null;
  private elementSelector: ElementSelector = new ElementSelector();
  private lastHoveredElement: HTMLElement | null = null;
  
  // UI elements
  private selectionOverlay: HTMLElement | null = null;
  private confirmButton: HTMLElement | null = null;
  private isMouseOverButton: boolean = false;
  private isMouseOverElement: boolean = false;
  private hideTimeout: number | null = null;
  private debounceTimeout: number | null = null;
  private capturedCount: number = 0;

  // Operation binding and execution
  private boundOperations: BoundOperation[] = [];
  private isExecuting: boolean = false;

  constructor() {
    try {
      console.log('Initializing content script...');
      
      this.setupEventListeners();
      this.injectStyles();
      this.createFloatingMenu();
      this.connectToBackground();
      
      setTimeout(() => {
        this.notifyPageReady();
      }, 1000);
      
      registerContentScript(this);
      
      console.log('Content script initialized successfully');
    } catch (error) {
      console.error('Error in content script constructor:', error);
    }
  }

  public disconnect(): void {
    this.isActive = false;
    
    this.removeHighlight();
    this.hideOperationMenu();
    this.updateFloatingMenu();
  }

  private setupEventListeners(): void {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('click', this.handleClick.bind(this), true);
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
  }

  private connectToBackground(): void {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        console.log('Extension context is invalid, cannot connect');
        return;
      }
      
      this.port = chrome.runtime.connect({ name: 'content-script' });
      
      this.port.onMessage.addListener((message) => {
        this.handleBackgroundMessage(message);
      });
      
      this.port.onDisconnect.addListener(() => {
        console.log('Content script disconnected from background');
        this.port = null;
      });
      
      console.log('Content script connected to background');
    } catch (error) {
      console.error('Failed to connect to background:', error);
      this.port = null;
    }
  }

  private handleBackgroundMessage(message: any): void {
    switch (message.type) {
      case 'enter_capture_mode':
        this.enterCaptureMode();
        break;
      default:
        console.warn('Unknown message from background:', message);
    }
  }
  
  private enterCaptureMode(): void {
    this.isActive = true;
    this.updateFloatingMenu();
    this.showNotification('已进入捕获模式，请将鼠标悬停在要捕获的元素上', 'info');
  }

  private handleMouseOver(event: MouseEvent): void {
    if (!this.isActive) return;
    
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('wao-confirm-button') || 
        target.closest('.wao-confirm-button')) {
      this.isMouseOverButton = true;
      event.stopPropagation();
      return;
    }
    
    if (target.classList.contains('wao-selection-overlay') || 
        target.classList.contains('wao-highlight') ||
        target.classList.contains('wao-highlight-pulse') ||
        target.classList.contains('wao-floating-menu')) {
      return;
    }
    
    if (this.isMouseOverButton) {
      return;
    }
    
    if (this.elementSelector.isValidTarget(target)) {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      
      this.isMouseOverElement = true;
      
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      this.debounceTimeout = setTimeout(() => {
        this.handleElementHover(target);
        this.debounceTimeout = null;
      }, 50);
    }
  }
  
  private handleElementHover(target: HTMLElement): void {
    if (this.lastHoveredElement !== target) {
      this.removeHighlight();
      this.lastHoveredElement = target;
      
      target.classList.add('wao-highlight');
      this.showConfirmButton(target);
    }
  }

  private handleMouseOut(event: MouseEvent): void {
    if (!this.isActive) return;
    
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    if (target.classList.contains('wao-confirm-button')) {
      this.isMouseOverButton = false;
      if (!this.isMouseOverElement) {
        this.scheduleHide();
      }
      return;
    }
    
    if (target === this.lastHoveredElement) {
      this.isMouseOverElement = false;
      
      if (relatedTarget && relatedTarget.classList.contains('wao-confirm-button')) {
        this.isMouseOverButton = true;
        return;
      }
      
      if (!this.isMouseOverButton) {
        this.scheduleHide();
      }
    }
  }
  
  private scheduleHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    
    this.hideTimeout = setTimeout(() => {
      if (!this.isMouseOverElement && !this.isMouseOverButton) {
        this.removeHighlight();
      }
      this.hideTimeout = null;
    }, 500);
  }

  private handleClick(event: MouseEvent): void {
    if (!this.isActive) return;
    
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('wao-confirm-button')) {
      event.preventDefault();
      event.stopPropagation();
      
      if (this.lastHoveredElement) {
        this.lastHoveredElement.classList.add('wao-highlight-pulse');
        this.selectElement(this.lastHoveredElement);
        
        setTimeout(() => {
          this.removeHighlight();
        }, 1000);
      }
    }
  }
  
  private showConfirmButton(element: HTMLElement): void {
    this.removeConfirmButton();
    
    const rect = element.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'wao-selection-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '2147483646';
    
    const button = document.createElement('button');
    button.className = 'wao-confirm-button';
    button.textContent = '选择此元素';
    button.style.position = 'fixed';
    button.style.right = '20px';
    button.style.top = '20px';
    button.style.zIndex = '2147483647';
    button.style.padding = '8px 12px';
    button.style.background = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontWeight = 'bold';
    button.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
    button.style.whiteSpace = 'nowrap';
    button.style.userSelect = 'none';
    button.style.pointerEvents = 'auto';
    button.style.minWidth = '100px';
    button.style.textAlign = 'center';
    button.style.transition = 'none';
    
    button.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      this.isMouseOverButton = true;
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });
    
    button.addEventListener('mouseleave', (e) => {
      e.stopPropagation();
      this.isMouseOverButton = false;
      if (!this.isMouseOverElement) {
        this.scheduleHide();
      }
    });
    
    document.body.appendChild(overlay);
    document.body.appendChild(button);
    
    this.selectionOverlay = overlay;
    this.confirmButton = button;
  }
  
  private removeConfirmButton(): void {
    if (this.selectionOverlay) {
      this.selectionOverlay.remove();
      this.selectionOverlay = null;
    }
    
    if (this.confirmButton) {
      this.confirmButton.remove();
      this.confirmButton = null;
    }
  }
  
  private removeHighlight(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    
    this.isMouseOverButton = false;
    this.isMouseOverElement = false;
    
    if (this.lastHoveredElement) {
      this.lastHoveredElement.classList.remove('wao-highlight');
      this.lastHoveredElement.classList.remove('wao-highlight-pulse');
      this.lastHoveredElement = null;
    }
    
    this.removeConfirmButton();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isActive) return;
    
    if (event.key === 'Escape') {
      if (this.lastHoveredElement) {
        this.removeHighlight();
      } else {
        this.disconnect();
      }
    }
  }

  private handlePageUnload(): void {
    this.disconnect();
  }

  private selectElement(element: HTMLElement): void {
    const elementData = this.generateElementData(element);
    
    // Show operation menu for the selected element
    this.showOperationMenu(element, elementData);
    
    chrome.runtime.sendMessage({
      type: 'element_captured',
      selector: {
        css: elementData.selectors.css,
        attributes: elementData.selectors.attributes
      },
      metadata: elementData.metadata
    });
    
    this.capturedCount++;
    this.showNotification('元素已成功捕获！请选择要执行的操作', 'success');
    
    console.log('Element selected:', elementData);
  }

  // Enhanced click simulation with two methods
  private simulateClick(element: HTMLElement, method: 'mouse' | 'javascript' = 'mouse'): void {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (method === 'mouse') {
      // Method 1: Using MouseEvent (simulates real mouse interaction)
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: centerX,
        clientY: centerY,
        button: 0
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: centerX,
        clientY: centerY,
        button: 0
      });
      
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: centerX,
        clientY: centerY,
        button: 0
      });

      // Dispatch events in sequence
      element.dispatchEvent(mouseDownEvent);
      setTimeout(() => {
        element.dispatchEvent(mouseUpEvent);
        setTimeout(() => {
          element.dispatchEvent(clickEvent);
        }, 10);
      }, 10);
    } else {
      // Method 2: Using JavaScript's native click() method
      try {
        element.click();
      } catch (error) {
        console.log('Native click failed, falling back to event dispatch');
        // Fallback to mouse event if native click fails
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: centerX,
          clientY: centerY
        });
        element.dispatchEvent(clickEvent);
      }
    }

    // Visual feedback
    element.classList.add('wao-simulated-click');
    setTimeout(() => {
      element.classList.remove('wao-simulated-click');
    }, 300);

    this.showNotification(`已执行${method === 'mouse' ? '鼠标模拟' : 'JavaScript'}点击`, 'success');
  }

  // Enter key simulation
  private simulateEnterKey(element: HTMLElement): void {
    // Focus the element first
    element.focus();
    
    // Create keydown event
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    
    // Create keypress event
    const keypressEvent = new KeyboardEvent('keypress', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    
    // Create keyup event
    const keyupEvent = new KeyboardEvent('keyup', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    
    // Dispatch events in sequence
    element.dispatchEvent(keydownEvent);
    element.dispatchEvent(keypressEvent);
    element.dispatchEvent(keyupEvent);
    
    // For form elements, try to submit the form
    if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
      const form = element.closest('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }

    this.showNotification('已模拟Enter键按下', 'success');
  }

  private generateElementData(element: HTMLElement): ElementData {
    const rect = element.getBoundingClientRect();
    
    return {
      selectors: this.elementSelector.generateSelectors(element),
      operations: [],
      metadata: {
        tagName: element.tagName.toLowerCase(),
        text: element.textContent?.trim() || '',
        position: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY
        }
      }
    };
  }

  private showOperationMenu(element: HTMLElement, elementData: ElementData): void {
    this.hideOperationMenu();
    
    const rect = element.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'wao-operation-menu';
    menu.innerHTML = `
      <div class="wao-operation-header">
        <span class="wao-operation-title">选择操作</span>
        <button class="wao-operation-close">×</button>
      </div>
      <div class="wao-operation-content">
        <div class="wao-operation-group">
          <h4>点击操作</h4>
          <button class="wao-operation-btn" data-action="click-mouse">鼠标模拟点击</button>
          <button class="wao-operation-btn" data-action="click-js">JavaScript点击</button>
        </div>
        <div class="wao-operation-group">
          <h4>键盘操作</h4>
          <button class="wao-operation-btn" data-action="enter">模拟Enter键</button>
        </div>
        <div class="wao-operation-group">
          <h4>绑定操作</h4>
          <button class="wao-operation-btn" data-action="bind">绑定到操作列表</button>
        </div>
        <div class="wao-operation-group">
          <h4>测试操作</h4>
          <button class="wao-operation-btn" data-action="test">测试选择器</button>
        </div>
      </div>
    `;
    
    // Position the menu
    menu.style.position = 'fixed';
    menu.style.left = `${Math.min(rect.right + 10, window.innerWidth - 250)}px`;
    menu.style.top = `${Math.max(rect.top, 10)}px`;
    menu.style.zIndex = '2147483647';
    
    document.body.appendChild(menu);
    this.operationMenu = menu;
    
    // Add event listeners
    const closeBtn = menu.querySelector('.wao-operation-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideOperationMenu());
    }
    
    const actionBtns = menu.querySelectorAll('.wao-operation-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).getAttribute('data-action');
        this.handleOperationAction(action, element, elementData);
      });
    });
  }

  private handleOperationAction(action: string | null, element: HTMLElement, elementData: ElementData): void {
    if (!action) return;
    
    switch (action) {
      case 'click-mouse':
        this.simulateClick(element, 'mouse');
        break;
      case 'click-js':
        this.simulateClick(element, 'javascript');
        break;
      case 'enter':
        this.simulateEnterKey(element);
        break;
      case 'bind':
        this.bindElementToOperationList(element, elementData);
        break;
      case 'test':
        this.testElementSelector(element, elementData);
        break;
    }
    
    this.hideOperationMenu();
  }

  private hideOperationMenu(): void {
    if (this.operationMenu) {
      this.operationMenu.remove();
      this.operationMenu = null;
    }
  }
  
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `wao-notification wao-notification-${type}`;
    
    let icon = '';
    switch (type) {
      case 'success':
        icon = '✅';
        break;
      case 'error':
        icon = '❌';
        break;
      case 'info':
        icon = 'ℹ️';
        break;
    }
    
    notification.innerHTML = `<span class="wao-notification-icon">${icon}</span> ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('wao-notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  private createFloatingMenu(): void {
    console.log('Creating floating menu...');
    
    if (this.floatingMenu && this.floatingMenu.parentElement) {
      console.log('Removing existing floating menu');
      this.floatingMenu.remove();
      this.floatingMenu = null;
    }
    
    const menu = document.createElement('div');
    menu.className = 'wao-floating-menu';
    menu.innerHTML = `
      <div class="wao-menu-handle">
        <div class="wao-menu-title">网页自动化助手</div>
        <div class="wao-menu-controls">
          <button class="wao-menu-control-button wao-collapse-btn" title="折叠菜单">&#8722;</button>
          <button class="wao-menu-control-button wao-close-btn" title="隐藏菜单">&#10005;</button>
        </div>
      </div>
      <div class="wao-menu-content">
        <div class="wao-status">${this.isActive ? '✅ 捕获模式已激活' : '⏸️ 捕获模式未激活'}</div>
        <button class="wao-menu-button wao-capture-btn" style="background: ${this.isActive ? '#f44336' : '#4CAF50'}">
          ${this.isActive ? '停止捕获' : '开始捕获'}
        </button>
        <button class="wao-menu-button wao-operation-list-btn" style="background: #FF9800">操作列表 (${this.boundOperations.length})</button>
        <button class="wao-menu-button wao-settings-btn" style="background: #2196F3">设置</button>
        <button class="wao-menu-button wao-help-btn" style="background: #9E9E9E">帮助</button>
      </div>
    `;
    
    document.body.appendChild(menu);
    
    const captureBtn = menu.querySelector('.wao-capture-btn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        if (this.isActive) {
          this.disconnect();
        } else {
          this.enterCaptureMode();
        }
      });
    }
    
    const operationListBtn = menu.querySelector('.wao-operation-list-btn');
    if (operationListBtn) {
      operationListBtn.addEventListener('click', () => {
        if (this.operationListMenu) {
          this.operationListMenu.remove();
          this.operationListMenu = null;
        } else {
          this.updateOperationListDisplay();
        }
      });
    }
    
    const closeBtn = menu.querySelector('.wao-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (menu.parentElement) {
          menu.remove();
          this.floatingMenu = null;
        }
      });
    }
    
    const collapseBtn = menu.querySelector('.wao-collapse-btn');
    const content = menu.querySelector('.wao-menu-content');
    if (collapseBtn && content) {
      collapseBtn.addEventListener('click', () => {
        const isCollapsed = (content as HTMLElement).style.display === 'none';
        if (isCollapsed) {
          (content as HTMLElement).style.display = 'flex';
          (menu as HTMLElement).style.width = '220px';
          collapseBtn.innerHTML = '&#8722;';
          collapseBtn.setAttribute('title', '折叠菜单');
        } else {
          (content as HTMLElement).style.display = 'none';
          (menu as HTMLElement).style.width = '180px';
          collapseBtn.innerHTML = '&#43;';
          collapseBtn.setAttribute('title', '展开菜单');
        }
      });
    }
    
    this.addDragFunctionality(menu);
    this.floatingMenu = menu;
    
    console.log('Floating menu created successfully');
  }
  
  private addDragFunctionality(menu: HTMLElement): void {
    const handle = menu.querySelector('.wao-menu-handle');
    if (!handle) return;
    
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    handle.addEventListener('mousedown', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      isDragging = true;
      
      const rect = menu.getBoundingClientRect();
      dragOffset = {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
      };
      
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      if (!isDragging) return;
      
      const x = mouseEvent.clientX - dragOffset.x;
      const y = mouseEvent.clientY - dragOffset.y;
      
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const maxX = window.innerWidth - menuWidth;
      const maxY = window.innerHeight - menuHeight;
      
      menu.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
      menu.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
      menu.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  private updateFloatingMenu(): void {
    console.log('Updating floating menu, isActive:', this.isActive, 'floatingMenu:', this.floatingMenu);
    if (this.floatingMenu && this.floatingMenu.parentElement) {
      const status = this.floatingMenu.querySelector('.wao-status');
      if (status) {
        status.textContent = this.isActive ? '✅ 捕获模式已激活' : '⏸️ 捕获模式未激活';
        (status as HTMLElement).style.color = this.isActive ? '#4CAF50' : '#666';
      }
      
      const captureBtn = this.floatingMenu.querySelector('.wao-capture-btn');
      if (captureBtn) {
        captureBtn.textContent = this.isActive ? '停止捕获' : '开始捕获';
        (captureBtn as HTMLElement).style.background = this.isActive ? '#f44336' : '#4CAF50';
      }
      
      const operationListBtn = this.floatingMenu.querySelector('.wao-operation-list-btn');
      if (operationListBtn) {
        operationListBtn.textContent = `操作列表 (${this.boundOperations.length})`;
      }
    } else {
      console.log('Floating menu not found or not visible, creating new one');
      this.createFloatingMenu();
    }
  }

  private injectStyles(): void {
    console.log('Injecting styles...');
    const style = document.createElement('style');
    style.textContent = `
      .wao-highlight {
        outline: 2px solid #4CAF50 !important;
        outline-offset: 2px !important;
        background-color: rgba(76, 175, 80, 0.1) !important;
        transition: all 0.2s ease !important;
      }
      
      .wao-highlight-pulse {
        outline: 2px solid #FF9800 !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 152, 0, 0.1) !important;
        animation: wao-pulse 1.5s infinite ease-in-out !important;
      }
      
      @keyframes wao-pulse {
        0% { outline-color: #FF9800 !important; outline-offset: 2px !important; }
        50% { outline-color: #FFC107 !important; outline-offset: 4px !important; }
        100% { outline-color: #FF9800 !important; outline-offset: 2px !important; }
      }
      
      .wao-selection-overlay {
        position: fixed !important;
        pointer-events: none !important;
        box-sizing: border-box !important;
        border: 2px dashed #4CAF50 !important;
        background-color: rgba(76, 175, 80, 0.05) !important;
        z-index: 2147483646 !important;
      }
      
      .wao-confirm-button {
        position: fixed !important;
        padding: 8px 12px !important;
        background: #4CAF50 !important;
        color: white !important;
        border: none !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: bold !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3) !important;
        z-index: 2147483647 !important;
        transition: all 0.2s ease !important;
        white-space: nowrap !important;
        user-select: none !important;
        pointer-events: auto !important;
        min-width: 100px !important;
        text-align: center !important;
      }
      
      .wao-confirm-button:hover {
        background: #45a049 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        transform: translateY(-1px) !important;
      }
      
      .wao-floating-menu {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: white !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        padding: 10px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 14px !important;
        transition: all 0.3s ease !important;
        user-select: none !important;
        z-index: 2147483647 !important;
        width: 220px !important;
      }
      
      .wao-menu-handle {
        cursor: move !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 5px !important;
      }
      
      .wao-menu-title {
        font-weight: bold !important;
        font-size: 14px !important;
      }
      
      .wao-menu-controls {
        display: flex !important;
        gap: 5px !important;
      }
      
      .wao-menu-control-button {
        width: 20px !important;
        height: 20px !important;
        padding: 0 !important;
        background: #f0f0f0 !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        font-size: 14px !important;
        line-height: 1 !important;
        transition: background 0.2s ease !important;
      }
      
      .wao-menu-control-button:hover {
        background: #e0e0e0 !important;
      }
      
      .wao-menu-content {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }
      
      .wao-status {
        font-size: 12px !important;
        color: #666 !important;
        margin-bottom: 5px !important;
      }
      
      .wao-menu-button {
        padding: 8px 12px !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        width: 100% !important;
        transition: background 0.2s ease !important;
        font-weight: normal !important;
        text-align: center !important;
        font-size: 14px !important;
      }
      
      .wao-menu-button:hover {
        filter: brightness(1.1) !important;
      }
      
      .wao-notification {
        position: fixed !important;
        top: 80px !important;
        right: 20px !important;
        background: white !important;
        border-radius: 6px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        padding: 12px 16px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        z-index: 2147483647 !important;
        max-width: 300px !important;
        animation: wao-notification-slide 0.3s ease-out !important;
      }
      
      @keyframes wao-notification-slide {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .wao-notification-success {
        border-left: 4px solid #4CAF50 !important;
      }
      
      .wao-notification-error {
        border-left: 4px solid #f44336 !important;
      }
      
      .wao-notification-info {
        border-left: 4px solid #2196F3 !important;
      }
      
      .wao-notification-hide {
        animation: wao-notification-hide 0.3s ease-in forwards !important;
      }
      
      @keyframes wao-notification-hide {
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
      
      .wao-simulated-click {
        outline: 3px solid #FF9800 !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 152, 0, 0.2) !important;
        animation: wao-click-flash 0.3s ease-out !important;
      }
      
      @keyframes wao-click-flash {
        0% { background-color: rgba(255, 152, 0, 0.4) !important; }
        100% { background-color: rgba(255, 152, 0, 0.1) !important; }
      }
      
      .wao-operation-menu {
        position: fixed !important;
        background: white !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
        padding: 0 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        z-index: 2147483647 !important;
        min-width: 200px !important;
        max-width: 300px !important;
      }
      
      .wao-operation-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 12px 16px !important;
        border-bottom: 1px solid #eee !important;
        background: #f8f9fa !important;
        border-radius: 8px 8px 0 0 !important;
      }
      
      .wao-operation-title {
        font-weight: bold !important;
        color: #333 !important;
      }
      
      .wao-operation-close {
        background: none !important;
        border: none !important;
        font-size: 18px !important;
        cursor: pointer !important;
        color: #666 !important;
        padding: 0 !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .wao-operation-close:hover {
        color: #333 !important;
        background: rgba(0,0,0,0.1) !important;
        border-radius: 4px !important;
      }
      
      .wao-operation-content {
        padding: 16px !important;
      }
      
      .wao-operation-group {
        margin-bottom: 16px !important;
      }
      
      .wao-operation-group:last-child {
        margin-bottom: 0 !important;
      }
      
      .wao-operation-group h4 {
        margin: 0 0 8px 0 !important;
        font-size: 12px !important;
        color: #666 !important;
        text-transform: uppercase !important;
        font-weight: 600 !important;
      }
      
      .wao-operation-btn {
        display: block !important;
        width: 100% !important;
        padding: 8px 12px !important;
        margin-bottom: 4px !important;
        background: #f8f9fa !important;
        border: 1px solid #dee2e6 !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        color: #495057 !important;
        transition: all 0.2s ease !important;
        text-align: left !important;
      }
      
      .wao-operation-btn:hover {
        background: #e9ecef !important;
        border-color: #adb5bd !important;
        color: #212529 !important;
      }
      
      .wao-operation-btn:last-child {
        margin-bottom: 0 !important;
      }
      
      .wao-binding-dialog {
        position: fixed !important;
        background: white !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        z-index: 2147483648 !important;
        min-width: 300px !important;
        max-width: 400px !important;
      }
      
      .wao-dialog-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 16px 20px !important;
        border-bottom: 1px solid #eee !important;
        background: #f8f9fa !important;
        border-radius: 8px 8px 0 0 !important;
      }
      
      .wao-dialog-title {
        font-weight: bold !important;
        color: #333 !important;
      }
      
      .wao-dialog-close {
        background: none !important;
        border: none !important;
        font-size: 18px !important;
        cursor: pointer !important;
        color: #666 !important;
        padding: 0 !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .wao-dialog-content {
        padding: 20px !important;
      }
      
      .wao-dialog-field {
        margin-bottom: 16px !important;
      }
      
      .wao-dialog-field label {
        display: block !important;
        margin-bottom: 6px !important;
        font-weight: 500 !important;
        color: #333 !important;
      }
      
      .wao-action-select,
      .wao-delay-input {
        width: 100% !important;
        padding: 8px 12px !important;
        border: 1px solid #dee2e6 !important;
        border-radius: 4px !important;
        font-size: 14px !important;
        color: #495057 !important;
        background: white !important;
      }
      
      .wao-dialog-actions {
        display: flex !important;
        gap: 8px !important;
        justify-content: flex-end !important;
        margin-top: 20px !important;
      }
      
      .wao-dialog-btn {
        padding: 8px 16px !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
      }
      
      .wao-dialog-save {
        background: #007bff !important;
        color: white !important;
      }
      
      .wao-dialog-save:hover {
        background: #0056b3 !important;
      }
      
      .wao-dialog-cancel {
        background: #6c757d !important;
        color: white !important;
      }
      
      .wao-dialog-cancel:hover {
        background: #545b62 !important;
      }
      
      .wao-operation-list-menu {
        position: fixed !important;
        background: white !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        z-index: 2147483647 !important;
        width: 350px !important;
        max-height: 500px !important;
        overflow-y: auto !important;
      }
      
      .wao-operation-list-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 12px 16px !important;
        border-bottom: 1px solid #eee !important;
        background: #f8f9fa !important;
        border-radius: 8px 8px 0 0 !important;
      }
      
      .wao-operation-list-header h4 {
        margin: 0 !important;
        font-size: 14px !important;
        color: #333 !important;
      }
      
      .wao-operation-list-controls {
        display: flex !important;
        gap: 8px !important;
      }
      
      .wao-operation-list-btn {
        padding: 4px 8px !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
      }
      
      .wao-execute-all {
        background: #28a745 !important;
        color: white !important;
      }
      
      .wao-execute-all:hover {
        background: #1e7e34 !important;
      }
      
      .wao-clear-all {
        background: #dc3545 !important;
        color: white !important;
      }
      
      .wao-clear-all:hover {
        background: #c82333 !important;
      }
      
      .wao-operation-list-close {
        background: none !important;
        border: none !important;
        font-size: 18px !important;
        cursor: pointer !important;
        color: #666 !important;
        padding: 0 !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .wao-operation-items {
        padding: 8px !important;
      }
      
      .wao-operation-item {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 8px 12px !important;
        margin-bottom: 4px !important;
        background: #f8f9fa !important;
        border-radius: 4px !important;
        border: 1px solid #dee2e6 !important;
      }
      
      .wao-operation-info {
        flex: 1 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      
      .wao-operation-index {
        font-weight: bold !important;
        color: #007bff !important;
        min-width: 20px !important;
      }
      
      .wao-operation-desc {
        flex: 1 !important;
        color: #333 !important;
      }
      
      .wao-operation-delay {
        font-size: 12px !important;
        color: #666 !important;
        background: #e9ecef !important;
        padding: 2px 6px !important;
        border-radius: 3px !important;
      }
      
      .wao-operation-controls {
        display: flex !important;
        gap: 4px !important;
      }
      
      .wao-operation-control {
        padding: 4px 8px !important;
        border: none !important;
        border-radius: 3px !important;
        cursor: pointer !important;
        font-size: 11px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
      }
      
      .wao-execute-single {
        background: #28a745 !important;
        color: white !important;
      }
      
      .wao-execute-single:hover {
        background: #1e7e34 !important;
      }
      
      .wao-edit-operation {
        background: #ffc107 !important;
        color: #212529 !important;
      }
      
      .wao-edit-operation:hover {
        background: #e0a800 !important;
      }
      
      .wao-remove-operation {
        background: #dc3545 !important;
        color: white !important;
      }
      
      .wao-remove-operation:hover {
        background: #c82333 !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  private notifyPageReady(): void {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        console.log('Extension context is invalid, cannot notify page ready');
        return;
      }
      
      const message: PluginStatusMessage = {
        id: crypto.randomUUID(),
        type: 'plugin_status',
        timestamp: new Date().toISOString(),
        source: 'plugin',
        target: 'orchestrator',
        payload: {
          status: 'connected',
          page_url: window.location.href,
          ready: true
        }
      };
      
      this.sendToBackground(message);
      console.log('Page ready notification sent');
    } catch (error) {
      console.error('Error in notifyPageReady:', error);
    }
  }

  private bindElementToOperationList(element: HTMLElement, elementData: ElementData): void {
    const operation: BoundOperation = {
      id: crypto.randomUUID(),
      element: element,
      elementData: elementData,
      action: 'click-mouse', // Default action
      delay: 3000, // Default 3 seconds
      timestamp: Date.now()
    };
    
    this.boundOperations.push(operation);
    this.showOperationBindingDialog(operation);
    this.updateOperationListDisplay();
    this.showNotification(`元素已绑定到操作列表 (${this.boundOperations.length}个操作)`, 'success');
  }

  private showOperationBindingDialog(operation: BoundOperation): void {
    const dialog = document.createElement('div');
    dialog.className = 'wao-binding-dialog';
    dialog.innerHTML = `
      <div class="wao-dialog-header">
        <span class="wao-dialog-title">配置绑定操作</span>
        <button class="wao-dialog-close">×</button>
      </div>
      <div class="wao-dialog-content">
        <div class="wao-dialog-field">
          <label>操作类型:</label>
          <select class="wao-action-select">
            <option value="click-mouse">鼠标模拟点击</option>
            <option value="click-js">JavaScript点击</option>
            <option value="enter">模拟Enter键</option>
          </select>
        </div>
        <div class="wao-dialog-field">
          <label>等待时间 (毫秒):</label>
          <input type="number" class="wao-delay-input" value="3000" min="0" max="60000" step="100">
        </div>
        <div class="wao-dialog-actions">
          <button class="wao-dialog-btn wao-dialog-save">保存</button>
          <button class="wao-dialog-btn wao-dialog-cancel">取消</button>
        </div>
      </div>
    `;
    
    dialog.style.position = 'fixed';
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.zIndex = '2147483648';
    
    document.body.appendChild(dialog);
    
    // Event listeners
    const closeBtn = dialog.querySelector('.wao-dialog-close');
    const saveBtn = dialog.querySelector('.wao-dialog-save');
    const cancelBtn = dialog.querySelector('.wao-dialog-cancel');
    const actionSelect = dialog.querySelector('.wao-action-select') as HTMLSelectElement;
    const delayInput = dialog.querySelector('.wao-delay-input') as HTMLInputElement;
    
    const closeDialog = () => {
      dialog.remove();
    };
    
    closeBtn?.addEventListener('click', closeDialog);
    cancelBtn?.addEventListener('click', closeDialog);
    
    saveBtn?.addEventListener('click', () => {
      operation.action = actionSelect.value;
      operation.delay = parseInt(delayInput.value);
      this.updateOperationListDisplay();
      closeDialog();
    });
  }

  private updateOperationListDisplay(): void {
    if (!this.operationListMenu) {
      this.createOperationListMenu();
    }
    
    const content = this.operationListMenu?.querySelector('.wao-operation-list-content');
    if (!content) return;
    
    content.innerHTML = `
      <div class="wao-operation-list-header">
        <h4>绑定的操作列表 (${this.boundOperations.length})</h4>
        <div class="wao-operation-list-controls">
          <button class="wao-operation-list-btn wao-execute-all">执行全部</button>
          <button class="wao-operation-list-btn wao-clear-all">清空</button>
        </div>
      </div>
      <div class="wao-operation-items">
        ${this.boundOperations.map((op, index) => `
          <div class="wao-operation-item" data-id="${op.id}">
            <div class="wao-operation-info">
              <span class="wao-operation-index">${index + 1}.</span>
              <span class="wao-operation-desc">${this.getActionDescription(op.action)} - ${op.elementData.metadata.tagName}</span>
              <span class="wao-operation-delay">${op.delay}ms</span>
            </div>
            <div class="wao-operation-controls">
              <button class="wao-operation-control wao-execute-single" data-id="${op.id}">执行</button>
              <button class="wao-operation-control wao-edit-operation" data-id="${op.id}">编辑</button>
              <button class="wao-operation-control wao-remove-operation" data-id="${op.id}">删除</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add event listeners
    this.addOperationListEventListeners();
  }

  private createOperationListMenu(): void {
    if (this.operationListMenu) return;
    
    const menu = document.createElement('div');
    menu.className = 'wao-operation-list-menu';
    menu.innerHTML = `
      <div class="wao-operation-list-header">
        <h4>操作列表</h4>
        <button class="wao-operation-list-close">×</button>
      </div>
      <div class="wao-operation-list-content">
        <!-- Content will be populated by updateOperationListDisplay -->
      </div>
    `;
    
    menu.style.position = 'fixed';
    menu.style.right = '20px';
    menu.style.bottom = '20px';
    menu.style.zIndex = '2147483647';
    
    document.body.appendChild(menu);
    this.operationListMenu = menu;
    
    const closeBtn = menu.querySelector('.wao-operation-list-close');
    closeBtn?.addEventListener('click', () => {
      menu.remove();
      this.operationListMenu = null;
    });
  }

  private addOperationListEventListeners(): void {
    if (!this.operationListMenu) return;
    
    const executeAllBtn = this.operationListMenu.querySelector('.wao-execute-all');
    const clearAllBtn = this.operationListMenu.querySelector('.wao-clear-all');
    
    executeAllBtn?.addEventListener('click', () => this.executeAllOperations());
    clearAllBtn?.addEventListener('click', () => this.clearAllOperations());
    
    // Individual operation controls
    const executeBtns = this.operationListMenu.querySelectorAll('.wao-execute-single');
    const editBtns = this.operationListMenu.querySelectorAll('.wao-edit-operation');
    const removeBtns = this.operationListMenu.querySelectorAll('.wao-remove-operation');
    
    executeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id) this.executeSingleOperation(id);
      });
    });
    
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id) this.editOperation(id);
      });
    });
    
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id) this.removeOperation(id);
      });
    });
  }

  private async executeAllOperations(): Promise<void> {
    if (this.isExecuting || this.boundOperations.length === 0) return;
    
    this.isExecuting = true;
    this.showNotification(`开始执行 ${this.boundOperations.length} 个操作...`, 'info');
    
    try {
      for (let i = 0; i < this.boundOperations.length; i++) {
        const operation = this.boundOperations[i];
        
        this.showNotification(`执行操作 ${i + 1}/${this.boundOperations.length}: ${this.getActionDescription(operation.action)}`, 'info');
        
        // Execute the operation
        await this.executeOperation(operation);
        
        // Wait for the specified delay (except for the last operation)
        if (i < this.boundOperations.length - 1) {
          this.showNotification(`等待 ${operation.delay}ms...`, 'info');
          await this.delay(operation.delay);
        }
      }
      
      this.showNotification('所有操作执行完成！', 'success');
    } catch (error) {
      this.showNotification(`执行过程中出现错误: ${error}`, 'error');
    } finally {
      this.isExecuting = false;
    }
  }

  private async executeSingleOperation(id: string): Promise<void> {
    const operation = this.boundOperations.find(op => op.id === id);
    if (!operation) return;
    
    try {
      await this.executeOperation(operation);
      this.showNotification(`操作执行完成: ${this.getActionDescription(operation.action)}`, 'success');
    } catch (error) {
      this.showNotification(`操作执行失败: ${error}`, 'error');
    }
  }

  private async executeOperation(operation: BoundOperation): Promise<void> {
    // Try to find the element again (in case DOM has changed)
    let element = operation.element;
    
    // If element is no longer in DOM, try to find it using selectors
    if (!document.contains(element)) {
      const foundElement = document.querySelector(operation.elementData.selectors.css);
      if (foundElement instanceof HTMLElement) {
        element = foundElement;
      } else {
        throw new Error('元素未找到，可能已从页面中移除');
      }
    }
    
    // Execute the action
    switch (operation.action) {
      case 'click-mouse':
        this.simulateClick(element, 'mouse');
        break;
      case 'click-js':
        this.simulateClick(element, 'javascript');
        break;
      case 'enter':
        this.simulateEnterKey(element);
        break;
      default:
        throw new Error(`未知的操作类型: ${operation.action}`);
    }
  }

  private editOperation(id: string): void {
    const operation = this.boundOperations.find(op => op.id === id);
    if (!operation) return;
    
    this.showOperationBindingDialog(operation);
  }

  private removeOperation(id: string): void {
    this.boundOperations = this.boundOperations.filter(op => op.id !== id);
    this.updateOperationListDisplay();
    this.showNotification('操作已从列表中移除', 'info');
  }

  private clearAllOperations(): void {
    this.boundOperations = [];
    this.updateOperationListDisplay();
    this.showNotification('操作列表已清空', 'info');
  }

  private getActionDescription(action: string): string {
    switch (action) {
      case 'click-mouse': return '鼠标点击';
      case 'click-js': return 'JS点击';
      case 'enter': return 'Enter键';
      default: return action;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private testElementSelector(element: HTMLElement, elementData: ElementData): void {
    // Test CSS selector
    const cssResult = document.querySelector(elementData.selectors.css);
    const cssMatch = cssResult === element;
    
    // Test XPath selector
    let xpathMatch = false;
    try {
      const xpathResult = document.evaluate(
        elementData.selectors.xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      xpathMatch = xpathResult.singleNodeValue === element;
    } catch (error) {
      console.error('XPath test failed:', error);
    }
    
    const message = `选择器测试结果:\nCSS: ${cssMatch ? '✅' : '❌'}\nXPath: ${xpathMatch ? '✅' : '❌'}`;
    this.showNotification(message, cssMatch && xpathMatch ? 'success' : 'error');
    
    console.log('Selector test results:', {
      css: { selector: elementData.selectors.css, match: cssMatch },
      xpath: { selector: elementData.selectors.xpath, match: xpathMatch }
    });
  }

  private sendToBackground(message: any): void {
    if (this.port) {
      this.port.postMessage(message);
    } else {
      console.warn('No connection to background script');
    }
  }
}

// 确保全局变量可以被检测到
(window as any).waoContentScriptInjected = true;

// 检查是否已经初始化
if (!(window as any).waoContentScriptInitialized) {
  try {
    (window as any).waoContentScriptInitialized = true;
    
    const initContentScript = () => {
      try {
        new ContentScript();
        console.log('Content script initialized successfully');
      } catch (error) {
        console.error('Failed to initialize content script:', error);
      }
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initContentScript);
    } else {
      initContentScript();
    }
  } catch (error) {
    console.error('Error in content script initialization:', error);
  }
} else {
  console.log('Content script already initialized');
}

export { ContentScript };