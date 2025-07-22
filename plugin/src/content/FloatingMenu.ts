/**
 * Floating Menu - 悬浮菜单
 * Provides a persistent floating menu for controlling the plugin
 */

export interface FloatingMenuOptions {
  isActive: boolean;
  onToggleCapture: () => void;
  onOpenSettings: () => void;
  onHelp: () => void;
  onSaveToFile: () => void;
  onSendToEditor: () => void;
  onSaveCookies: () => void;
  onLoadCookies: () => void;
}

export class FloatingMenu {
  private menuElement: HTMLElement | null = null;
  private options: FloatingMenuOptions;
  private isDragging: boolean = false;
  private dragOffset: { x: number, y: number } = { x: 0, y: 0 };
  private isVisible: boolean = false; // 默认不显示

  constructor(options: FloatingMenuOptions) {
    console.log('FloatingMenu constructor called', options);
    this.options = options;
    // 默认不渲染菜单，需要手动调用show()
  }

  // 显示菜单
  public show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.render();
    }
  }

  // 隐藏菜单
  public hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.removeMenu();
    }
  }

  // 切换菜单显示状态
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public update(options: Partial<FloatingMenuOptions>): void {
    this.options = { ...this.options, ...options };
    this.updateMenuState();
  }

  private render(): void {
    console.log('FloatingMenu render called');
    this.removeMenu();
    
    // 创建悬浮菜单容器
    const menu = document.createElement('div');
    menu.className = 'wao-floating-menu';
    menu.style.position = 'fixed';
    menu.style.top = '20px';
    menu.style.right = '20px';
    menu.style.zIndex = '2147483647';
    menu.style.background = 'white';
    menu.style.borderRadius = '8px';
    menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    menu.style.padding = '10px';
    menu.style.display = 'flex';
    menu.style.flexDirection = 'column';
    menu.style.gap = '8px';
    menu.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    menu.style.fontSize = '14px';
    menu.style.transition = 'all 0.3s ease';
    menu.style.userSelect = 'none';
    menu.style.width = '220px';
    
    // 添加拖动手柄
    const handle = document.createElement('div');
    handle.className = 'wao-menu-handle';
    handle.style.cursor = 'move';
    handle.style.display = 'flex';
    handle.style.justifyContent = 'space-between';
    handle.style.alignItems = 'center';
    handle.style.marginBottom = '5px';
    menu.appendChild(handle);
    
    // 添加标题
    const title = document.createElement('div');
    title.textContent = '网页自动化助手';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '14px';
    handle.appendChild(title);
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#10005;'; // X符号
    closeBtn.className = 'wao-menu-control-button';
    closeBtn.title = '关闭菜单';
    closeBtn.style.width = '20px';
    closeBtn.style.height = '20px';
    closeBtn.style.padding = '0';
    closeBtn.style.background = '#f0f0f0';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.display = 'flex';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.fontSize = '14px';
    closeBtn.style.lineHeight = '1';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.hide(); // 使用新的hide方法
    };
    handle.appendChild(closeBtn);
    
    // 添加内容容器
    const content = document.createElement('div');
    content.className = 'wao-menu-content';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '8px';
    menu.appendChild(content);
    
    // 添加状态指示器
    const status = document.createElement('div');
    status.className = 'wao-status';
    status.textContent = this.options.isActive ? '✅ 捕获模式已激活' : '⏸️ 捕获模式未激活';
    status.style.fontSize = '12px';
    status.style.color = this.options.isActive ? '#4CAF50' : '#666';
    status.style.marginBottom = '5px';
    content.appendChild(status);
    
    // 添加按钮
    const captureBtn = document.createElement('button');
    captureBtn.textContent = this.options.isActive ? '停止捕获' : '开始捕获';
    captureBtn.className = 'wao-menu-button';
    captureBtn.style.padding = '8px 12px';
    captureBtn.style.background = this.options.isActive ? '#f44336' : '#4CAF50';
    captureBtn.style.color = 'white';
    captureBtn.style.border = 'none';
    captureBtn.style.borderRadius = '4px';
    captureBtn.style.cursor = 'pointer';
    captureBtn.style.width = '100%';
    captureBtn.style.transition = 'background 0.2s ease';
    captureBtn.style.fontWeight = 'bold';
    captureBtn.onclick = (e) => {
      e.stopPropagation();
      this.options.onToggleCapture();
    };
    content.appendChild(captureBtn);
    
    // 添加保存到本地按钮
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存到本地';
    saveBtn.className = 'wao-menu-button';
    saveBtn.style.background = '#FF9800';
    saveBtn.onclick = (e) => {
      e.stopPropagation();
      this.options.onSaveToFile();
    };
    content.appendChild(saveBtn);

    // 添加发送到编辑器按钮
    const sendBtn = document.createElement('button');
    sendBtn.textContent = '发送到编辑器';
    sendBtn.className = 'wao-menu-button';
    sendBtn.style.background = '#00BCD4';
    this.addButtonStyles(sendBtn);
    sendBtn.onclick = (e) => {
      e.stopPropagation();
      this.options.onSendToEditor();
    };
    content.appendChild(sendBtn);

    // 添加Cookie管理按钮区域
    const cookieSection = document.createElement('div');
    cookieSection.style.borderTop = '1px solid #eee';
    cookieSection.style.paddingTop = '8px';
    cookieSection.style.marginTop = '8px';
    content.appendChild(cookieSection);

    // 添加Cookie标题
    const cookieTitle = document.createElement('div');
    cookieTitle.textContent = '🍪 Cookie 管理';
    cookieTitle.style.fontSize = '12px';
    cookieTitle.style.fontWeight = 'bold';
    cookieTitle.style.color = '#666';
    cookieTitle.style.marginBottom = '8px';
    cookieTitle.style.textAlign = 'center';
    cookieSection.appendChild(cookieTitle);

    // 添加Cookie按钮容器
    const cookieButtons = document.createElement('div');
    cookieButtons.style.display = 'grid';
    cookieButtons.style.gridTemplateColumns = '1fr 1fr';
    cookieButtons.style.gap = '8px';
    cookieSection.appendChild(cookieButtons);

    // 保存Cookie按钮
    const saveCookieBtn = document.createElement('button');
    saveCookieBtn.textContent = '保存';
    saveCookieBtn.className = 'wao-menu-button';
    saveCookieBtn.style.background = '#4CAF50';
    saveCookieBtn.style.fontSize = '12px';
    this.addButtonStyles(saveCookieBtn);
    saveCookieBtn.onclick = (e) => {
      e.stopPropagation();
      this.options.onSaveCookies();
    };
    cookieButtons.appendChild(saveCookieBtn);

    // 加载Cookie按钮
    const loadCookieBtn = document.createElement('button');
    loadCookieBtn.textContent = '加载';
    loadCookieBtn.className = 'wao-menu-button';
    loadCookieBtn.style.background = '#FF9800';
    loadCookieBtn.style.fontSize = '12px';
    this.addButtonStyles(loadCookieBtn);
    loadCookieBtn.onclick = (e) => {
      e.stopPropagation();
      this.options.onLoadCookies();
    };
    cookieButtons.appendChild(loadCookieBtn);

    // 添加设置按钮
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = '设置';
    settingsBtn.className = 'wao-menu-button';
    settingsBtn.style.background = '#2196F3';
    this.addButtonStyles(settingsBtn);
    
    // 添加拖动功能
    handle.addEventListener('mousedown', this.handleDragStart.bind(this));
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));
    
    // 添加到页面
    document.body.appendChild(menu);
    this.menuElement = menu;
  }

  private addButtonStyles(button: HTMLElement): void {
    button.style.padding = '8px 12px';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.width = '100%';
    button.style.transition = 'background 0.2s ease';
    button.style.fontWeight = 'bold';
  }
  
  private updateMenuState(): void {
    if (!this.menuElement) return;
    
    const status = this.menuElement.querySelector('.wao-status');
    if (status) {
      status.textContent = this.options.isActive ? '✅ 捕获模式已激活' : '⏸️ 捕获模式未激活';
      (status as HTMLElement).style.color = this.options.isActive ? '#4CAF50' : '#666';
    }
    
    const captureBtn = this.menuElement.querySelector('.wao-menu-button');
    if (captureBtn) {
      captureBtn.textContent = this.options.isActive ? '停止捕获' : '开始捕获';
      (captureBtn as HTMLElement).style.background = this.options.isActive ? '#f44336' : '#4CAF50';
    }
  }
  
  
  private handleDragStart(e: MouseEvent): void {
    if (!this.menuElement) return;
    
    this.isDragging = true;
    
    const rect = this.menuElement.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // 防止文本选择
    e.preventDefault();
  }
  
  private handleDragMove(e: MouseEvent): void {
    if (!this.isDragging || !this.menuElement) return;
    
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    // 确保菜单不会超出视口
    const menuWidth = this.menuElement.offsetWidth;
    const menuHeight = this.menuElement.offsetHeight;
    const maxX = window.innerWidth - menuWidth;
    const maxY = window.innerHeight - menuHeight;
    
    this.menuElement.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    this.menuElement.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
    this.menuElement.style.right = 'auto';
  }
  
  private handleDragEnd(): void {
    this.isDragging = false;
  }
  
  public removeMenu(): void {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    
    document.removeEventListener('mousemove', this.handleDragMove.bind(this));
    document.removeEventListener('mouseup', this.handleDragEnd.bind(this));
  }
  
  public getVisibility(): boolean {
    return this.isVisible;
  }
}