/**
 * Content Script - 页面内容脚本
 * Injected into web pages to provide element selection and operation definition
 */

import { ElementData, Operation } from '../../../shared/types';
import { 
  ElementSelectedMessage, 
  OperationDefinedMessage, 
  PluginStatusMessage,
  NodeConnectionRequest 
} from '../../../shared/communication';
import { ElementSelector } from './ElementSelector';
import { HighlightManager } from './HighlightManager';
import { OperationMenu, OperationConfig } from './OperationMenu';
import { registerContentScript } from './direct-message-handler';

class ContentScript {
  public disconnect(): void {
    this.isActive = false;
    this.currentNodeId = null;
    this.connectionMode = null;
    
    // 移除高亮和确认按钮
    this.removeHighlight();
    
    // 隐藏操作菜单
    this.hideOperationMenu();
    
    // 更新悬浮菜单状态
    this.updateFloatingMenu();
  }
  private isActive: boolean = false;
  private currentNodeId: string | null = null;
  private connectionMode: 'element_selection' | 'operation_definition' | null = null;
  private port: chrome.runtime.Port | null = null;
  private operationMenu: HTMLElement | null = null;
  private floatingMenu: HTMLElement | null = null;
  private elementSelector: ElementSelector = new ElementSelector();
  private highlightManager: HighlightManager = new HighlightManager();
  private lastHoveredElement: HTMLElement | null = null;

  constructor() {
    try {
      console.log('Initializing content script...');
      
      // 设置事件监听器（只调用一次）
      this.setupEventListeners();
      
      // 注入样式
      this.injectStyles();
      
      // 创建悬浮菜单
      console.log('About to create floating menu');
      this.createFloatingMenu();
      console.log('Floating menu created:', this.floatingMenu);
      
      // 连接到后台脚本
      this.connectToBackground();
      
      // 通知页面已准备好
      setTimeout(() => {
        this.notifyPageReady();
      }, 1000); // 延迟1秒，确保连接已建立
      
      // 注册内容脚本实例，以便直接消息处理器可以访问
      registerContentScript(this);
      
      // 初始化完成
      
      console.log('Content script initialized successfully');
    } catch (error) {
      console.error('Error in content script constructor:', error);
    }
  }

  private setupEventListeners(): void {
    // Mouse events for element highlighting
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    
    // Click events for element selection
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Page navigation events
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
    
    // Listen for DOM changes
    const observer = new MutationObserver(this.handleDOMChanges.bind(this));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }

  private connectToBackground(): void {
    // 不要尝试重连，这会导致错误循环
    try {
      // 检查扩展上下文是否有效
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
        
        // 不要尝试重连，这可能会导致错误循环
      });
      
