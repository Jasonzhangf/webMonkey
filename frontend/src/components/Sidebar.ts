/**
 * Sidebar - Node properties editor (卡片化重构版)
 * 职责：节点属性编辑的主协调器，完全卡片化布局
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */
import { BaseNode } from '../nodes/BaseNode';
import { Card } from './Card';
import { NodePropertyRenderers } from './renderers/NodePropertyRenderers';

export class Sidebar {
  private sidebarElement: HTMLElement;
  private contentElement: HTMLElement;
  private currentNode: BaseNode | null = null;
  private onNodeUpdate: (node: BaseNode) => void;
  
  // 卡片区域
  private defaultPropertiesCard: Card | null = null;
  private portsCard: Card | null = null;
  private variablesCard: Card | null = null;
  private nodeSpecificCard: Card | null = null;
  
  private propertyRenderers: NodePropertyRenderers;

  constructor(onNodeUpdate: (node: BaseNode) => void) {
    this.sidebarElement = document.getElementById('sidebar')!;
    this.contentElement = document.getElementById('sidebar-content')!;
    this.onNodeUpdate = onNodeUpdate;
    
    // Initialize property renderers placeholder
    this.propertyRenderers = new NodePropertyRenderers(null as any, this.onNodeUpdate);
    
    // Set initial empty state
    this.showEmptyState();
    
    // 添加响应式支持
    this.initializeResponsiveLayout();
  }

  public show(node: BaseNode): void {
    console.log(`Showing sidebar for node: ${node.title} (${node.type})`);
    this.currentNode = node;
    this.sidebarElement.classList.add('open');
    this.renderNodeProperties(node);
    
    // 确保布局正确并完全可见
    setTimeout(() => {
      this.adjustSidebarLayout();
      this.ensureFullyVisible();
    }, 350); // 等待动画完成
  }

  public hide(): void {
    this.sidebarElement.classList.remove('open');
    this.currentNode = null;
    this.showEmptyState();
  }

  private showEmptyState(): void {
    this.clearContent();
    this.contentElement.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: 200px;
        color: #888; 
        font-size: 14px; 
        text-align: center;
      ">
        <div>
          <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
          <div>Select a node to edit its properties</div>
        </div>
      </div>
    `;
  }

  private clearContent(): void {
    this.contentElement.innerHTML = '';
    this.defaultPropertiesCard = null;
    this.portsCard = null;
    this.variablesCard = null;
    this.nodeSpecificCard = null;
  }

  private renderNodeProperties(node: BaseNode): void {
    this.clearContent();
    
    console.log(`Rendering properties for node: ${node.title} (${node.type})`);

    // Create main container
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.height = '100%';

    // 1. 节点配置区 (合并默认属性和基础配置)
    this.createNodeConfigCard(node);
    if (this.defaultPropertiesCard) {
      container.appendChild(this.defaultPropertiesCard.getElement());
    }

    // 2. 端口区
    this.createPortsCard(node);
    if (this.portsCard) {
      container.appendChild(this.portsCard.getElement());
    }

    // 3. 节点特定配置区
    this.createNodeSpecificCard(node);
    if (this.nodeSpecificCard) {
      container.appendChild(this.nodeSpecificCard.getElement());
    }

    this.contentElement.appendChild(container);
  }

  private createNodeConfigCard(node: BaseNode): void {
    this.defaultPropertiesCard = new Card({
      id: 'node-config-card',
      title: '📋 节点配置',
      className: 'sidebar-section-card'
    });

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '8px';

    // 节点编号 (只读)
    const nodeNumber = (node as any).nodeNumber || 'N/A';
    this.addReadOnlyProperty(content, '编号', nodeNumber.toString());
    
    // 显示名称 (可编辑)
    this.addEditableProperty(content, '显示名称', node.title, (value) => {
      node.title = value;
      this.onNodeUpdate(node);
      this.updateCardTitle();
    });
    
    // 节点名称 (可编辑)
    this.addEditableProperty(content, '节点名称', node.nodeName, (value) => {
      const cleanName = value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      node.nodeName = cleanName;
      this.onNodeUpdate(node);
    });
    
    // 节点ID (部分显示，只读)
    this.addReadOnlyProperty(content, 'ID', node.id.substring(0, 8) + '...');
    
    // 节点类型 (只读)
    this.addReadOnlyProperty(content, '类型', node.type);

    this.defaultPropertiesCard.setContent(content);
  }

  private createPortsCard(node: BaseNode): void {
    this.portsCard = new Card({
      id: 'ports-card',
      title: '🔌 端口信息',
      className: 'sidebar-section-card'
    });

    const content = document.createElement('div');
    
    // 使用网格布局显示端口信息
    if (node.inputs.length > 0 || node.outputs.length > 0) {
      content.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      `;

      // 输入端口
      if (node.inputs.length > 0) {
        const inputInfo = document.createElement('div');
        inputInfo.style.cssText = `
          padding: 8px 12px;
          background: #3a3a3a;
          border-radius: 4px;
          border: 1px solid #4CAF50;
          font-size: 12px;
          text-align: center;
        `;
        
        const inputNames = node.inputs.map(port => port.id).join(', ');
        inputInfo.innerHTML = `
          <div style="color: #4CAF50; font-weight: bold; margin-bottom: 4px;">📥 输入</div>
          <div style="color: #fff;">${inputNames}</div>
        `;
        
        content.appendChild(inputInfo);
      } else {
        // 占位空div保持网格布局
        const placeholder = document.createElement('div');
        content.appendChild(placeholder);
      }

      // 输出端口
      if (node.outputs.length > 0) {
        const outputInfo = document.createElement('div');
        outputInfo.style.cssText = `
          padding: 8px 12px;
          background: #3a3a3a;
          border-radius: 4px;
          border: 1px solid #2196F3;
          font-size: 12px;
          text-align: center;
        `;
        
        const outputNames = node.outputs.map(port => port.id).join(', ');
        outputInfo.innerHTML = `
          <div style="color: #2196F3; font-weight: bold; margin-bottom: 4px;">📤 输出</div>
          <div style="color: #fff;">${outputNames}</div>
        `;
        
        content.appendChild(outputInfo);
      } else {
        // 占位空div保持网格布局
        const placeholder = document.createElement('div');
        content.appendChild(placeholder);
      }
    } else {
      content.innerHTML = `
        <div style="text-align: center; color: #888; font-style: italic; padding: 20px;">
          此节点没有端口
        </div>
      `;
    }

