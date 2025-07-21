/**
 * Floating Menu - 悬浮菜单
 * Provides a persistent floating menu for controlling the plugin
 */

export interface FloatingMenuOptions {
  isActive: boolean;
  onToggleCapture: () => void;
  onOpenSettings: () => void;
  onHelp: () => void;
}

export class FloatingMenu {
  private menuElement: HTMLElement | null = null;
  private options: FloatingMenuOptions;
  private isDragging: boolean = false;
  private dragOffset: { x: number, y: number } = { x: 0, y: 0 };
  private isCollapsed: boolean = false;

  constructor(options: FloatingMenuOptions) {
    console.log('FloatingMenu constructor called', options);
    this.options = options;
    this.render();
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
    
    // 添加控制按钮组
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '5px';
    handle.appendChild(controls);
    
    // 添加折叠/展开按钮
    const collapseBtn = document.createElement('button');
    collapseBtn.innerHTML = '&#8722;'; // 减号符号
    collapseBtn.className = 'wao-menu-control-button';
    collapseBtn.title = '折叠菜单';
    collapseBtn.style.width = '20px';
    collapseBtn.style.height = '20px';
    collapseBtn.style.padding = '0';
    collapseBtn.style.background = '#f0f0f0';
    collapseBtn.style.border = 'none';
    collapseBtn.style.borderRadius = '4px';
    collapseBtn.style.cursor = 'pointer';
    collapseBtn.style.display = 'flex';
    collapseBtn.style.justifyContent = 'center';
    collapseBtn.style.alignItems = 'center';
    collapseBtn.style.fontSize = '14px';
    collapseBtn.style.lineHeight = '1';
    collapseBtn.onclick = (e) => {
      e.stopPropagation();
      this.removeMenu();
    };
    controls.appendChild(collapseBtn);
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#10005;'; // X符号
    closeBtn.className = 'wao-menu-control-button';
    closeBtn.title = '隐藏菜单';
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
      this.removeMenu();
    };
    controls.appendChild(closeBtn);
    
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
    
    // 添加设置按钮
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = '设置';
    settingsBtn.className = 'wao-menu-button';
    settingsBtn.style.padding = '8px 12px';
    settingsBtn.style.background = '#2196F3';
    settingsBtn.style.color = 'white';
    settingsBtn.style.border = 'none';
    settingsBtn.style.borderRadius = '4px';
    settingsBtn.style.cursor = 'pointer';
    settingsBtn.style.width = '100%';
    settingsBtn.style.transition = 'background 0.2s ease';
    settingsBtn.onclick = (e) => {
      e.stopPropagation();
      this.options.onOpenSettings();
    };
    content.appendChild(settingsBtn);
    
    // 添加帮助按钮
    const helpBtn = document.createElement('button');
    helpBtn.textContent = '帮助';
    helpBtn.className = 'wao-menu-button';
    helpBtn.style.padding = '8px 12px';
    helpBtn.style.background = '#9E9E9E';
    helpBtn.style.color = 'white';
    helpBtn.style.border = 'none';
    helpBtn.style.borderRadius = '4px';
    helpBtn.style.cursor = 'pointer';
    helpBtn.style.width = '100%';
    helpBtn.style.transition = 'background 0.2s ease';
    helpBtn.onclick = (e) => {
      e.stopPropagation();
      this.options.onHelp();
    };
    content.appendChild(helpBtn);
    
    // 添加拖动功能
    handle.addEventListener('mousedown', this.handleDragStart.bind(this));
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));
    
    // 添加到页面
    document.body.appendChild(menu);
    this.menuElement = menu;
    
    // 应用折叠状态
    if (this.isCollapsed) {
      this.applyCollapsedState();
    }
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
  
  private toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.isCollapsed) {
      this.applyCollapsedState();
    } else {
      this.applyExpandedState();
    }
  }
  
  private applyCollapsedState(): void {
    if (!this.menuElement) return;
    
    const content = this.menuElement.querySelector('.wao-menu-content');
    if (content) {
      (content as HTMLElement).style.display = 'none';
    }
    
    this.menuElement.style.width = '180px';
    
    const collapseBtn = this.menuElement.querySelector('.wao-menu-control-button');
    if (collapseBtn) {
      collapseBtn.innerHTML = '&#43;'; // 加号符号
      (collapseBtn as HTMLElement).title = '展开菜单';
    }
  }
  
  private applyExpandedState(): void {
    if (!this.menuElement) return;
    
    const content = this.menuElement.querySelector('.wao-menu-content');
    if (content) {
      (content as HTMLElement).style.display = 'flex';
    }
    
    this.menuElement.style.width = '220px';
    
    const collapseBtn = this.menuElement.querySelector('.wao-menu-control-button');
    if (collapseBtn) {
      collapseBtn.innerHTML = '&#8722;'; // 减号符号
      (collapseBtn as HTMLElement).title = '折叠菜单';
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
  
  public isVisible(): boolean {
    return this.menuElement !== null;
  }
}