/**
 * 简化版内容脚本
 * 专注于基础功能：元素选择和UI显示
 */

interface ElementInfo {
  element: HTMLElement;
  selectors: {
    id?: string;
    css: string;
    attributes: string;
  };
  description: string;
  index: number;
  operations: ElementOperation[];
}

interface ElementOperation {
  type: 'hover' | 'click' | 'js-click' | 'rightclick' | 'input' | 'enter' | 'scroll-up' | 'scroll-down' | 'extract-text';
  value?: string; // 用于input操作的文本值
  result?: string; // 用于存储操作结果（如提取的文本）
  method?: string; // 用于记录操作方法（如：mouse-event, javascript）
}

class SimpleContentScript {
  private isActive: boolean = false;
  private floatingMenu: HTMLElement | null = null;
  private selectedElements: ElementInfo[] = [];
  private elementCounter: number = 0;
  private highlightedElement: HTMLElement | null = null;
  
  constructor() {
    console.log('初始化元素捕获器内容脚本...');
    
    // 强制单例模式 - 如果已存在实例，销毁它
    if ((window as any).waoSimpleContentScriptInstance) {
      console.log('发现已存在的实例，销毁旧实例');
      const oldInstance = (window as any).waoSimpleContentScriptInstance;
      if (oldInstance.floatingMenu && oldInstance.floatingMenu.parentElement) {
        oldInstance.floatingMenu.remove();
      }
    }
    
    // 清理可能存在的其他插件UI
    this.cleanupOtherPluginUIs();
    
    this.init();
    (window as any).waoSimpleContentScriptInstance = this;
  }
  