      console.log('Content script connected to background');
    } catch (error) {
      console.error('Failed to connect to background:', error);
      this.port = null;
    }
  }

  private handleBackgroundMessage(message: any): void {
    switch (message.type) {
      case 'node_connection_request':
        this.handleNodeConnectionRequest(message as NodeConnectionRequest);
        break;
        
      case 'node_update':
        this.handleNodeUpdate(message);
        break;
        
      case 'connection_status':
        this.handleConnectionStatus(message);
        break;
        
      case 'enter_capture_mode':
        this.enterCaptureMode();
        break;
        
      case 'test_selector':
        this.testSelector(message.selector);
        break;
        
      default:
        console.warn('Unknown message from background:', message);
    }
  }
  
  private enterCaptureMode(): void {
    // 激活捕获模式
    this.isActive = true;
    this.connectionMode = 'element_selection';
    
    // 更新悬浮菜单状态
    this.updateFloatingMenu();
    
    // 显示提示
    this.showNotification('已进入捕获模式，请将鼠标悬停在要捕获的元素上', 'info');
  }
  
  private testSelector(selector: any): { success: boolean, found: boolean, error?: string } {
    try {
      if (!selector) {
        return { success: false, found: false, error: '没有提供选择器' };
      }
      
      // 尝试使用CSS选择器查找元素
      if (selector.css) {
        const element = document.querySelector(selector.css);
        if (element) {
          // 高亮找到的元素（蓝色）
          this.highlightTestElement(element as HTMLElement);
          return { success: true, found: true };
        }
      }
      
      // 尝试使用属性选择器查找元素
      if (selector.attributes && Object.keys(selector.attributes).length > 0) {
        const attrs = selector.attributes;
        const elements = Array.from(document.querySelectorAll('*'));
        
        for (const element of elements) {
          let match = true;
          
          for (const [key, value] of Object.entries(attrs)) {
            if (element.getAttribute(key) !== value) {
              match = false;
              break;
            }
          }
          
          if (match) {
            // 高亮找到的元素（蓝色）
            this.highlightTestElement(element as HTMLElement);
            return { success: true, found: true };
          }
        }
      }
      
      return { success: true, found: false };
    } catch (error) {
      console.error('测试选择器失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, found: false, error: errorMessage };
    }
  }
  
  private highlightTestElement(element: HTMLElement): void {
    // 移除现有高亮
    this.removeHighlight();
    
    // 添加蓝色高亮
    element.classList.add('wao-highlight-test');
    
    // 3秒后移除高亮
    setTimeout(() => {
      element.classList.remove('wao-highlight-test');
    }, 3000);
  }

  private handleNodeConnectionRequest(message: NodeConnectionRequest): void {
    this.currentNodeId = message.payload.node_id;
    this.connectionMode = message.payload.connection_mode;
    this.isActive = true;
    
    console.log(`Connected to node ${this.currentNodeId} in ${this.connectionMode} mode`);
    
    // Show visual indicator
    this.showConnectionIndicator();
  }

  private handleNodeUpdate(message: any): void {
    if (message.payload.node_id === this.currentNodeId) {
      console.log('Node updated:', message.payload.updates);
    }
  }

  private handleConnectionStatus(message: any): void {
    if (message.payload.node_id === this.currentNodeId) {
      if (message.payload.status === 'disconnected') {
        this.disconnect();
      }
    }
  }

  private selectionOverlay: HTMLElement | null = null;
  private confirmButton: HTMLElement | null = null;
  private isMouseOverButton: boolean = false;
  private isMouseOverElement: boolean = false;
  private hideTimeout: number | null = null;
  private lastMousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private debounceTimeout: number | null = null;
  private capturedCount: number = 0;

  private handleMouseOver(event: MouseEvent): void {
    if (!this.isActive) return;
    
    // 更新鼠标位置
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
    
    const target = event.target as HTMLElement;
    
    // 检查是否是确认按钮或其子元素
    if (target.classList.contains('wao-confirm-button') || 
        target.closest('.wao-confirm-button')) {
      this.isMouseOverButton = true;
      // 阻止事件继续传播，避免触发其他元素的高亮
      event.stopPropagation();
      return;
    }
    
    // 忽略我们自己的UI元素
    if (target.classList.contains('wao-selection-overlay') || 
        target.classList.contains('wao-highlight') ||
        target.classList.contains('wao-highlight-pulse')) {
      return;
    }
    
    // 如果当前鼠标在按钮上，不要处理其他元素的高亮
    if (this.isMouseOverButton) {
      return;
    }
    
    if (this.elementSelector.isValidTarget(target)) {
      // 清除任何待执行的隐藏操作
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      
      this.isMouseOverElement = true;
      
      // 防抖处理，避免频繁更新
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      this.debounceTimeout = setTimeout(() => {
        this.handleElementHover(target, event);
        this.debounceTimeout = null;
      }, 50); // 50ms 防抖延迟
    }
  }
  
  private handleElementHover(target: HTMLElement, event: MouseEvent): void {
    // 只有当悬停在新元素上时才更新高亮
    if (this.lastHoveredElement !== target) {
      this.removeHighlight();
      this.lastHoveredElement = target;
      
      // 添加高亮效果
      target.classList.add('wao-highlight');
      
      // 显示确认按钮，使用固定位置
      this.showConfirmButton(target, event);
      
      // 元素已高亮
    }
  }

  private handleMouseOut(event: MouseEvent): void {
    if (!this.isActive) return;
    
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    // 如果离开的是确认按钮
    if (target.classList.contains('wao-confirm-button')) {
      this.isMouseOverButton = false;
      // 如果鼠标没有移动到元素上，延迟隐藏
      if (!this.isMouseOverElement) {
        this.scheduleHide();
      }
      return;
    }
    
    // 如果离开的是高亮元素
    if (target === this.lastHoveredElement) {
      this.isMouseOverElement = false;
      
      // 如果鼠标移动到确认按钮上，不要隐藏
      if (relatedTarget && relatedTarget.classList.contains('wao-confirm-button')) {
        this.isMouseOverButton = true;
        return;
      }
      
      // 如果鼠标没有在按钮上，延迟隐藏
      if (!this.isMouseOverButton) {
        this.scheduleHide();
      }
    }
  }
  
  private scheduleHide(): void {
    // 清除之前的隐藏计时器
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    
    // 设置新的隐藏计时器
    this.hideTimeout = setTimeout(() => {
      // 再次检查鼠标状态
      if (!this.isMouseOverElement && !this.isMouseOverButton) {
        this.removeHighlight();
      }
      this.hideTimeout = null;
    }, 500); // 增加延迟时间到500ms
  }

  private handleClick(event: MouseEvent): void {
    if (!this.isActive) return;
    
    const target = event.target as HTMLElement;
    
    // 处理确认按钮点击
    if (target.classList.contains('wao-confirm-button')) {
      event.preventDefault();
      event.stopPropagation();
      
      if (this.lastHoveredElement) {
        // 添加脉冲效果表示选择
        this.lastHoveredElement.classList.add('wao-highlight-pulse');
        
        // 选择元素
        this.selectElement(this.lastHoveredElement);
        
        // 移除高亮和确认按钮，但保持插件活跃状态
        setTimeout(() => {
          this.removeHighlight();
          // 保持插件活跃，以便继续捕获或测试
          // this.isActive 保持为 true
        }, 1000);
      }
    }
  }
  
  private showConfirmButton(element: HTMLElement, mouseEvent?: MouseEvent): void {
    // 移除现有的确认按钮
    this.removeConfirmButton();
    
    // 创建选择覆盖层
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
    
    // 创建确认按钮
    const button = document.createElement('button');
    button.className = 'wao-confirm-button';
    button.textContent = '选择此元素';
    button.style.position = 'fixed';
    button.style.right = '20px'; // 固定在右侧
    button.style.top = '20px'; // 固定在顶部
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
    button.style.transition = 'none'; // 禁用过渡效果，避免抖动
    
    // 按钮已经固定在右上角，不需要额外定位
    
    // 添加鼠标事件监听器
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
    
    button.addEventListener('mouseover', (e) => {
      e.stopPropagation();
    });
    
    button.addEventListener('mouseout', (e) => {
      e.stopPropagation();
    });
    
    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(button);
    
    // 存储引用
    this.selectionOverlay = overlay;
    this.confirmButton = button;
  }
  
  // 这个方法已不再使用
  private positionButtonFixed(button: HTMLElement, elementRect: DOMRect): void {
    // 已被内联到showConfirmButton方法中
  }
  
  private positionButtonByElement(button: HTMLElement, elementRect: DOMRect): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonWidth = 120; // 估计按钮宽度
    const buttonHeight = 40; // 估计按钮高度
    const margin = 10; // 与元素的间距
    
    // 默认将按钮放在元素右侧中间位置
    let left = elementRect.right + window.scrollX + margin;
    let top = elementRect.top + window.scrollY + (elementRect.height / 2) - (buttonHeight / 2);
    
    // 检查右侧是否有足够空间
    if (left + buttonWidth > viewportWidth - margin) {
      // 右侧空间不足，尝试放在左侧
      left = elementRect.left + window.scrollX - buttonWidth - margin;
      
      // 如果左侧也不够，放在元素上方
      if (left < margin) {
        left = elementRect.left + window.scrollX + (elementRect.width / 2) - (buttonWidth / 2);
        top = elementRect.top + window.scrollY - buttonHeight - margin;
        
        // 如果上方也不够，放在元素下方
        if (top < margin) {
          top = elementRect.bottom + window.scrollY + margin;
        }
      }
    }
    
    // 确保按钮在视口内
    left = Math.max(margin, Math.min(left, viewportWidth - buttonWidth - margin));
    top = Math.max(margin, Math.min(top, viewportHeight - buttonHeight - margin));
    
    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
  }
  
  private positionButtonAtMouse(button: HTMLElement, mouseEvent?: MouseEvent): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonWidth = 100; // 预估按钮宽度
    const buttonHeight = 40; // 预估按钮高度
    const offset = 15; // 鼠标偏移量，避免按钮直接在鼠标下
    
    // 使用鼠标位置，如果没有鼠标事件则使用最后记录的位置
    let mouseX = mouseEvent ? mouseEvent.clientX : this.lastMousePosition.x;
    let mouseY = mouseEvent ? mouseEvent.clientY : this.lastMousePosition.y;
    
    // 默认将按钮放在鼠标右下方
    let left = mouseX + offset;
    let top = mouseY + offset;
    
    // 检查是否超出右边界
    if (left + buttonWidth / 2 > viewportWidth - 10) {
      left = mouseX - offset - buttonWidth / 2; // 放在鼠标左侧
    }
    
    // 检查是否超出下边界
    if (top + buttonHeight / 2 > viewportHeight - 10) {
      top = mouseY - offset - buttonHeight / 2; // 放在鼠标上方
    }
    
    // 确保按钮完全在视口内
    left = Math.max(buttonWidth / 2 + 10, Math.min(left, viewportWidth - buttonWidth / 2 - 10));
    top = Math.max(buttonHeight / 2 + 10, Math.min(top, viewportHeight - buttonHeight / 2 - 10));
    
    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
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
    // 清除所有计时器
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    

    
    // 重置状态变量
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
    
    // ESC键取消当前操作
    if (event.key === 'Escape') {
      // 如果有高亮的元素，先移除高亮
      if (this.lastHoveredElement) {
        this.removeHighlight();
      } else {
        // 否则断开连接
        this.disconnect();
      }
    }
  }

  private handleKeyUp(_event: KeyboardEvent): void {
    // Handle any key up events if needed
  }

  private handlePageUnload(): void {
    this.disconnect();
  }

  private handleDOMChanges(_mutations: MutationRecord[]): void {
    // 处理可能影响元素选择的DOM变化
    if (this.operationMenu && !document.contains(this.operationMenu)) {
      this.operationMenu = null;
    }
    
    // 检查高亮的元素是否仍然存在于DOM中
    if (this.lastHoveredElement && !document.contains(this.lastHoveredElement)) {
      this.removeHighlight();
    }
  }

  // These methods are now handled by ElementSelector and HighlightManager

  private selectElement(element: HTMLElement): void {
    // 生成元素数据
    const elementData = this.generateElementData(element);
    
    // 如果在节点连接模式下，发送消息到编排器
    if (this.currentNodeId) {
      const message: ElementSelectedMessage = {
        id: crypto.randomUUID(),
        type: 'element_selected',
        timestamp: new Date().toISOString(),
        source: 'plugin',
        target: 'orchestrator',
        node_id: this.currentNodeId,
        payload: {
          node_id: this.currentNodeId,
          element_data: elementData
        }
      };
      
      this.sendToBackground(message);
      
      // 如果在操作定义模式下，显示操作菜单
      if (this.connectionMode === 'operation_definition') {
        this.showOperationMenu(element);
      }
    }
    
    // 将选择器信息发送到popup
    chrome.runtime.sendMessage({
      type: 'element_captured',
      selector: {
        css: elementData.selectors.css,
        attributes: elementData.selectors.attributes
      },
      metadata: elementData.metadata
    });
    
    // 更新捕获计数
    this.capturedCount++;
    
    // 显示捕获成功通知
    this.showNotification('元素已成功捕获！可以继续捕获其他元素或在插件中测试选择器', 'success');
    
    console.log('Element selected:', elementData);
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



  private showOperationMenu(element: HTMLElement): void {
    this.hideOperationMenu();
    
    const rect = element.getBoundingClientRect();
    const position = {
      x: rect.right + window.scrollX + 10,
      y: rect.top + window.scrollY
    };
    
    // Create operation menu
    const menu = new OperationMenu({
      position,
      element,
      onSelect: (config: OperationConfig) => {
        this.defineOperation(element, config);
      },
      onCancel: () => {
        this.operationMenu = null;
      }
    });
    
    // Store reference to menu element
    const menuElement = document.querySelector('.wao-operation-menu');
    if (menuElement) {
      this.operationMenu = menuElement as HTMLElement;
    }
  }

  private hideOperationMenu(): void {
    if (this.operationMenu) {
      this.operationMenu.remove();
      this.operationMenu = null;
    }
  }

  private defineOperation(element: HTMLElement, config: OperationConfig): void {
    if (!this.currentNodeId) return;
    
    const operation: Operation = {
      type: config.type as any,
      params: config.params,
      delay: config.delay
    };
    
    const message: OperationDefinedMessage = {
      id: crypto.randomUUID(),
      type: 'operation_defined',
      timestamp: new Date().toISOString(),
      source: 'plugin',
      target: 'orchestrator',
      node_id: this.currentNodeId,
      payload: {
        node_id: this.currentNodeId,
        operation: {
          type: config.type,
          parameters: config.params,
          delay: config.delay
        }
      }
    };
    
    this.sendToBackground(message);
    this.hideOperationMenu();
    
    // Show success notification
    this.showNotification(`已定义${this.getOperationTypeName(config.type)}操作`, 'success');
    
    console.log('Operation defined:', operation);
  }
  
  private getOperationTypeName(type: string): string {
    switch (type) {
      case 'click': return '点击';
      case 'input': return '输入';
      case 'hover': return '悬停';
      case 'extract': return '提取';
      case 'scroll': return '滚动';
      case 'wait': return '等待';
      case 'keyboard': return '键盘';
      default: return '';
    }
  }
  
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `wao-notification wao-notification-${type}`;
    
    // 添加图标
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
    
    // 3秒后自动移除
    setTimeout(() => {
      notification.classList.add('wao-notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  private showConnectionIndicator(): void {
    const indicator = document.createElement('div');
    indicator.className = 'wao-indicator';
    indicator.textContent = `已连接到节点: ${this.currentNodeId}`;
    
    document.body.appendChild(indicator);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (indicator.parentElement) {
        indicator.remove();
      }
    }, 3000);
  }

  private createFloatingMenu(): void {
    console.log('Creating floating menu...');
    
    // 如果菜单已存在，先移除
    if (this.floatingMenu && this.floatingMenu.parentElement) {
      console.log('Removing existing floating menu');
      this.floatingMenu.remove();
      this.floatingMenu = null;
    }
    
    // 创建悬浮菜单容器
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
        <button class="wao-menu-button wao-settings-btn" style="background: #2196F3">设置</button>
        <button class="wao-menu-button wao-help-btn" style="background: #9E9E9E">帮助</button>
      </div>
    `;
    
    // 添加到页面
    document.body.appendChild(menu);
    
    // 添加事件监听器
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
          // 展开
          (content as HTMLElement).style.display = 'flex';
          (menu as HTMLElement).style.width = '220px';
          collapseBtn.innerHTML = '&#8722;'; // 减号符号
          collapseBtn.setAttribute('title', '折叠菜单');
        } else {
          // 折叠
          (content as HTMLElement).style.display = 'none';
          (menu as HTMLElement).style.width = '180px';
          collapseBtn.innerHTML = '&#43;'; // 加号符号
          collapseBtn.setAttribute('title', '展开菜单');
        }
      });
    }
    
    // 添加拖动功能
    this.addDragFunctionality(menu);
    
    // 保存引用
    this.floatingMenu = menu;
    
    console.log('Floating menu created successfully');
  }
  
  private addDragFunctionality(menu: HTMLElement): void {
    const handle = menu.querySelector('.wao-menu-handle');
    if (!handle) return;
    
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      isDragging = true;
      
      const rect = menu.getBoundingClientRect();
      dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDragging) return;
      
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
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
      // 更新状态
      const status = this.floatingMenu.querySelector('.wao-status');
      if (status) {
        status.textContent = this.isActive ? '✅ 捕获模式已激活' : '⏸️ 捕获模式未激活';
        (status as HTMLElement).style.color = this.isActive ? '#4CAF50' : '#666';
      }
      
      // 更新按钮
      const captureBtn = this.floatingMenu.querySelector('.wao-capture-btn');
      if (captureBtn) {
        captureBtn.textContent = this.isActive ? '停止捕获' : '开始捕获';
        (captureBtn as HTMLElement).style.background = this.isActive ? '#f44336' : '#4CAF50';
      }
    } else {
      console.log('Floating menu not found or not visible, creating new one');
      this.createFloatingMenu();
    }
  }
  
  private showHelpOverlay(): void {
    // 创建帮助覆盖层
    const overlay = document.createElement('div');
    overlay.className = 'wao-help-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '2147483646';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    // 创建帮助内容
    const content = document.createElement('div');
    content.className = 'wao-help-content';
    content.style.background = 'white';
    content.style.borderRadius = '8px';
    content.style.padding = '20px';
    content.style.maxWidth = '500px';
    content.style.maxHeight = '80vh';
    content.style.overflow = 'auto';
    content.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    
    content.innerHTML = `
      <h2 style="margin-top: 0; color: #4CAF50; border-bottom: 1px solid #eee; padding-bottom: 10px;">网页自动化助手使用指南</h2>
      
      <h3>基本功能</h3>
      <ul>
        <li><strong>元素选择</strong>：点击"开始捕获"按钮，然后将鼠标悬停在页面元素上，点击"选择此元素"按钮进行捕获。</li>
        <li><strong>操作定义</strong>：选择元素后，可以定义点击、输入、提取等操作。</li>
        <li><strong>自动化流程</strong>：通过插件面板组合多个操作，创建完整的自动化流程。</li>
      </ul>
      
      <h3>快捷键</h3>
      <ul>
        <li><strong>ESC</strong>：取消当前操作或退出捕获模式</li>
      </ul>
      
      <h3>提示</h3>
      <ul>
        <li>选择元素时，尽量选择具有唯一标识符的元素，如ID或特定属性。</li>
        <li>对于动态加载的内容，可以使用"等待"操作确保元素已加载。</li>
        <li>使用"提取"操作可以获取页面中的数据。</li>
      </ul>
      
      <div style="text-align: center; margin-top: 20px;">
        <button class="wao-help-close" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">关闭</button>
      </div>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // 添加关闭按钮事件
    const closeButton = overlay.querySelector('.wao-help-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        overlay.remove();
      });
    }
    
    // 点击覆盖层外部关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
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
      
      .wao-confirm-button:active {
        background: #3d8b40 !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
        transform: translateY(0px) !important;
      }
      
      .wao-highlight-test {
        outline: 2px solid #2196F3 !important;
        outline-offset: 2px !important;
        background-color: rgba(33, 150, 243, 0.1) !important;
        animation: wao-pulse-blue 1.5s infinite ease-in-out !important;
      }
      
      @keyframes wao-pulse-blue {
        0% { outline-color: #2196F3 !important; outline-offset: 2px !important; }
        50% { outline-color: #03A9F4 !important; outline-offset: 4px !important; }
        100% { outline-color: #2196F3 !important; outline-offset: 2px !important; }
      }
      .wao-operation-menu {
        position: fixed;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        min-width: 180px;
        z-index: 2147483647;
        animation: wao-menu-appear 0.2s ease-out;
      }
      
      @keyframes wao-menu-appear {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      .wao-menu-header {
        padding: 12px 16px;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        border-radius: 7px 7px 0 0;
        font-weight: 600;
        font-size: 13px;
        text-align: center;
      }
      
      .wao-menu-options {
        padding: 8px 0;
      }
      
      .wao-menu-options button {
        display: block;
        width: 100%;
        padding: 10px 16px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-size: 14px;
        color: #333;
        position: relative;
      }
      
      .wao-menu-options button:hover {
        background-color: #f5f5f5;
      }
      
      .wao-menu-options button:active {
        background-color: #e8f5e8;
      }
      
      .wao-menu-options button::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4CAF50;
        margin-right: 10px;
        vertical-align: middle;
      }
      
      .wao-menu-footer {
        padding: 8px 12px;
        border-top: 1px solid #eee;
        text-align: right;
        background: #fafafa;
        border-radius: 0 0 7px 7px;
      }
      
      .wao-cancel {
        padding: 6px 12px;
        border: 1px solid #ddd;
        background: white;
        cursor: pointer;
        border-radius: 4px;
        font-size: 12px;
        color: #666;
        transition: all 0.2s ease;
      }
      
      .wao-cancel:hover {
        background: #f0f0f0;
        border-color: #ccc;
      }
      
      .wao-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 500;
        z-index: 2147483647;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        animation: wao-indicator-slide 0.3s ease-out;
        max-width: 300px;
      }
      
      @keyframes wao-indicator-slide {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .wao-indicator::before {
        content: '🔗';
        margin-right: 8px;
      }
      
      /* Operation Menu Styles */
      .wao-operation-form {
        padding: 12px 16px;
      }
      
      .wao-form-group {
        margin-bottom: 12px;
      }
      
      .wao-form-label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        font-size: 13px;
        color: #333;
      }
      
      .wao-form-input,
      .wao-form-select,
      .wao-form-textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 13px;
        background: white;
      }
      
      .wao-form-textarea {
        resize: vertical;
        min-height: 60px;
      }
      
      .wao-form-checkbox {
        margin-right: 5px;
      }
      
      .wao-checkbox-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      
      .wao-checkbox-group label {
        display: flex;
        align-items: center;
        font-size: 13px;
      }
      
      .wao-form-info {
        margin-top: 12px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 12px;
        color: #666;
      }
      
      .wao-form-info p {
        margin: 5px 0;
      }
      
      .wao-hidden {
        display: none !important;
      }
      
      .wao-menu-content {
        max-height: 400px;
        overflow-y: auto;
      }
      
      .wao-operation-button {
        display: flex !important;
        align-items: center !important;
      }
      
      .wao-operation-icon {
        margin-right: 8px;
        font-size: 16px;
      }
      
      .wao-next,
      .wao-finish {
        padding: 6px 12px !important;
        border: 1px solid #4CAF50 !important;
        background: #4CAF50 !important;
        color: white !important;
        cursor: pointer !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        transition: all 0.2s ease !important;
      }
      
      .wao-next:hover,
      .wao-finish:hover {
        background: #45a049 !important;
      }
      
      .wao-back {
        padding: 6px 12px !important;
        border: 1px solid #ddd !important;
        background: white !important;
        cursor: pointer !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        color: #666 !important;
        margin-right: 8px !important;
        transition: all 0.2s ease !important;
      }
      
      .wao-back:hover {
        background: #f0f0f0 !important;
      }
      
      /* Notification Styles */
      .wao-notification {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        color: white !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        z-index: 2147483647 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        animation: wao-notification-slide 0.3s ease-out !important;
        max-width: 300px !important;
        transition: all 0.3s ease !important;
      }
      
      .wao-notification-success {
        background: linear-gradient(135deg, #4CAF50, #45a049) !important;
      }
      
      .wao-notification-error {
        background: linear-gradient(135deg, #F44336, #E53935) !important;
      }
      
      .wao-notification-info {
        background: linear-gradient(135deg, #2196F3, #1E88E5) !important;
      }
      
      .wao-notification-hide {
        opacity: 0 !important;
        transform: translateY(20px) !important;
      }
      
      @keyframes wao-notification-slide {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* 悬浮面板样式 */
      .wao-floating-panel {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        width: 220px !important;
        background: white !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        color: #333 !important;
        transition: all 0.3s ease !important;
        animation: wao-panel-appear 0.3s ease-out !important;
        overflow: hidden !important;
      }
      
      .wao-panel-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 10px 12px !important;
        background: linear-gradient(135deg, #4CAF50, #45a049) !important;
        color: white !important;
        font-weight: bold !important;
        cursor: grab !important;
        user-select: none !important;
      }
      
      .wao-panel-toggle {
        background: none !important;
        border: none !important;
        color: white !important;
        font-size: 16px !important;
        cursor: pointer !important;
        padding: 0 !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 50% !important;
        transition: background 0.2s !important;
      }
      
      .wao-panel-toggle:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }
      
      .wao-panel-content {
        padding: 12px !important;
        transition: all 0.3s ease !important;
      }
      
      .wao-panel-status {
        display: flex !important;
        align-items: center !important;
        margin-bottom: 10px !important;
        font-size: 12px !important;
      }
      
      .wao-status-indicator {
        width: 10px !important;
        height: 10px !important;
        border-radius: 50% !important;
        margin-right: 8px !important;
      }
      
      .wao-status-idle {
        background: #9e9e9e !important;
      }
      
      .wao-status-capturing {
        background: #4CAF50 !important;
        box-shadow: 0 0 0 rgba(76, 175, 80, 0.4) !important;
        animation: wao-pulse 2s infinite !important;
      }
      
      .wao-status-connected {
        background: #2196F3 !important;
      }
      
      .wao-panel-buttons {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        margin-bottom: 10px !important;
      }
      
      .wao-btn {
        padding: 8px 12px !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        text-align: center !important;
      }
      
      .wao-btn-primary {
        background: #4CAF50 !important;
        color: white !important;
      }
      
      .wao-btn-secondary {
        background: #2196F3 !important;
        color: white !important;
      }
      
      .wao-btn-danger {
        background: #f44336 !important;
        color: white !important;
      }
      
      .wao-btn:hover {
        filter: brightness(1.1) !important;
        transform: translateY(-1px) !important;
      }
      
      .wao-btn:active {
        filter: brightness(0.9) !important;
        transform: translateY(1px) !important;
      }
      
      .wao-panel-info {
        font-size: 12px !important;
        color: #666 !important;
        padding-top: 8px !important;
        border-top: 1px solid #eee !important;
      }
      
      .wao-hidden {
        display: none !important;
      }
      
      .wao-minimized {
        width: auto !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      }
      
      @keyframes wao-panel-appear {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* 悬浮面板样式 */
      .wao-floating-panel {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        width: 220px !important;
        background: white !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        color: #333 !important;
        transition: all 0.3s ease !important;
        animation: wao-panel-appear 0.3s ease-out !important;
        overflow: hidden !important;
      }
      
      .wao-panel-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 10px 12px !important;
        background: linear-gradient(135deg, #4CAF50, #45a049) !important;
        color: white !important;
        cursor: grab !important;
        user-select: none !important;
      }
      
      .wao-panel-title {
        font-weight: bold !important;
        font-size: 14px !important;
      }
      
      .wao-panel-toggle {
        background: none !important;
        border: none !important;
        color: white !important;
        cursor: pointer !important;
        font-size: 16px !important;
        padding: 0 !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 50% !important;
        transition: background 0.2s !important;
      }
      
      .wao-panel-toggle:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }
      
      .wao-panel-content {
        padding: 12px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
      }
      
      .wao-panel-status {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        font-size: 12px !important;
      }
      
      .wao-status-indicator {
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        background: #ccc !important;
      }
      
      .wao-status-idle {
        background: #ccc !important;
      }
      
      .wao-status-capturing {
        background: #4CAF50 !important;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3) !important;
        animation: wao-pulse 1.5s infinite !important;
      }
      
      .wao-status-connected {
        background: #2196F3 !important;
      }
      
      .wao-panel-buttons {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }
      
      .wao-btn {
        padding: 8px 12px !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        text-align: center !important;
      }
      
      .wao-btn-primary {
        background: #4CAF50 !important;
        color: white !important;
      }
      
      .wao-btn-secondary {
        background: #2196F3 !important;
        color: white !important;
      }
      
      .wao-btn-danger {
        background: #f44336 !important;
        color: white !important;
      }
      
      .wao-btn:hover {
        filter: brightness(1.1) !important;
        transform: translateY(-1px) !important;
      }
      
      .wao-btn:active {
        filter: brightness(0.9) !important;
        transform: translateY(1px) !important;
      }
      
      .wao-panel-info {
        font-size: 12px !important;
        color: #666 !important;
        padding-top: 8px !important;
        border-top: 1px solid #eee !important;
      }
      
      .wao-hidden {
        display: none !important;
      }
      
      .wao-minimized {
        width: auto !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      }
      
      @keyframes wao-panel-appear {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes wao-pulse {
        0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.5); }
        70% { box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
        100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
      }
      
      /* 悬浮控制面板样式 */
      .wao-floating-panel {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        width: 280px !important;
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        color: #333 !important;
        border: 1px solid #e0e0e0 !important;
        animation: wao-panel-slide-in 0.3s ease-out !important;
        transition: all 0.3s ease !important;
      }
      
      .wao-floating-panel.wao-minimized {
        width: 160px !important;
      }
      
      @keyframes wao-panel-slide-in {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .wao-panel-header {
        background: linear-gradient(135deg, #4CAF50, #45a049) !important;
        color: white !important;
        padding: 12px 16px !important;
        border-radius: 11px 11px 0 0 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        cursor: grab !important;
        user-select: none !important;
      }
      
      .wao-panel-header:active {
        cursor: grabbing !important;
      }
      
      .wao-panel-title {
        font-weight: 600 !important;
        font-size: 15px !important;
      }
      
      .wao-panel-toggle {
        background: rgba(255, 255, 255, 0.2) !important;
        border: none !important;
        color: white !important;
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 16px !important;
        font-weight: bold !important;
        transition: background 0.2s ease !important;
      }
      
      .wao-panel-toggle:hover {
        background: rgba(255, 255, 255, 0.3) !important;
      }
      
      .wao-panel-content {
        padding: 16px !important;
        transition: all 0.3s ease !important;
      }
      
      .wao-panel-content.wao-hidden {
        display: none !important;
      }
      
      .wao-panel-status {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        margin-bottom: 12px !important;
        padding: 8px 12px !important;
        background: #f8f9fa !important;
        border-radius: 6px !important;
      }
      
      .wao-status-indicator {
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        background: #ccc !important;
        transition: background 0.3s ease !important;
      }
      
      .wao-status-indicator.wao-status-idle {
        background: #6c757d !important;
      }
      
      .wao-status-indicator.wao-status-capturing {
        background: #28a745 !important;
        animation: wao-pulse 2s infinite !important;
      }
      
      .wao-status-indicator.wao-status-connected {
        background: #007bff !important;
      }
      
      @keyframes wao-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .wao-status-text {
        font-size: 13px !important;
        color: #666 !important;
        font-weight: 500 !important;
      }
      
      .wao-panel-buttons {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        margin-bottom: 12px !important;
      }
      
      .wao-btn {
        padding: 8px 12px !important;
        border: none !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        text-align: center !important;
      }
      
      .wao-btn-primary {
        background: #4CAF50 !important;
        color: white !important;
      }
      
      .wao-btn-primary:hover {
        background: #45a049 !important;
        transform: translateY(-1px) !important;
      }
      
      .wao-btn-secondary {
        background: #6c757d !important;
        color: white !important;
      }
      
      .wao-btn-secondary:hover {
        background: #5a6268 !important;
        transform: translateY(-1px) !important;
      }
      
      .wao-btn-danger {
        background: #dc3545 !important;
        color: white !important;
      }
      
      .wao-btn-danger:hover {
        background: #c82333 !important;
        transform: translateY(-1px) !important;
      }
      
      .wao-btn:active {
        transform: translateY(1px) !important;
      }
      
      .wao-panel-info {
        border-top: 1px solid #e9ecef !important;
        padding-top: 12px !important;
      }
      
      .wao-captured-count {
        font-size: 12px !important;
        color: #666 !important;
        text-align: center !important;
      }
      
      .wao-captured-count span {
        font-weight: bold !important;
        color: #4CAF50 !important;
      }
      
      .wao-hidden {
        display: none !important;
      }
      
      /* 悬浮控制面板样式 */
      .wao-floating-panel {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        width: 280px !important;
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        color: #333 !important;
        border: 1px solid #e0e0e0 !important;
        animation: wao-panel-slide-in 0.3s ease-out !important;
        transition: all 0.3s ease !important;
      }
      
      .wao-floating-panel.wao-minimized {
        width: 160px !important;
      }
      
      @keyframes wao-panel-slide-in {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .wao-panel-header {
        background: linear-gradient(135deg, #4CAF50, #45a049) !important;
        color: white !important;
        padding: 12px 16px !important;
        border-radius: 11px 11px 0 0 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        cursor: grab !important;
        user-select: none !important;
      }
      
      .wao-panel-header:active {
        cursor: grabbing !important;
      }
      
      .wao-panel-title {
        font-weight: 600 !important;
        font-size: 15px !important;
      }
      
      .wao-panel-toggle {
        background: rgba(255, 255, 255, 0.2) !important;
        border: none !important;
        color: white !important;
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 16px !important;
        font-weight: bold !important;
        transition: background 0.2s ease !important;
      }
      
      .wao-panel-toggle:hover {
        background: rgba(255, 255, 255, 0.3) !important;
      }
      
      .wao-panel-content {
        padding: 16px !important;
        transition: all 0.3s ease !important;
      }
      
      .wao-panel-content.wao-hidden {
        display: none !important;
      }
      
      .wao-panel-status {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        margin-bottom: 12px !important;
        padding: 8px 12px !important;
        background: #f8f9fa !important;
        border-radius: 6px !important;
      }
      
      .wao-status-indicator {
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        background: #ccc !important;
        transition: background 0.3s ease !important;
      }
      
      .wao-status-indicator.wao-status-idle {
        background: #6c757d !important;
      }
      
      .wao-status-indicator.wao-status-capturing {
        background: #28a745 !important;
        animation: wao-pulse 2s infinite !important;
      }
      
      .wao-status-indicator.wao-status-connected {
        background: #007bff !important;
      }
      
      @keyframes wao-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .wao-status-text {
        font-size: 13px !important;
        color: #666 !important;
        font-weight: 500 !important;
      }
      
      .wao-panel-buttons {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        margin-bottom: 12px !important;
      }
      
      .wao-btn {
        padding: 8px 12px !important;
        border: none !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        text-align: center !important;
      }
      
      .wao-btn-primary {
        background: #4CAF50 !important;
        color: white !important;
      }
      
      .wao-btn-primary:hover {
        background: #45a049 !important;
        transform: translateY(-1px) !important;
      }
      
      .wao-btn-secondary {
        background: #6c757d !important;
        color: white !important;
      }
      
      .wao-btn-secondary:hover {
        background: #5a6268 !important;
        transform: translateY(-1px) !important;
      }
      
      .wao-btn-danger {
        background: #dc3545 !important;
        color: white !important;
      }
      
      .wao-btn-danger:hover {
        background: #c82333 !important;
        transform: translateY(-1px) !important;
      }
      
      .wao-btn:active {
        transform: translateY(1px) !important;
      }
      
      .wao-panel-info {
        border-top: 1px solid #e9ecef !important;
        padding-top: 12px !important;
      }
      
      .wao-captured-count {
        font-size: 12px !important;
        color: #666 !important;
        text-align: center !important;
      }
      
      .wao-captured-count span {
        font-weight: bold !important;
        color: #4CAF50 !important;
      }
      
      .wao-hidden {
        display: none !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  private notifyPageReady(): void {
    try {
      // 检查扩展上下文是否有效
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

  private sendToBackground(message: any): void {
    try {
      // 检查扩展上下文是否有效
      if (!chrome.runtime || !chrome.runtime.id) {
        console.log('Extension context is invalid, cannot send message');
        return;
      }
      
      if (this.port) {
        try {
          this.port.postMessage(message);
        } catch (error) {
          console.error('Failed to send message through port:', error);
          
          // 如果通过端口发送失败，尝试通过消息发送
          try {
            chrome.runtime.sendMessage(message);
          } catch (msgError) {
            console.error('Failed to send message through runtime:', msgError);
          }
        }
      } else {
        try {
          chrome.runtime.sendMessage(message);
        } catch (error) {
          console.error('Failed to send message through runtime:', error);
        }
      }
    } catch (error) {
      console.error('Error in sendToBackground:', error);
    }
  }

  private createFloatingPanel(): void {
    // 这个方法已不再使用
    /*
    // 如果面板已存在，先移除
    if (this.floatingPanel) {
      this.floatingPanel.remove();
    }
    
    // 创建悬浮面板
    const panel = document.createElement('div');
    panel.className = 'wao-floating-panel';
    panel.innerHTML = `
      <div class="wao-panel-header">
        <span class="wao-panel-title">Web自动化</span>
        <button class="wao-panel-toggle" title="最小化/展开">−</button>
      </div>
      <div class="wao-panel-content">
        <div class="wao-panel-status">
          <span class="wao-status-indicator"></span>
          <span class="wao-status-text">未连接</span>
        </div>
        <div class="wao-panel-buttons">
          <button class="wao-btn wao-btn-primary" id="wao-start-capture">开始捕获</button>
          <button class="wao-btn wao-btn-secondary" id="wao-test-selector">测试选择器</button>
          <button class="wao-btn wao-btn-danger" id="wao-stop-capture">停止捕获</button>
        </div>
        <div class="wao-panel-info">
          <div class="wao-captured-count">已捕获: <span id="wao-count">0</span> 个元素</div>
        </div>
      </div>
    `;
    
    // 添加事件监听器
    this.setupPanelEventListeners(panel);
    
    // 添加到页面
    document.body.appendChild(panel);
    this.floatingPanel = panel;
    
    // 初始状态为最小化
    this.togglePanel(false);
  }
  
  private setupPanelEventListeners(panel: HTMLElement): void {
    // 这个方法已不再使用
  }
  
  private togglePanel(expand: boolean): void {
    // 这个方法已不再使用
  }
  
  private updatePanelStatus(status: 'idle' | 'capturing' | 'connected', text: string): void {
    // 这个方法已不再使用
  }
  
  private makePanelDraggable(panel: HTMLElement): void {
    // 这个方法已不再使用
  }

  // 已移至类定义开头
  
    // 断开连接
    
    console.log('Content script disconnected');
  }
}

// 确保全局变量可以被检测到
(window as any).waoContentScriptInjected = true;

// 检查是否已经初始化
if (!(window as any).waoContentScriptInitialized) {
  try {
    // 标记为已初始化
    (window as any).waoContentScriptInitialized = true;
    
    // 初始化函数
    const initContentScript = () => {
      try {
        // 创建内容脚本实例
        new ContentScript();
        console.log('Content script initialized successfully');
      } catch (error) {
        console.error('Failed to initialize content script:', error);
      }
    };
    
    // 根据文档状态决定何时初始化
    if (document.readyState === 'loading') {
      // 文档仍在加载中，等待DOMContentLoaded事件
      document.addEventListener('DOMContentLoaded', initContentScript);
    } else {
      // 文档已加载完成，立即初始化
      initContentScript();
    }
  } catch (error) {
    console.error('Error in content script initialization:', error);
  }
} else {
  console.log('Content script already initialized');
}

export { ContentScript };