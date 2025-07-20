/**
 * 统一操作界面内容脚本
 * 提供元素捕获、操作配置和执行列表管理的统一界面
 */

import { ElementData } from '../../../shared/types';
import { ElementSelector } from './ElementSelector';

interface CapturedElement {
  id: string;
  element: HTMLElement;
  elementData: ElementData;
  description: string;
  timestamp: number;
}

interface ExecutionItem {
  id: string;
  capturedElementId: string;
  operation: {
    type: 'click-mouse' | 'click-js' | 'enter' | 'input' | 'hover' | 'extract';
    params?: Record<string, any>;
  };
  waitAfter: number; // 执行后等待时间（毫秒）
  description: string;
}

class UnifiedContentScript {
  // private isActive: boolean = false; // 暂时不使用
  private isCaptureMode: boolean = false;
  
  // UI Elements
  private mainPanel: HTMLElement | null = null;
  private captureList: HTMLElement | null = null;
  private executionList: HTMLElement | null = null;
  private operationPanel: HTMLElement | null = null;
  
  // Data
  private capturedElements: CapturedElement[] = [];
  private executionItems: ExecutionItem[] = [];
  private selectedCapturedElement: CapturedElement | null = null;
  // private selectedExecutionItem: ExecutionItem | null = null; // 暂时不使用
  
  // Utilities
  private elementSelector: ElementSelector = new ElementSelector();
  private lastHoveredElement: HTMLElement | null = null;

  constructor() {
    console.log('初始化统一操作界面...');
    this.init();
  }

  private init(): void {
    this.injectStyles();
    this.createMainPanel();
    this.setupEventListeners();
    this.setupElementCapture();
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* 主面板样式 */
      .wao-main-panel {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        width: 400px !important;
        max-height: 80vh !important;
        background: white !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        z-index: 2147483647 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }
      
      /* 头部样式 */
      .wao-panel-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 12px 16px !important;
        background: #f8f9fa !important;
        border-bottom: 1px solid #dee2e6 !important;
        border-radius: 8px 8px 0 0 !important;
      }
      
      .wao-panel-title {
        font-weight: bold !important;
        color: #333 !important;
      }
      
      .wao-panel-controls {
        display: flex !important;
        gap: 8px !important;
      }
      
      .wao-control-btn {
        padding: 4px 8px !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
      }
      
      .wao-capture-btn {
        background: #28a745 !important;
        color: white !important;
      }
      
      .wao-capture-btn.active {
        background: #dc3545 !important;
      }
      
      .wao-capture-btn:hover {
        opacity: 0.9 !important;
      }
      
      .wao-minimize-btn {
        background: #6c757d !important;
        color: white !important;
      }
      
      .wao-minimize-btn:hover {
        background: #545b62 !important;
      }
      
      /* 内容区域样式 */
      .wao-panel-content {
        display: flex !important;
        flex: 1 !important;
        overflow: hidden !important;
      }
      
      .wao-left-section {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        border-right: 1px solid #dee2e6 !important;
      }
      
      .wao-right-section {
        width: 200px !important;
        display: flex !important;
        flex-direction: column !important;
        background: #f8f9fa !important;
      }
      
      /* 列表样式 */
      .wao-list-section {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
      }
      