  private cleanupOtherPluginUIs(): void {
    // 清理可能存在的其他插件UI元素
    const otherPluginSelectors = [
      '.wao-floating-menu',  // 旧版浮动菜单
      '.wao-operation-menu', // 操作菜单
      '.wao-highlight-manager', // 高亮管理器
      '[class*="wao-"]:not(.wao-simple-menu):not(.wao-notification)' // 其他wao-开头的元素
    ];
    
    otherPluginSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(element => {
          console.log('清理其他插件UI:', element.className);
          element.remove();
        });
      } catch (error) {
        // 忽略选择器错误
      }
    });
  }
  


  private init(): void {
    // 1. 注入样式
    this.injectStyles();
    
    // 2. 创建浮动菜单
    this.createFloatingMenu();
    
    // 3. 设置事件监听
    this.setupEventListeners();
    
    console.log('元素捕获器初始化完成');
    
    // 标记内容脚本已准备好
    (window as any).waoSimpleContentScriptReady = true;
  }
  
  private createFloatingMenu(): void {
    // 如果菜单已存在且在DOM中，直接返回
    if (this.floatingMenu && this.floatingMenu.parentElement) {
      console.log('菜单已存在，跳过创建');
      return;
    }
    
    // 移除页面上所有其他的菜单（但保留自己的）
    document.querySelectorAll('.wao-simple-menu').forEach(menu => {
      if (menu !== this.floatingMenu) {
        console.log('移除重复菜单');
        menu.remove();
      }
    });
    
    const menu = document.createElement('div');
    menu.className = 'wao-simple-menu';
    menu.innerHTML = `
      <div class="wao-menu-header">
        <span class="wao-menu-title">🎯 元素捕获器</span>
        <div class="wao-header-controls">
          <button class="wao-collapse-btn" title="折叠/展开">−</button>
          <button class="wao-close-btn" title="关闭">×</button>
        </div>
      </div>
      <div class="wao-menu-body">
        <div class="wao-control-section">
          <div class="wao-status">
            状态: <span class="wao-status-text">${this.isActive ? '选择模式' : '待机'}</span>
          </div>
          <button class="wao-toggle-btn">${this.isActive ? '停止选择' : '开始选择'}</button>
          <div class="wao-selected-count">已捕获: ${this.selectedElements.length} 个元素</div>
          <button class="wao-clear-btn">清空所有</button>
        </div>
        
        <div class="wao-elements-section">
          <div class="wao-section-title">捕获的元素</div>
          <div class="wao-elements-list"></div>
        </div>
      </div>
    `;
    
    // 添加事件监听
    const toggleBtn = menu.querySelector('.wao-toggle-btn') as HTMLButtonElement;
    const clearBtn = menu.querySelector('.wao-clear-btn') as HTMLButtonElement;
    const closeBtn = menu.querySelector('.wao-close-btn') as HTMLButtonElement;
    const collapseBtn = menu.querySelector('.wao-collapse-btn') as HTMLButtonElement;
    
    toggleBtn.addEventListener('click', () => this.toggleSelectionMode());
    clearBtn.addEventListener('click', () => this.clearSelection());
    closeBtn.addEventListener('click', () => this.hideMenu());
    collapseBtn.addEventListener('click', () => this.toggleMenuCollapse());
    
    // 添加拖拽功能
    this.makeDraggable(menu);
    
    document.body.appendChild(menu);
    this.floatingMenu = menu;
    
    // 更新元素列表
    this.updateElementsList();
  }
  
  private toggleSelectionMode(): void {
    this.isActive = !this.isActive;
    this.updateMenuStatus();
    
    if (this.isActive) {
      console.log('进入选择模式');
      this.showNotification('进入选择模式，点击元素进行选择', 'info');
    } else {
      console.log('退出选择模式');
      this.clearHighlights();
    }
  }
  
  private setupEventListeners(): void {
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      console.log('收到消息:', message);
      
      switch (message.type) {
        case 'toggle_selection_mode':
          this.toggleSelectionMode();
          sendResponse({ success: true });
          break;
        case 'clear_selection':
          this.clearSelection();
          sendResponse({ success: true });
          break;
        case 'show_floating_menu':
          this.showFloatingMenu();
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    });
    
    // 鼠标悬停高亮
    document.addEventListener('mouseover', (e) => {
      if (!this.isActive) return;
      
      const target = e.target as HTMLElement;
      if (this.isValidTarget(target)) {
        this.highlightElement(target);
      }
    });
    
    // 鼠标离开取消高亮
    document.addEventListener('mouseout', (e) => {
      if (!this.isActive) return;
      
      const target = e.target as HTMLElement;
      if (this.isValidTarget(target)) {
        this.removeHighlight(target);
      }
    });
    
    // 点击选择元素
    document.addEventListener('click', (e) => {
      if (!this.isActive) return;
      
      const target = e.target as HTMLElement;
      if (this.isValidTarget(target)) {
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(target);
      }
    }, true);
    
    // ESC键退出
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.toggleSelectionMode();
      }
    });
  }
  
  private isValidTarget(element: HTMLElement): boolean {
    // 排除我们自己的UI元素
    if (element.closest('.wao-simple-menu') || 
        element.classList.contains('wao-notification') ||
        element.classList.contains('wao-element-item') ||
        element.classList.contains('wao-operation-btn') ||
        element.classList.contains('wao-selector-input') ||
        element.classList.contains('wao-copy-btn') ||
        element.classList.contains('wao-highlight-btn') ||
        element.classList.contains('wao-remove-btn') ||
        element.classList.contains('wao-text-input') ||
        element.classList.contains('wao-confirm-input-btn') ||
        element.closest('.wao-element-item') ||
        element.closest('.wao-notification')) {
      return false;
    }
    
    // 排除script、style等不可见元素
    const excludeTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD'];
    return !excludeTags.includes(element.tagName);
  }
  
  private highlightElement(element: HTMLElement): void {
    element.classList.add('wao-hover-highlight');
  }
  
  private removeHighlight(element: HTMLElement): void {
    element.classList.remove('wao-hover-highlight');
  }
  
  private clearHighlights(): void {
    document.querySelectorAll('.wao-hover-highlight').forEach(el => {
      el.classList.remove('wao-hover-highlight');
    });
  }
  
  private selectElement(element: HTMLElement): void {
    // 检查是否已经选择
    const existingIndex = this.selectedElements.findIndex(info => info.element === element);
    
    if (existingIndex !== -1) {
      // 取消选择
      element.classList.remove('wao-selected');
      this.selectedElements.splice(existingIndex, 1);
      this.showNotification('元素已取消选择', 'info');
    } else {
      // 添加选择
      element.classList.add('wao-selected');
      this.elementCounter++;
      
      const elementInfo: ElementInfo = {
        element: element,
        selectors: this.generateSelectors(element),
        description: this.getElementDescription(element),
        index: this.elementCounter,
        operations: []
      };
      
      this.selectedElements.push(elementInfo);
      this.showNotification(`元素已选择 (${elementInfo.description})`, 'success');
    }
    
    this.updateMenuStatus();
    this.updateElementsList();
    console.log('当前选择的元素:', this.selectedElements);
  }
  
  private generateSelectors(element: HTMLElement): { id?: string; css: string; attributes: string } {
    const selectors: { id?: string; css: string; attributes: string } = {
      css: '',
      attributes: ''
    };
    
    // ID选择器
    if (element.id) {
      selectors.id = element.id;
      selectors.css = `#${element.id}`;
    } else {
      // 生成CSS选择器（避免使用xpath）
      selectors.css = this.generateCSSSelector(element);
    }
    
    // 属性选择器
    selectors.attributes = this.generateAttributeSelector(element);
    
    return selectors;
  }
  
  private generateCSSSelector(element: HTMLElement): string {
    // 优先使用ID
    if (element.id) {
      return `#${element.id}`;
    }
    
    // 使用类名
    if (element.className) {
      const classes = element.className.trim().split(/\s+/).filter(cls => 
        cls && !cls.startsWith('wao-') // 排除我们自己的类
      );
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }
    
    // 使用标签名 + nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => 
        child.tagName === element.tagName
      );
      const index = siblings.indexOf(element) + 1;
      return `${element.tagName.toLowerCase()}:nth-child(${index})`;
    }
    
    return element.tagName.toLowerCase();
  }
  
  private generateAttributeSelector(element: HTMLElement): string {
    const attributes = [];
    
    // 常用属性
    const commonAttrs = ['name', 'type', 'value', 'placeholder', 'title', 'alt'];
    
    for (const attr of commonAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        attributes.push(`[${attr}="${value}"]`);
        break; // 只取第一个有效属性
      }
    }
    
    if (attributes.length === 0) {
      // 如果没有常用属性，使用标签名
      return element.tagName.toLowerCase();
    }
    
    return `${element.tagName.toLowerCase()}${attributes[0]}`;
  }
  
  private highlightElementByIndex(index: number): void {
    if (index < 0 || index >= this.selectedElements.length) return;
    
    // 清除之前的高亮
    if (this.highlightedElement) {
      this.highlightedElement.classList.remove('wao-temp-highlight');
    }
    
    // 高亮新元素
    const elementInfo = this.selectedElements[index];
    elementInfo.element.classList.add('wao-temp-highlight');
    this.highlightedElement = elementInfo.element;
    
    // 滚动到元素位置
    elementInfo.element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // 3秒后移除高亮
    setTimeout(() => {
      if (this.highlightedElement === elementInfo.element) {
        elementInfo.element.classList.remove('wao-temp-highlight');
        this.highlightedElement = null;
      }
    }, 3000);
    
    this.showNotification(`已高亮显示元素 #${elementInfo.index}`, 'info');
  }
  
  private removeElementByIndex(index: number): void {
    if (index < 0 || index >= this.selectedElements.length) return;
    
    const elementInfo = this.selectedElements[index];
    elementInfo.element.classList.remove('wao-selected');
    
    this.selectedElements.splice(index, 1);
    this.updateMenuStatus();
    this.updateElementsList();
    
    this.showNotification(`已移除元素 #${elementInfo.index}`, 'info');
  }
  
  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showNotification('选择器已复制到剪贴板', 'success');
    }).catch(() => {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showNotification('选择器已复制到剪贴板', 'success');
    });
  }
  
  private getElementDescription(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ')[0]}` : '';
    const text = element.textContent?.trim().substring(0, 20) || '';
    
    return `${tag}${id}${className} ${text ? `"${text}"` : ''}`.trim();
  }
  
  private clearSelection(): void {
    this.selectedElements.forEach(elementInfo => {
      elementInfo.element.classList.remove('wao-selected');
    });
    this.selectedElements = [];
    this.elementCounter = 0;
    
    // 清除临时高亮
    if (this.highlightedElement) {
      this.highlightedElement.classList.remove('wao-temp-highlight');
      this.highlightedElement = null;
    }
    
    this.updateMenuStatus();
    this.updateElementsList();
    this.showNotification('已清空所有选择', 'info');
  }
  
  private updateMenuStatus(): void {
    if (!this.floatingMenu) return;
    
    const statusText = this.floatingMenu.querySelector('.wao-status-text');
    const toggleBtn = this.floatingMenu.querySelector('.wao-toggle-btn');
    const selectedCount = this.floatingMenu.querySelector('.wao-selected-count');
    
    if (statusText) {
      statusText.textContent = this.isActive ? '选择模式' : '待机';
    }
    
    if (toggleBtn) {
      toggleBtn.textContent = this.isActive ? '停止选择' : '开始选择';
    }
    
    if (selectedCount) {
      selectedCount.textContent = `已选择: ${this.selectedElements.length} 个元素`;
    }
  }
  
  private hideMenu(): void {
    if (this.floatingMenu) {
      this.floatingMenu.style.display = 'none';
    }
  }
  
  private showFloatingMenu(): void {
    if (this.floatingMenu && this.floatingMenu.parentElement) {
      this.floatingMenu.style.display = 'flex';
    } else {
      this.createFloatingMenu();
    }
  }
  
  private toggleMenuCollapse(): void {
    if (!this.floatingMenu) return;
    
    const body = this.floatingMenu.querySelector('.wao-menu-body') as HTMLElement;
    const collapseBtn = this.floatingMenu.querySelector('.wao-collapse-btn') as HTMLButtonElement;
    
    if (body.style.display === 'none') {
      body.style.display = 'flex';
      collapseBtn.textContent = '−';
      collapseBtn.title = '折叠';
    } else {
      body.style.display = 'none';
      collapseBtn.textContent = '+';
      collapseBtn.title = '展开';
    }
  }
  
  private updateElementsList(): void {
    if (!this.floatingMenu) return;
    
    const elementsList = this.floatingMenu.querySelector('.wao-elements-list') as HTMLElement;
    if (!elementsList) return;
    
    elementsList.innerHTML = '';
    
    if (this.selectedElements.length === 0) {
      elementsList.innerHTML = '<div class="wao-empty-message">暂无捕获的元素</div>';
      return;
    }
    
    this.selectedElements.forEach((elementInfo, index) => {
      const elementItem = document.createElement('div');
      elementItem.className = 'wao-element-item';
      elementItem.innerHTML = `
        <div class="wao-element-header">
          <span class="wao-element-index">#${elementInfo.index}</span>
          <span class="wao-element-desc">${elementInfo.description}</span>
          <div class="wao-element-actions">
            <button class="wao-highlight-btn" data-index="${index}" title="高亮显示">👁</button>
            <button class="wao-remove-btn" data-index="${index}" title="移除">×</button>
          </div>
        </div>
        <div class="wao-element-selectors">
          <div class="wao-selector-group">
            <label>CSS选择器:</label>
            <input type="text" class="wao-selector-input" value="${elementInfo.selectors.css}" readonly>
            <button class="wao-copy-btn" data-selector="${elementInfo.selectors.css}" title="复制">📋</button>
          </div>
          ${elementInfo.selectors.id ? `
          <div class="wao-selector-group">
            <label>ID选择器:</label>
            <input type="text" class="wao-selector-input" value="#${elementInfo.selectors.id}" readonly>
            <button class="wao-copy-btn" data-selector="#${elementInfo.selectors.id}" title="复制">📋</button>
          </div>
          ` : ''}
          <div class="wao-selector-group">
            <label>属性选择器:</label>
            <input type="text" class="wao-selector-input" value="${elementInfo.selectors.attributes}" readonly>
            <button class="wao-copy-btn" data-selector="${elementInfo.selectors.attributes}" title="复制">📋</button>
          </div>
        </div>
        
        <div class="wao-operations-section">
          <div class="wao-operations-title">操作选择</div>
          <div class="wao-operations-grid">
            <button class="wao-operation-btn" data-index="${index}" data-operation="hover" title="模拟鼠标悬停">🖱️ 悬停</button>
            <button class="wao-operation-btn" data-index="${index}" data-operation="click" title="模拟鼠标点击">👆 点击</button>
            <button class="wao-operation-btn" data-index="${index}" data-operation="rightclick" title="模拟右键点击">🖱️ 右键</button>
            <button class="wao-operation-btn" data-index="${index}" data-operation="input" title="模拟输入文字">⌨️ 输入</button>
            <button class="wao-operation-btn" data-index="${index}" data-operation="scroll-up" title="向上滚动">⬆️ 上滚</button>
            <button class="wao-operation-btn" data-index="${index}" data-operation="scroll-down" title="向下滚动">⬇️ 下滚</button>
            <button class="wao-operation-btn" data-index="${index}" data-operation="extract-text" title="提取文字">📝 提取</button>
          </div>
          <div class="wao-input-section" id="input-section-${index}" style="display: none;">
            <div class="wao-input-row">
              <input type="text" class="wao-text-input" placeholder="请输入要模拟输入的文字" data-index="${index}">
              <button class="wao-confirm-input-btn" data-index="${index}">确认</button>
            </div>
            <div class="wao-special-chars">
              <span class="wao-special-chars-label">快捷字符:</span>
              <button class="wao-special-char-btn" data-index="${index}" data-char="\\n" title="换行符">↵</button>
              <button class="wao-special-char-btn" data-index="${index}" data-char="\\t" title="制表符">Tab</button>
              <button class="wao-special-char-btn" data-index="${index}" data-char=" " title="空格">Space</button>
              <button class="wao-special-char-btn" data-index="${index}" data-char="\\r\\n" title="回车换行">Enter</button>
            </div>
          </div>
          <div class="wao-operations-results" id="results-${index}">
            ${this.renderOperationResults(elementInfo.operations)}
          </div>
        </div>
      `;
      
      elementsList.appendChild(elementItem);
    });
    
    // 添加事件监听
    elementsList.querySelectorAll('.wao-highlight-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        this.highlightElementByIndex(index);
      });
    });
    
    elementsList.querySelectorAll('.wao-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        this.removeElementByIndex(index);
      });
    });
    
    elementsList.querySelectorAll('.wao-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selector = (e.target as HTMLElement).getAttribute('data-selector') || '';
        this.copyToClipboard(selector);
      });
    });
    
    // 添加操作按钮事件监听
    elementsList.querySelectorAll('.wao-operation-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        const operation = (e.target as HTMLElement).getAttribute('data-operation') || '';
        this.handleOperation(index, operation as ElementOperation['type']);
      });
    });
    
    // 添加输入确认按钮事件监听
    elementsList.querySelectorAll('.wao-confirm-input-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        const inputElement = document.querySelector(`#input-section-${index} .wao-text-input`) as HTMLInputElement;
        if (inputElement && inputElement.value.trim()) {
          this.executeInputOperation(index, inputElement.value.trim());
          inputElement.value = '';
          this.hideInputSection(index);
        }
      });
    });
    
    // 添加特殊字符按钮事件监听
    elementsList.querySelectorAll('.wao-special-char-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        const char = (e.target as HTMLElement).getAttribute('data-char') || '';
        this.insertSpecialChar(index, char);
      });
    });
  }
  
  private renderOperationResults(operations: ElementOperation[]): string {
    if (operations.length === 0) {
      return '<div class="wao-no-operations">暂无操作记录</div>';
    }
    
    return operations.map((op, _index) => {
      const operationNames = {
        'hover': '🖱️ 悬停',
        'click': '👆 点击',
        'js-click': '⚡ JS点击',
        'rightclick': '🖱️ 右键',
        'input': '⌨️ 输入',
        'enter': '⏎ Enter键',
        'scroll-up': '⬆️ 上滚',
        'scroll-down': '⬇️ 下滚',
        'extract-text': '📝 提取'
      };
      
      let resultText = '';
      if (op.type === 'input' && op.value) {
        resultText = `输入: "${op.value}"`;
      } else if (op.type === 'extract-text' && op.result) {
        resultText = `提取: "${op.result}"`;
      } else {
        resultText = '执行成功';
      }
      
      return `
        <div class="wao-operation-result">
          <span class="wao-operation-name">${operationNames[op.type]}</span>
          <span class="wao-operation-detail">${resultText}</span>
        </div>
      `;
    }).join('');
  }
  
  private handleOperation(index: number, operationType: ElementOperation['type']): void {
    if (index < 0 || index >= this.selectedElements.length) return;
    
    if (operationType === 'input') {
      this.showInputSection(index);
    } else {
      this.executeOperation(index, operationType);
    }
  }
  
  private showInputSection(index: number): void {
    const inputSection = document.getElementById(`input-section-${index}`);
    if (inputSection) {
      inputSection.style.display = 'flex';
      const inputElement = inputSection.querySelector('input') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }
  
  private hideInputSection(index: number): void {
    const inputSection = document.getElementById(`input-section-${index}`);
    if (inputSection) {
      inputSection.style.display = 'none';
    }
  }
  
  private insertSpecialChar(index: number, char: string): void {
    const inputElement = document.querySelector(`#input-section-${index} .wao-text-input`) as HTMLInputElement;
    if (!inputElement) {
      console.error('找不到输入框，index:', index);
      this.showNotification('找不到输入框', 'error');
      return;
    }
    
    const cursorPos = inputElement.selectionStart || inputElement.value.length;
    const currentValue = inputElement.value;
    
    // 转换特殊字符
    let actualChar = '';
    switch (char) {
      case '\\n':
        actualChar = '\n';
        break;
      case '\\t':
        actualChar = '\t';
        break;
      case '\\r\\n':
        actualChar = '\r\n';
        break;
      case ' ':
        actualChar = ' ';
        break;
      default:
        actualChar = char;
    }
    
    // 在光标位置插入字符
    const newValue = currentValue.slice(0, cursorPos) + actualChar + currentValue.slice(cursorPos);
    inputElement.value = newValue;
    
    // 触发input事件，让页面知道值已改变
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    
    // 设置新的光标位置
    const newCursorPos = cursorPos + actualChar.length;
    inputElement.setSelectionRange(newCursorPos, newCursorPos);
    inputElement.focus();
    
    // 显示插入提示
    console.log('插入特殊字符:', char, '→', actualChar, '新值:', newValue);
    this.showNotification(`已插入特殊字符: ${this.getCharDisplayName(char)}`, 'success');
  }
  
  private getCharDisplayName(char: string): string {
    const charNames: { [key: string]: string } = {
      '\\n': '换行符',
      '\\t': '制表符',
      '\\r\\n': '回车换行',
      ' ': '空格'
    };
    return charNames[char] || char;
  }
  
  private simulateKeyboardInput(element: HTMLInputElement | HTMLTextAreaElement, text: string): void {
    // 模拟逐字符输入，特别处理特殊字符
    const chars = text.split('');
    let currentPos = 0;
    
    chars.forEach((char, index) => {
      setTimeout(() => {
        if (char === '\n') {
          // 模拟Enter键
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            bubbles: true
          });
          element.dispatchEvent(enterEvent);
        } else if (char === '\t') {
          // 模拟Tab键
          const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            code: 'Tab',
            keyCode: 9,
            bubbles: true
          });
          element.dispatchEvent(tabEvent);
        }
        
        // 更新光标位置
        currentPos++;
        element.setSelectionRange(currentPos, currentPos);
      }, index * 10); // 每个字符间隔10ms
    });
  }
  
  private executeInputOperation(index: number, inputText: string): void {
    if (index < 0 || index >= this.selectedElements.length) return;
    
    const elementInfo = this.selectedElements[index];
    const element = elementInfo.element;
    
    try {
      // 聚焦元素
      element.focus();
      
      // 输入文字到元素
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        // 对于输入框和文本区域，直接设置value
        element.value = inputText;
        
        // 触发相关事件
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // 如果包含换行符，模拟按键事件
        if (inputText.includes('\n') || inputText.includes('\r\n')) {
          this.simulateKeyboardInput(element, inputText);
        }
      } else if (element.isContentEditable) {
        // 对于可编辑元素，处理HTML格式
        const htmlText = inputText.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
        element.innerHTML = htmlText;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // 对于其他元素，尝试设置textContent
        element.textContent = inputText;
      }
      
      // 记录操作
      const operation: ElementOperation = {
        type: 'input',
        value: inputText
      };
      
      elementInfo.operations.push(operation);
      this.updateOperationResults(index);
      this.showNotification(`已向元素 #${elementInfo.index} 输入文字: "${inputText}"`, 'success');
      
    } catch (error) {
      console.error('输入操作失败:', error);
      this.showNotification('输入操作失败', 'error');
    }
  }
  
  private executeOperation(index: number, operationType: ElementOperation['type']): void {
    if (index < 0 || index >= this.selectedElements.length) return;
    
    const elementInfo = this.selectedElements[index];
    const element = elementInfo.element;
    
    try {
      let operationResult = '';
      
      switch (operationType) {
        case 'hover':
          this.simulateHover(element);
          operationResult = '悬停操作已执行';
          break;
          
        case 'click':
          this.simulateClick(element);
          operationResult = '点击操作已执行';
          break;
          
        case 'rightclick':
          this.simulateRightClick(element);
          operationResult = '右键操作已执行';
          break;
          
        case 'scroll-up':
          this.simulateScroll(element, -200);
          operationResult = '向上滚动已执行';
          break;
          
        case 'scroll-down':
          this.simulateScroll(element, 200);
          operationResult = '向下滚动已执行';
          break;
          
        case 'extract-text':
          operationResult = this.extractElementText(element);
          break;
          
        default:
          throw new Error(`未知操作类型: ${operationType}`);
      }
      
      // 记录操作
      const operation: ElementOperation = {
        type: operationType,
        result: operationType === 'extract-text' ? operationResult : undefined
      };
      
      elementInfo.operations.push(operation);
      this.updateOperationResults(index);
      
      if (operationType === 'extract-text') {
        this.showNotification(`已提取文字: "${operationResult}"`, 'success');
      } else {
        this.showNotification(`${operationResult} (元素 #${elementInfo.index})`, 'success');
      }
      
    } catch (error) {
      console.error('操作执行失败:', error);
      this.showNotification(`操作执行失败: ${error}`, 'error');
    }
  }
  
  private simulateHover(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY
    });
    
    const mouseOverEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY
    });
    
    element.dispatchEvent(mouseEnterEvent);
    element.dispatchEvent(mouseOverEvent);
    
    // 添加临时悬停效果
    element.classList.add('wao-simulated-hover');
    setTimeout(() => {
      element.classList.remove('wao-simulated-hover');
    }, 2000);
  }
  
  private simulateClick(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY
    });
    
    element.dispatchEvent(clickEvent);
    
    // 添加临时点击效果
    element.classList.add('wao-simulated-click');
    setTimeout(() => {
      element.classList.remove('wao-simulated-click');
    }, 300);
  }
  
  private simulateRightClick(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY,
      button: 2
    });
    
    element.dispatchEvent(contextMenuEvent);
    
    // 添加临时右键效果
    element.classList.add('wao-simulated-rightclick');
    setTimeout(() => {
      element.classList.remove('wao-simulated-rightclick');
    }, 1000);
  }
  
  private simulateScroll(element: HTMLElement, deltaY: number): void {
    // 滚动到元素位置
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // 模拟滚轮事件
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: deltaY
    });
    
    element.dispatchEvent(wheelEvent);
    
    // 如果元素可滚动，直接滚动
    if (element.scrollHeight > element.clientHeight) {
      element.scrollTop += deltaY;
    } else {
      // 否则滚动页面
      window.scrollBy(0, deltaY);
    }
  }
  
  private extractElementText(element: HTMLElement): string {
    let text = '';
    
    // 提取不同类型元素的文本
    if (element instanceof HTMLInputElement) {
      text = element.value || element.placeholder || '';
    } else if (element instanceof HTMLTextAreaElement) {
      text = element.value || element.placeholder || '';
    } else if (element instanceof HTMLSelectElement) {
      text = element.selectedOptions.length > 0 ? 
        element.selectedOptions[0].textContent || '' : 
        element.options[0]?.textContent || '';
    } else {
      text = element.textContent?.trim() || element.innerText?.trim() || '';
    }
    
    // 限制文本长度
    if (text.length > 100) {
      text = text.substring(0, 100) + '...';
    }
    
    return text || '(无文本内容)';
  }
  
  private updateOperationResults(index: number): void {
    const resultsContainer = document.getElementById(`results-${index}`);
    if (resultsContainer && index < this.selectedElements.length) {
      resultsContainer.innerHTML = this.renderOperationResults(this.selectedElements[index].operations);
    }
  }
  
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `wao-notification wao-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  private makeDraggable(element: HTMLElement): void {
    const header = element.querySelector('.wao-menu-header') as HTMLElement;
    if (!header) return;
    
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = element.getBoundingClientRect();
      dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      element.style.left = `${Math.max(0, Math.min(x, window.innerWidth - element.offsetWidth))}px`;
      element.style.top = `${Math.max(0, Math.min(y, window.innerHeight - element.offsetHeight))}px`;
      element.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .wao-simple-menu {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        width: 320px !important;
        max-height: 80vh !important;
        background: white !important;
        border: 1px solid #ddd !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 12px !important;
        z-index: 2147483647 !important;
        user-select: none !important;
        overflow: hidden !important;
      }
      
      .wao-menu-header {
        background: #f5f5f5 !important;
        padding: 8px 12px !important;
        border-bottom: 1px solid #ddd !important;
        border-radius: 8px 8px 0 0 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        cursor: move !important;
      }
      
      .wao-menu-title {
        font-weight: bold !important;
        color: #333 !important;
        font-size: 13px !important;
      }
      
      .wao-header-controls {
        display: flex !important;
        gap: 4px !important;
      }
      
      .wao-collapse-btn, .wao-close-btn {
        background: none !important;
        border: none !important;
        font-size: 14px !important;
        cursor: pointer !important;
        color: #666 !important;
        padding: 2px 4px !important;
        width: 18px !important;
        height: 18px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 2px !important;
      }
      
      .wao-collapse-btn:hover, .wao-close-btn:hover {
        color: #333 !important;
        background: #e0e0e0 !important;
      }
      
      .wao-menu-body {
        display: flex !important;
        flex-direction: column !important;
        max-height: calc(80vh - 40px) !important;
        overflow-y: auto !important;
      }
      
      .wao-control-section {
        padding: 12px !important;
        border-bottom: 1px solid #eee !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }
      
      .wao-elements-section {
        flex: 1 !important;
        overflow-y: auto !important;
      }
      
      .wao-section-title {
        padding: 8px 12px !important;
        background: #f9f9f9 !important;
        font-weight: bold !important;
        font-size: 11px !important;
        color: #555 !important;
        border-bottom: 1px solid #eee !important;
      }
      
      .wao-elements-list {
        padding: 8px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }
      
      .wao-empty-message {
        text-align: center !important;
        color: #999 !important;
        font-size: 11px !important;
        padding: 20px !important;
      }
      
      .wao-status {
        font-size: 12px !important;
        color: #666 !important;
      }
      
      .wao-toggle-btn, .wao-clear-btn {
        padding: 6px 12px !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        transition: background 0.2s !important;
      }
      
      .wao-toggle-btn {
        background: #4CAF50 !important;
        color: white !important;
      }
      
      .wao-toggle-btn:hover {
        background: #45a049 !important;
      }
      
      .wao-clear-btn {
        background: #f44336 !important;
        color: white !important;
      }
      
      .wao-clear-btn:hover {
        background: #da190b !important;
      }
      
      .wao-selected-count {
        font-size: 12px !important;
        color: #333 !important;
        text-align: center !important;
      }
      
      .wao-hover-highlight {
        outline: 2px solid #2196F3 !important;
        outline-offset: 2px !important;
        background-color: rgba(33, 150, 243, 0.1) !important;
      }
      
      .wao-selected {
        outline: 2px solid #4CAF50 !important;
        outline-offset: 2px !important;
        background-color: rgba(76, 175, 80, 0.1) !important;
      }
      
      .wao-temp-highlight {
        outline: 3px solid #FF9800 !important;
        outline-offset: 3px !important;
        background-color: rgba(255, 152, 0, 0.2) !important;
        animation: wao-pulse-highlight 1s infinite !important;
      }
      
      @keyframes wao-pulse-highlight {
        0%, 100% { outline-color: #FF9800 !important; }
        50% { outline-color: #FFC107 !important; }
      }
      
      .wao-element-item {
        border: 1px solid #e0e0e0 !important;
        border-radius: 4px !important;
        background: #fafafa !important;
        overflow: hidden !important;
      }
      
      .wao-element-header {
        padding: 6px 8px !important;
        background: white !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        border-bottom: 1px solid #e0e0e0 !important;
      }
      
      .wao-element-index {
        background: #2196F3 !important;
        color: white !important;
        padding: 2px 6px !important;
        border-radius: 10px !important;
        font-size: 10px !important;
        font-weight: bold !important;
      }
      
      .wao-element-desc {
        flex: 1 !important;
        font-size: 11px !important;
        color: #333 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      
      .wao-element-actions {
        display: flex !important;
        gap: 2px !important;
      }
      
      .wao-highlight-btn, .wao-remove-btn {
        background: none !important;
        border: none !important;
        cursor: pointer !important;
        padding: 2px 4px !important;
        border-radius: 2px !important;
        font-size: 12px !important;
      }
      
      .wao-highlight-btn:hover {
        background: #e3f2fd !important;
      }
      
      .wao-remove-btn:hover {
        background: #ffebee !important;
      }
      
      .wao-element-selectors {
        padding: 8px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
      }
      
      .wao-selector-group {
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
      }
      
      .wao-selector-group label {
        font-size: 10px !important;
        color: #666 !important;
        min-width: 60px !important;
        font-weight: bold !important;
      }
      
      .wao-selector-input {
        flex: 1 !important;
        padding: 2px 4px !important;
        border: 1px solid #ddd !important;
        border-radius: 2px !important;
        font-size: 10px !important;
        font-family: monospace !important;
        background: white !important;
      }
      
      .wao-copy-btn {
        background: none !important;
        border: none !important;
        cursor: pointer !important;
        padding: 2px 4px !important;
        border-radius: 2px !important;
        font-size: 10px !important;
      }
      
      .wao-copy-btn:hover {
        background: #f0f0f0 !important;
      }
      
      .wao-operations-section {
        padding: 8px !important;
        border-top: 1px solid #e0e0e0 !important;
        background: #f8f9fa !important;
      }
      
      .wao-operations-title {
        font-size: 10px !important;
        font-weight: bold !important;
        color: #555 !important;
        margin-bottom: 6px !important;
      }
      
      .wao-operations-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 4px !important;
        margin-bottom: 8px !important;
      }
      
      .wao-operation-btn {
        padding: 4px 6px !important;
        border: 1px solid #ddd !important;
        border-radius: 3px !important;
        background: white !important;
        cursor: pointer !important;
        font-size: 9px !important;
        text-align: center !important;
        transition: all 0.2s !important;
      }
      
      .wao-operation-btn:hover {
        background: #e3f2fd !important;
        border-color: #2196F3 !important;
      }
      
      .wao-input-section {
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        margin-bottom: 8px !important;
        padding: 6px !important;
        background: #f8f9fa !important;
        border-radius: 4px !important;
        border: 1px solid #e0e0e0 !important;
      }
      
      .wao-input-row {
        display: flex !important;
        gap: 4px !important;
        align-items: center !important;
      }
      
      .wao-text-input {
        flex: 1 !important;
        padding: 3px 6px !important;
        border: 1px solid #ddd !important;
        border-radius: 2px !important;
        font-size: 10px !important;
      }
      
      .wao-confirm-input-btn {
        padding: 3px 8px !important;
        border: 1px solid #4CAF50 !important;
        border-radius: 2px !important;
        background: #4CAF50 !important;
        color: white !important;
        cursor: pointer !important;
        font-size: 9px !important;
      }
      
      .wao-confirm-input-btn:hover {
        background: #45a049 !important;
      }
      
      .wao-special-chars {
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        flex-wrap: wrap !important;
      }
      
      .wao-special-chars-label {
        font-size: 9px !important;
        color: #666 !important;
        font-weight: bold !important;
        margin-right: 4px !important;
      }
      
      .wao-special-char-btn {
        padding: 2px 6px !important;
        border: 1px solid #ccc !important;
        border-radius: 3px !important;
        background: white !important;
        cursor: pointer !important;
        font-size: 8px !important;
        color: #555 !important;
        transition: all 0.2s !important;
        min-width: 24px !important;
        text-align: center !important;
      }
      
      .wao-special-char-btn:hover {
        background: #e3f2fd !important;
        border-color: #2196F3 !important;
        color: #1976D2 !important;
      }
      
      .wao-special-char-btn:active {
        background: #bbdefb !important;
        transform: scale(0.95) !important;
      }
      
      .wao-operations-results {
        max-height: 80px !important;
        overflow-y: auto !important;
      }
      
      .wao-no-operations {
        text-align: center !important;
        color: #999 !important;
        font-size: 9px !important;
        padding: 8px !important;
      }
      
      .wao-operation-result {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 3px 6px !important;
        margin-bottom: 2px !important;
        background: white !important;
        border-radius: 2px !important;
        font-size: 9px !important;
      }
      
      .wao-operation-name {
        font-weight: bold !important;
        color: #333 !important;
      }
      
      .wao-operation-detail {
        color: #666 !important;
        font-size: 8px !important;
        max-width: 120px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      
      .wao-simulated-hover {
        outline: 2px solid #9C27B0 !important;
        outline-offset: 2px !important;
        background-color: rgba(156, 39, 176, 0.1) !important;
      }
      
      .wao-simulated-click {
        outline: 2px solid #FF5722 !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 87, 34, 0.2) !important;
        animation: wao-click-flash 0.3s ease !important;
      }
      
      .wao-simulated-rightclick {
        outline: 2px solid #795548 !important;
        outline-offset: 2px !important;
        background-color: rgba(121, 85, 72, 0.1) !important;
      }
      
      @keyframes wao-click-flash {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      .wao-notification {
        position: fixed !important;
        top: 80px !important;
        right: 20px !important;
        background: white !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        padding: 8px 12px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 12px !important;
        z-index: 2147483647 !important;
        max-width: 250px !important;
        animation: wao-slide-in 0.3s ease !important;
      }
      
      @keyframes wao-slide-in {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      .wao-notification-success {
        border-left: 3px solid #4CAF50 !important;
      }
      
      .wao-notification-error {
        border-left: 3px solid #f44336 !important;
      }
      
      .wao-notification-info {
        border-left: 3px solid #2196F3 !important;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// 初始化 - 使用更严格的单例模式
const initializeScript = () => {
  // 检查是否已经有实例在运行
  if ((window as any).waoSimpleContentScriptInitialized) {
    console.log('元素捕获器已初始化，跳过');
    return;
  }
  
  (window as any).waoSimpleContentScriptInitialized = true;
  
  // 延迟一点时间确保页面完全加载
  setTimeout(() => {
    new SimpleContentScript();
  }, 100);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeScript);
} else {
  initializeScript();
}

export { SimpleContentScript };