    this.portsCard.setContent(content);
  }


  private createNodeSpecificCard(node: BaseNode): void {
    this.nodeSpecificCard = new Card({
      id: 'node-specific-card',
      title: `🎯 ${node.type} 专属配置`,
      className: 'sidebar-section-card'
    });

    const content = document.createElement('div');
    
    // 使用属性渲染器创建节点特定属性
    const tempCard = new Card({
      id: 'temp-card',
      title: 'temp',
      className: 'temp'
    });
    
    // 更新属性渲染器的目标卡片
    this.propertyRenderers = new NodePropertyRenderers(tempCard, this.onNodeUpdate);
    
    // 根据节点类型渲染特定属性
    switch (node.type) {
      case 'Action':
        this.propertyRenderers.renderActionProperties(node);
        break;
      case 'Conditional':
        this.propertyRenderers.renderConditionalProperties(node);
        break;
      case 'Loop':
        this.propertyRenderers.renderLoopProperties(node);
        break;
      case 'Display':
        this.propertyRenderers.renderDisplayProperties(node);
        break;
      case 'ContentGenerator':
        this.propertyRenderers.renderContentGeneratorProperties(node);
        break;
      case 'JsonMerger':
        this.propertyRenderers.renderJsonMergerProperties(node);
        break;
      case 'JsonFilter':
        this.propertyRenderers.renderJsonFilterProperties(node);
        break;
      // 浏览器工作流节点
      case 'WorkerInitialization':
        this.propertyRenderers.renderWorkerInitializationProperties(node);
        break;
      case 'PageManagement':
        this.propertyRenderers.renderPageManagementProperties(node);
        break;
      case 'ActionV2':
        this.propertyRenderers.renderActionV2Properties(node);
        break;
      default:
        content.innerHTML = `
          <div style="text-align: center; color: #888; font-style: italic; padding: 20px;">
            ${node.type} 节点没有特殊配置项
          </div>
        `;
    }

    // 如果有生成的内容，转移到我们的content中
    const tempChildren = tempCard.getChildren();
    if (tempChildren.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.style.display = 'flex';
      childrenContainer.style.flexDirection = 'column';
      childrenContainer.style.gap = '8px';
      
      tempChildren.forEach(child => {
        childrenContainer.appendChild(child.getElement());
      });
      
      content.appendChild(childrenContainer);
    }

    this.nodeSpecificCard.setContent(content);
  }

  private addReadOnlyProperty(container: HTMLElement, label: string, value: string): void {
    const propertyDiv = document.createElement('div');
    propertyDiv.style.display = 'flex';
    propertyDiv.style.justifyContent = 'space-between';
    propertyDiv.style.alignItems = 'center';
    propertyDiv.style.padding = '8px 12px';
    propertyDiv.style.background = '#3a3a3a';
    propertyDiv.style.borderRadius = '4px';
    propertyDiv.style.border = '1px solid #505050';
    propertyDiv.style.fontSize = '12px';

    propertyDiv.innerHTML = `
      <span style="color: #cccccc; font-weight: 500;">${label}</span>
      <span style="color: #ffffff; font-family: monospace;">${value}</span>
    `;

    container.appendChild(propertyDiv);
  }


  private addEditableProperty(
    container: HTMLElement, 
    label: string, 
    value: string, 
    onChange: (value: string) => void,
    type: 'input' | 'textarea' = 'input'
  ): void {
    const propertyDiv = document.createElement('div');
    propertyDiv.style.display = 'flex';
    propertyDiv.style.flexDirection = 'column';
    propertyDiv.style.gap = '4px';

    const labelDiv = document.createElement('div');
    labelDiv.style.color = '#cccccc';
    labelDiv.style.fontSize = '12px';
    labelDiv.style.fontWeight = '500';
    labelDiv.textContent = label;

    const input = type === 'textarea' 
      ? document.createElement('textarea')
      : document.createElement('input');
    
    input.value = value;
    
    Object.assign(input.style, {
      width: '100%',
      padding: '8px 12px',
      background: '#3a3a3a',
      border: '1px solid #505050',
      borderRadius: '4px',
      color: '#ffffff',
      fontSize: '12px',
      boxSizing: 'border-box'
    });

    if (type === 'textarea') {
      (input as HTMLTextAreaElement).style.height = '60px';
      (input as HTMLTextAreaElement).style.resize = 'vertical';
    }

    input.addEventListener('focus', () => {
      input.style.borderColor = '#FFC107';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = '#505050';
    });

    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      onChange(target.value);
    });

    propertyDiv.appendChild(labelDiv);
    propertyDiv.appendChild(input);
    container.appendChild(propertyDiv);
  }

  private updateCardTitle(): void {
    if (this.nodeSpecificCard && this.currentNode) {
      this.nodeSpecificCard.updateTitle(`🎯 ${this.currentNode.type} 专属配置`);
    }
  }

  /**
   * 初始化响应式布局支持
   */
  private initializeResponsiveLayout(): void {
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.adjustSidebarLayout();
    });

    // 监听sidebar打开状态变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isOpen = this.sidebarElement.classList.contains('open');
          if (isOpen) {
            this.adjustSidebarLayout();
          }
        }
      });
    });

    observer.observe(this.sidebarElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    // 初始布局调整
    this.adjustSidebarLayout();
  }

  /**
   * 调整sidebar布局以确保完全可见
   */
  private adjustSidebarLayout(): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 确保sidebar高度正确
    this.sidebarElement.style.height = `${viewportHeight}px`;
    
    // 调整内容区域的最大高度
    const titleHeight = 60; // 标题区域高度
    const padding = 30; // 内边距
    const maxContentHeight = viewportHeight - titleHeight - padding;
    
    this.contentElement.style.maxHeight = `${maxContentHeight}px`;
    
    // 在小屏幕上优化显示
    if (viewportWidth < 600) {
      this.optimizeForMobile();
    } else if (viewportWidth < 900) {
      this.optimizeForTablet();
    } else {
      this.optimizeForDesktop();
    }
  }

  /**
   * 移动端优化
   */
  private optimizeForMobile(): void {
    // 移动端sidebar从底部滑出
    this.sidebarElement.style.height = '70vh';
    this.sidebarElement.style.top = '30vh';
    
    // 调整卡片间距
    this.adjustCardSpacing('mobile');
  }

  /**
   * 平板端优化
   */
  private optimizeForTablet(): void {
    // 平板端保持侧边栏，但缩小宽度
    this.sidebarElement.style.height = '100vh';
    this.sidebarElement.style.top = '0';
    
    // 调整卡片间距
    this.adjustCardSpacing('tablet');
  }

  /**
   * 桌面端优化
   */
  private optimizeForDesktop(): void {
    // 桌面端正常显示
    this.sidebarElement.style.height = '100vh';
    this.sidebarElement.style.top = '0';
    
    // 调整卡片间距
    this.adjustCardSpacing('desktop');
  }

  /**
   * 根据设备类型调整卡片间距
   */
  private adjustCardSpacing(deviceType: 'mobile' | 'tablet' | 'desktop'): void {
    const cards = [
      this.defaultPropertiesCard,
      this.portsCard,
      this.nodeSpecificCard
    ].filter(card => card !== null);

    cards.forEach(card => {
      if (card) {
        const element = card.getElement();
        switch (deviceType) {
          case 'mobile':
            element.style.margin = '4px 0';
            element.style.padding = '8px';
            break;
          case 'tablet':
            element.style.margin = '6px 0'; 
            element.style.padding = '10px';
            break;
          case 'desktop':
            element.style.margin = '8px 0';
            element.style.padding = '12px';
            break;
        }
      }
    });
  }

  /**
   * 确保sidebar内容在视口内完全可见
   */
  public ensureFullyVisible(): void {
    if (!this.sidebarElement.classList.contains('open')) {
      return;
    }

    const sidebarRect = this.sidebarElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // 检查是否超出视口
    if (sidebarRect.bottom > viewportHeight) {
      console.warn('Sidebar content extends beyond viewport height');
      this.adjustSidebarLayout();
    }

    if (sidebarRect.right > viewportWidth) {
      console.warn('Sidebar extends beyond viewport width');
      this.adjustSidebarLayout();
    }
  }
}