      .wao-list-header {
        padding: 8px 12px !important;
        background: #e9ecef !important;
        border-bottom: 1px solid #dee2e6 !important;
        font-weight: 500 !important;
        font-size: 12px !important;
        color: #495057 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
      
      .wao-list-content {
        flex: 1 !important;
        overflow-y: auto !important;
        padding: 4px !important;
      }
      
      .wao-list-item {
        padding: 8px 12px !important;
        margin: 2px 0 !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        border: 1px solid transparent !important;
      }
      
      .wao-list-item:hover {
        background: #f8f9fa !important;
        border-color: #dee2e6 !important;
      }
      
      .wao-list-item.selected {
        background: #e3f2fd !important;
        border-color: #2196f3 !important;
      }
      
      .wao-item-content {
        flex: 1 !important;
        cursor: pointer !important;
      }
      
      .wao-item-title {
        font-weight: 500 !important;
        color: #333 !important;
        margin-bottom: 2px !important;
      }
      
      .wao-item-desc {
        font-size: 12px !important;
        color: #666 !important;
      }
      
      .wao-item-controls {
        display: flex !important;
        gap: 4px !important;
        align-items: center !important;
      }
      
      .wao-item-control {
        padding: 2px 6px !important;
        border: none !important;
        border-radius: 3px !important;
        cursor: pointer !important;
        font-size: 11px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        min-width: 20px !important;
        height: 20px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .wao-move-up {
        background: #17a2b8 !important;
        color: white !important;
      }
      
      .wao-move-up:hover:not(:disabled) {
        background: #138496 !important;
      }
      
      .wao-move-down {
        background: #17a2b8 !important;
        color: white !important;
      }
      
      .wao-move-down:hover:not(:disabled) {
        background: #138496 !important;
      }
      
      .wao-delete {
        background: #dc3545 !important;
        color: white !important;
      }
      
      .wao-delete:hover {
        background: #c82333 !important;
      }
      
      .wao-item-control:disabled {
        background: #e9ecef !important;
        color: #6c757d !important;
        cursor: not-allowed !important;
      }
      
      .wao-list-item {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      
      /* 操作面板样式 */
      .wao-operation-panel {
        padding: 12px !important;
        border-bottom: 1px solid #dee2e6 !important;
      }
      
      .wao-operation-title {
        font-weight: 500 !important;
        margin-bottom: 8px !important;
        color: #333 !important;
      }
      
      .wao-operation-group {
        margin-bottom: 12px !important;
      }
      
      .wao-operation-group:last-child {
        margin-bottom: 0 !important;
      }
      
      .wao-operation-group-title {
        font-size: 11px !important;
        font-weight: 600 !important;
        color: #666 !important;
        text-transform: uppercase !important;
        margin-bottom: 4px !important;
      }
      
      .wao-operation-btn {
        display: block !important;
        width: 100% !important;
        padding: 6px 8px !important;
        margin-bottom: 2px !important;
        background: white !important;
        border: 1px solid #dee2e6 !important;
        border-radius: 3px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        color: #495057 !important;
        transition: all 0.2s ease !important;
        text-align: left !important;
      }
      
      .wao-operation-btn:hover {
        background: #f8f9fa !important;
        border-color: #adb5bd !important;
      }
      
      .wao-operation-btn:last-child {
        margin-bottom: 0 !important;
      }
      
      /* 执行项操作样式 */
      .wao-execution-controls {
        display: flex !important;
        gap: 4px !important;
        margin-top: 4px !important;
      }
      
      .wao-execution-btn {
        padding: 2px 6px !important;
        border: none !important;
        border-radius: 2px !important;
        cursor: pointer !important;
        font-size: 10px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
      }
      
      .wao-move-up { background: #17a2b8 !important; color: white !important; }
      .wao-move-down { background: #17a2b8 !important; color: white !important; }
      .wao-delete { background: #dc3545 !important; color: white !important; }
      .wao-execute { background: #28a745 !important; color: white !important; }
      .wao-wait { background: #ffc107 !important; color: #212529 !important; }
      
      /* 元素高亮样式 */
      .wao-highlight {
        outline: 2px solid #2196f3 !important;
        outline-offset: 2px !important;
        background-color: rgba(33, 150, 243, 0.1) !important;
        transition: all 0.2s ease !important;
      }
      
      /* 移除wao-captured样式，允许重复捕获同一元素 */
      
      /* 最小化状态 */
      .wao-main-panel.minimized {
        width: 60px !important;
        height: 40px !important;
      }
      
      .wao-main-panel.minimized .wao-panel-content {
        display: none !important;
      }
      
      .wao-main-panel.minimized .wao-panel-header {
        border-radius: 8px !important;
        border-bottom: none !important;
      }
      
      /* 导出按钮样式 */
      .wao-export-btn {
        background: #007bff !important;
        color: white !important;
        padding: 4px 8px !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 11px !important;
        font-weight: 500 !important;
      }
      
      .wao-export-btn:hover {
        background: #0056b3 !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  private createMainPanel(): void {
    const panel = document.createElement('div');
    panel.className = 'wao-main-panel';
    panel.innerHTML = `
      <div class="wao-panel-header">
        <span class="wao-panel-title">自动化助手</span>
        <div class="wao-panel-controls">
          <button class="wao-control-btn wao-capture-btn">开始捕获</button>
          <button class="wao-control-btn wao-minimize-btn">最小化</button>
        </div>
      </div>
      <div class="wao-panel-content">
        <div class="wao-left-section">
          <div class="wao-list-section">
            <div class="wao-list-header">
              <span>捕获列表</span>
              <span class="wao-capture-count">0</span>
            </div>
            <div class="wao-list-content wao-capture-list">
              <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                点击"开始捕获"后，点击页面元素进行捕获
              </div>
            </div>
          </div>
          <div class="wao-list-section" style="border-top: 1px solid #dee2e6;">
            <div class="wao-list-header">
              <span>执行列表</span>
              <div>
                <span class="wao-execution-count">0</span>
                <button class="wao-export-btn" style="margin-left: 8px;">导出</button>
              </div>
            </div>
            <div class="wao-list-content wao-execution-list">
              <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                从捕获列表添加操作到执行列表
              </div>
            </div>
          </div>
        </div>
        <div class="wao-right-section">
          <div class="wao-operation-panel">
            <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
              选择捕获的元素<br>配置操作
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.mainPanel = panel;
    
    // 获取子元素引用
    this.captureList = panel.querySelector('.wao-capture-list');
    this.executionList = panel.querySelector('.wao-execution-list');
    this.operationPanel = panel.querySelector('.wao-operation-panel');
    
    this.setupPanelEventListeners();
  }

  private setupPanelEventListeners(): void {
    if (!this.mainPanel) return;
    
    // 捕获按钮
    const captureBtn = this.mainPanel.querySelector('.wao-capture-btn');
    captureBtn?.addEventListener('click', () => {
      this.toggleCaptureMode();
    });
    
    // 最小化按钮
    const minimizeBtn = this.mainPanel.querySelector('.wao-minimize-btn');
    minimizeBtn?.addEventListener('click', () => {
      this.toggleMinimize();
    });
    
    // 导出按钮
    const exportBtn = this.mainPanel.querySelector('.wao-export-btn');
    exportBtn?.addEventListener('click', () => {
      this.exportExecutionList();
    });
  }

  private setupEventListeners(): void {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('click', this.handleClick.bind(this), true);
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private setupElementCapture(): void {
    // 元素捕获逻辑将在事件处理器中实现
  }

  private handleMouseOver(event: MouseEvent): void {
    if (!this.isCaptureMode) return;
    
    const target = event.target as HTMLElement;
    
    // 忽略面板元素
    if (this.isPanelElement(target)) return;
    
    // 移除之前的高亮
    if (this.lastHoveredElement) {
      this.lastHoveredElement.classList.remove('wao-highlight');
    }
    
    // 添加新的高亮
    if (this.elementSelector.isValidTarget(target)) {
      target.classList.add('wao-highlight');
      this.lastHoveredElement = target;
    }
  }

  private handleClick(event: MouseEvent): void {
    console.log('Click event triggered, isCaptureMode:', this.isCaptureMode);
    
    if (!this.isCaptureMode) {
      console.log('Not in capture mode, ignoring click');
      return;
    }
    
    const target = event.target as HTMLElement;
    console.log('Click target:', target, 'tagName:', target.tagName);
    
    // 忽略面板元素
    if (this.isPanelElement(target)) {
      console.log('Panel element clicked, ignoring');
      return;
    }
    
    // 阻止默认行为
    event.preventDefault();
    event.stopPropagation();
    
    // 捕获元素
    if (this.elementSelector.isValidTarget(target)) {
      console.log('Valid target, capturing element');
      this.captureElement(target);
    } else {
      console.log('Invalid target, not capturing');
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.isCaptureMode) {
        this.toggleCaptureMode();
      }
    }
  }

  private isPanelElement(element: HTMLElement): boolean {
    return element.closest('.wao-main-panel') !== null;
  }

  private toggleCaptureMode(): void {
    this.isCaptureMode = !this.isCaptureMode;
    console.log('Capture mode toggled to:', this.isCaptureMode);
    
    const captureBtn = this.mainPanel?.querySelector('.wao-capture-btn');
    if (captureBtn) {
      if (this.isCaptureMode) {
        captureBtn.textContent = '停止捕获';
        captureBtn.classList.add('active');
        console.log('Entered capture mode');
      } else {
        captureBtn.textContent = '开始捕获';
        captureBtn.classList.remove('active');
        console.log('Exited capture mode');
        
        // 清除高亮
        if (this.lastHoveredElement) {
          this.lastHoveredElement.classList.remove('wao-highlight');
          this.lastHoveredElement = null;
        }
      }
    }
  }

  private exitCaptureMode(): void {
    if (this.isCaptureMode) {
      this.isCaptureMode = false;
      console.log('Auto-exited capture mode');
      
      const captureBtn = this.mainPanel?.querySelector('.wao-capture-btn');
      if (captureBtn) {
        captureBtn.textContent = '开始捕获';
        captureBtn.classList.remove('active');
      }
      
      // 清除高亮
      if (this.lastHoveredElement) {
        this.lastHoveredElement.classList.remove('wao-highlight');
        this.lastHoveredElement = null;
      }
      
      this.showNotification('操作完成，已退出捕获模式', 'info');
    }
  }

  private toggleMinimize(): void {
    if (!this.mainPanel) return;
    
    const isMinimized = this.mainPanel.classList.contains('minimized');
    const minimizeBtn = this.mainPanel.querySelector('.wao-minimize-btn');
    
    if (isMinimized) {
      this.mainPanel.classList.remove('minimized');
      if (minimizeBtn) minimizeBtn.textContent = '最小化';
    } else {
      this.mainPanel.classList.add('minimized');
      if (minimizeBtn) minimizeBtn.textContent = '展开';
    }
  }

  private captureElement(element: HTMLElement): void {
    console.log('Capturing element:', element);
    
    const selectors = this.elementSelector.generateSelectors(element);
    const elementData: ElementData = {
      selectors: selectors,
      operations: [],
      metadata: {
        tagName: element.tagName.toLowerCase(),
        text: element.textContent?.trim() || '',
        position: {
          x: element.getBoundingClientRect().left,
          y: element.getBoundingClientRect().top
        }
      }
    };
    
    const capturedElement: CapturedElement = {
      id: crypto.randomUUID(),
      element: element,
      elementData: elementData,
      description: this.generateElementDescription(element),
      timestamp: Date.now()
    };
    
    console.log('Created captured element:', capturedElement);
    
    // 允许重复捕获同一个元素，每次都创建新的记录
    this.capturedElements.push(capturedElement);
    
    // 不再添加wao-captured类，避免视觉混乱
    // element.classList.add('wao-captured');
    
    console.log('Total captured elements:', this.capturedElements.length);
    
    this.updateCaptureList();
    this.showNotification(`已捕获元素: ${capturedElement.description} (第${this.capturedElements.length}次)`, 'success');
  }

  private generateElementDescription(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent?.trim().substring(0, 20) || '';
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ')[0]}` : '';
    
    return `${tagName}${id}${className} ${text ? `"${text}"` : ''}`.trim();
  }

  private updateCaptureList(): void {
    if (!this.captureList) return;
    
    const countElement = this.mainPanel?.querySelector('.wao-capture-count');
    if (countElement) {
      countElement.textContent = this.capturedElements.length.toString();
    }
    
    if (this.capturedElements.length === 0) {
      this.captureList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          点击"开始捕获"后，点击页面元素进行捕获
        </div>
      `;
      return;
    }
    
    this.captureList.innerHTML = this.capturedElements.map((element, index) => `
      <div class="wao-list-item" data-id="${element.id}">
        <div class="wao-item-content">
          <div class="wao-item-title">${element.description}</div>
          <div class="wao-item-desc">${new Date(element.timestamp).toLocaleTimeString()}</div>
        </div>
        <div class="wao-item-controls">
          <button class="wao-item-control wao-move-up" data-action="up" data-id="${element.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="wao-item-control wao-move-down" data-action="down" data-id="${element.id}" ${index === this.capturedElements.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="wao-item-control wao-delete" data-action="delete" data-id="${element.id}">删除</button>
        </div>
      </div>
    `).join('');
    
    // 添加点击事件监听器
    this.captureList.querySelectorAll('.wao-list-item').forEach(item => {
      // 点击元素内容区域选择元素
      const contentArea = item.querySelector('.wao-item-content');
      contentArea?.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).closest('.wao-list-item')?.getAttribute('data-id');
        if (id) this.selectCapturedElement(id);
      });
    });
    
    // 添加控制按钮事件监听器
    this.captureList.querySelectorAll('.wao-item-control').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止触发元素选择
        const action = (e.target as HTMLElement).getAttribute('data-action');
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (action && id) this.handleCaptureListAction(action, id);
      });
    });
  }

  private handleCaptureListAction(action: string, id: string): void {
    const index = this.capturedElements.findIndex(el => el.id === id);
    if (index === -1) return;
    
    switch (action) {
      case 'up':
        if (index > 0) {
          // 交换位置
          [this.capturedElements[index], this.capturedElements[index - 1]] = 
          [this.capturedElements[index - 1], this.capturedElements[index]];
          this.updateCaptureList();
          this.showNotification('已上移元素', 'info');
        }
        break;
      case 'down':
        if (index < this.capturedElements.length - 1) {
          // 交换位置
          [this.capturedElements[index], this.capturedElements[index + 1]] = 
          [this.capturedElements[index + 1], this.capturedElements[index]];
          this.updateCaptureList();
          this.showNotification('已下移元素', 'info');
        }
        break;
      case 'delete':
        // 删除元素
        this.capturedElements.splice(index, 1);
        this.updateCaptureList();
        this.showNotification('已删除捕获的元素', 'info');
        break;
    }
  }

  private selectCapturedElement(id: string): void {
    const element = this.capturedElements.find(el => el.id === id);
    if (!element) return;
    
    this.selectedCapturedElement = element;
    
    // 更新选中状态
    this.captureList?.querySelectorAll('.wao-list-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    const selectedItem = this.captureList?.querySelector(`[data-id="${id}"]`);
    selectedItem?.classList.add('selected');
    
    // 显示操作面板
    this.showOperationPanel(element);
  }

  private showOperationPanel(element: CapturedElement): void {
    if (!this.operationPanel) return;
    
    // 确保选中的元素被使用
    console.log('Selected element:', this.selectedCapturedElement?.id);
    
    this.operationPanel.innerHTML = `
      <div class="wao-operation-title">操作配置</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 12px;">${element.description}</div>
      
      <div class="wao-operation-group">
        <div class="wao-operation-group-title">点击操作</div>
        <button class="wao-operation-btn" data-action="click-mouse">鼠标模拟点击</button>
        <button class="wao-operation-btn" data-action="click-js">JavaScript点击</button>
      </div>
      
      <div class="wao-operation-group">
        <div class="wao-operation-group-title">键盘操作</div>
        <button class="wao-operation-btn" data-action="enter">模拟Enter键</button>
        <button class="wao-operation-btn" data-action="input">输入文本</button>
      </div>
      
      <div class="wao-operation-group">
        <div class="wao-operation-group-title">其他操作</div>
        <button class="wao-operation-btn" data-action="hover">鼠标悬停</button>
        <button class="wao-operation-btn" data-action="extract">提取文本</button>
      </div>
    `;
    
    // 添加操作按钮事件监听器
    this.operationPanel.querySelectorAll('.wao-operation-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).getAttribute('data-action');
        if (action) this.handleOperationAction(action, element);
      });
    });
  }

  private handleOperationAction(action: string, element: CapturedElement): void {
    // 显示操作选择对话框
    this.showOperationDialog(action, element);
  }

  private showOperationDialog(action: string, element: CapturedElement): void {
    const dialog = document.createElement('div');
    dialog.className = 'wao-operation-dialog';
    dialog.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: white !important;
      border-radius: 8px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      padding: 20px !important;
      z-index: 2147483648 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      min-width: 300px !important;
    `;
    
    const actionName = this.getActionName(action);
    
    dialog.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 12px; color: #333;">
        ${actionName} - ${element.description}
      </div>
      
      ${action === 'input' ? `
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">输入文本:</label>
          <input type="text" class="wao-input-text" style="width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="请输入要填写的文本">
        </div>
      ` : ''}
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">执行后等待时间 (毫秒):</label>
        <input type="number" class="wao-wait-time" value="1000" min="0" max="60000" step="100" style="width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="wao-dialog-btn wao-simulate" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">立即模拟</button>
        <button class="wao-dialog-btn wao-add-to-list" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">添加到执行列表</button>
        <button class="wao-dialog-btn wao-cancel" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 事件监听器
    const simulateBtn = dialog.querySelector('.wao-simulate');
    const addToListBtn = dialog.querySelector('.wao-add-to-list');
    const cancelBtn = dialog.querySelector('.wao-cancel');
    const inputText = dialog.querySelector('.wao-input-text') as HTMLInputElement;
    const waitTime = dialog.querySelector('.wao-wait-time') as HTMLInputElement;
    
    const closeDialog = () => dialog.remove();
    
    simulateBtn?.addEventListener('click', () => {
      const params = action === 'input' ? { text: inputText?.value || '' } : {};
      this.simulateOperation(element, action, params);
      closeDialog();
      // 立即模拟后退出捕获模式
      this.exitCaptureMode();
    });
    
    addToListBtn?.addEventListener('click', () => {
      const params = action === 'input' ? { text: inputText?.value || '' } : {};
      const waitAfter = parseInt(waitTime.value) || 1000;
      this.addToExecutionList(element, action, params, waitAfter);
      closeDialog();
      // 添加到执行列表后退出捕获模式
      this.exitCaptureMode();
    });
    
    cancelBtn?.addEventListener('click', closeDialog);
  }

  private getActionName(action: string): string {
    const names: Record<string, string> = {
      'click-mouse': '鼠标模拟点击',
      'click-js': 'JavaScript点击',
      'enter': '模拟Enter键',
      'input': '输入文本',
      'hover': '鼠标悬停',
      'extract': '提取文本'
    };
    return names[action] || action;
  }

  private simulateOperation(element: CapturedElement, action: string, params: Record<string, any>): void {
    try {
      switch (action) {
        case 'click-mouse':
          this.simulateMouseClick(element.element);
          break;
        case 'click-js':
          this.simulateJSClick(element.element);
          break;
        case 'enter':
          this.simulateEnterKey(element.element);
          break;
        case 'input':
          this.simulateInput(element.element, params.text);
          break;
        case 'hover':
          this.simulateHover(element.element);
          break;
        case 'extract':
          this.extractText(element.element);
          break;
      }
      
      this.showNotification(`已执行: ${this.getActionName(action)}`, 'success');
    } catch (error) {
      this.showNotification(`执行失败: ${error}`, 'error');
    }
  }

  private simulateMouseClick(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const events = ['mousedown', 'mouseup', 'click'];
    events.forEach((eventType, index) => {
      setTimeout(() => {
        const event = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          clientX: centerX,
          clientY: centerY,
          button: 0
        });
        element.dispatchEvent(event);
      }, index * 10);
    });
  }

  private simulateJSClick(element: HTMLElement): void {
    element.click();
  }

  private simulateEnterKey(element: HTMLElement): void {
    element.focus();
    
    const events = ['keydown', 'keypress', 'keyup'];
    events.forEach((eventType, index) => {
      setTimeout(() => {
        const event = new KeyboardEvent(eventType, {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        element.dispatchEvent(event);
      }, index * 10);
    });
  }

  private simulateInput(element: HTMLElement, text: string): void {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.focus();
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  private simulateHover(element: HTMLElement): void {
    const event = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  }

  private extractText(element: HTMLElement): void {
    const text = element.textContent?.trim() || '';
    this.showNotification(`提取的文本: "${text}"`, 'info');
    
    // 复制到剪贴板
    navigator.clipboard.writeText(text).catch(() => {
      console.log('无法复制到剪贴板');
    });
  }

  private addToExecutionList(element: CapturedElement, action: string, params: Record<string, any>, waitAfter: number): void {
    const executionItem: ExecutionItem = {
      id: crypto.randomUUID(),
      capturedElementId: element.id,
      operation: {
        type: action as any,
        params: params
      },
      waitAfter: waitAfter,
      description: `${this.getActionName(action)} - ${element.description}`
    };
    
    this.executionItems.push(executionItem);
    this.updateExecutionList();
    this.showNotification(`已添加到执行列表: ${executionItem.description}`, 'success');
  }

  private updateExecutionList(): void {
    if (!this.executionList) return;
    
    const countElement = this.mainPanel?.querySelector('.wao-execution-count');
    if (countElement) {
      countElement.textContent = this.executionItems.length.toString();
    }
    
    if (this.executionItems.length === 0) {
      this.executionList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          从捕获列表添加操作到执行列表
        </div>
      `;
      return;
    }
    
    this.executionList.innerHTML = this.executionItems.map((item, index) => `
      <div class="wao-list-item" data-id="${item.id}">
        <div class="wao-item-title">${index + 1}. ${item.description}</div>
        <div class="wao-item-desc">等待: ${item.waitAfter}ms</div>
        <div class="wao-execution-controls">
          <button class="wao-execution-btn wao-move-up" data-action="up" data-id="${item.id}">↑</button>
          <button class="wao-execution-btn wao-move-down" data-action="down" data-id="${item.id}">↓</button>
          <button class="wao-execution-btn wao-delete" data-action="delete" data-id="${item.id}">删除</button>
          <button class="wao-execution-btn wao-execute" data-action="execute" data-id="${item.id}">执行</button>
          <button class="wao-execution-btn wao-wait" data-action="wait" data-id="${item.id}">等待</button>
        </div>
      </div>
    `).join('');
    
    // 添加执行项控制事件监听器
    this.executionList.querySelectorAll('.wao-execution-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (e.target as HTMLElement).getAttribute('data-action');
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (action && id) this.handleExecutionAction(action, id);
      });
    });
  }

  private handleExecutionAction(action: string, id: string): void {
    const index = this.executionItems.findIndex(item => item.id === id);
    if (index === -1) return;
    
    switch (action) {
      case 'up':
        if (index > 0) {
          [this.executionItems[index], this.executionItems[index - 1]] = 
          [this.executionItems[index - 1], this.executionItems[index]];
          this.updateExecutionList();
        }
        break;
      case 'down':
        if (index < this.executionItems.length - 1) {
          [this.executionItems[index], this.executionItems[index + 1]] = 
          [this.executionItems[index + 1], this.executionItems[index]];
          this.updateExecutionList();
        }
        break;
      case 'delete':
        this.executionItems.splice(index, 1);
        this.updateExecutionList();
        this.showNotification('已删除执行项', 'info');
        break;
      case 'execute':
        this.executeItem(this.executionItems[index]);
        break;
      case 'wait':
        this.editWaitTime(this.executionItems[index]);
        break;
    }
  }

  private async executeItem(item: ExecutionItem): Promise<void> {
    const capturedElement = this.capturedElements.find(el => el.id === item.capturedElementId);
    if (!capturedElement) {
      this.showNotification('找不到对应的捕获元素', 'error');
      return;
    }
    
    try {
      await this.simulateOperation(capturedElement, item.operation.type, item.operation.params || {});
      
      if (item.waitAfter > 0) {
        this.showNotification(`等待 ${item.waitAfter}ms...`, 'info');
        await new Promise(resolve => setTimeout(resolve, item.waitAfter));
      }
    } catch (error) {
      this.showNotification(`执行失败: ${error}`, 'error');
    }
  }

  private editWaitTime(item: ExecutionItem): void {
    const newTime = prompt('请输入等待时间（毫秒）:', item.waitAfter.toString());
    if (newTime !== null) {
      const time = parseInt(newTime);
      if (!isNaN(time) && time >= 0) {
        item.waitAfter = time;
        this.updateExecutionList();
        this.showNotification(`已更新等待时间: ${time}ms`, 'success');
      }
    }
  }

  private exportExecutionList(): void {
    if (this.executionItems.length === 0) {
      this.showNotification('执行列表为空，无法导出', 'error');
      return;
    }
    
    const rules = this.executionItems.map((item, index) => {
      const capturedElement = this.capturedElements.find(el => el.id === item.capturedElementId);
      return {
        序号: index + 1,
        操作描述: item.description,
        元素选择器: capturedElement?.elementData.selectors.css || '',
        操作类型: item.operation.type,
        操作参数: JSON.stringify(item.operation.params || {}),
        等待时间: `${item.waitAfter}ms`
      };
    });
    
    const csvContent = this.convertToCSV(rules);
    this.downloadCSV(csvContent, 'automation-rules.csv');
    this.showNotification('规则表已导出', 'success');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ];
    
    return csvRows.join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
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
      border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'} !important;
      animation: slideIn 0.3s ease-out !important;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// 确保单例模式
if (!(window as any).waoUnifiedContentScriptInitialized) {
  (window as any).waoUnifiedContentScriptInitialized = true;
  
  const initScript = () => {
    try {
      new UnifiedContentScript();
      console.log('统一操作界面初始化成功');
    } catch (error) {
      console.error('统一操作界面初始化失败:', error);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScript);
  } else {
    initScript();
  }
}

export { UnifiedContentScript };