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
  }

  public show(node: BaseNode): void {
    console.log(`Showing sidebar for node: ${node.title} (${node.type})`);
    this.currentNode = node;
    this.sidebarElement.classList.add('open');
    this.renderNodeProperties(node);
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

    // 1. 默认属性区 (只读)
    this.createDefaultPropertiesCard(node);
    if (this.defaultPropertiesCard) {
      container.appendChild(this.defaultPropertiesCard.getElement());
    }

    // 2. 端口区
    this.createPortsCard(node);
    if (this.portsCard) {
      container.appendChild(this.portsCard.getElement());
    }

    // 3. 变量配置区
    this.createVariablesCard(node);
    if (this.variablesCard) {
      container.appendChild(this.variablesCard.getElement());
    }

    // 4. 节点特定配置区
    this.createNodeSpecificCard(node);
    if (this.nodeSpecificCard) {
      container.appendChild(this.nodeSpecificCard.getElement());
    }

    this.contentElement.appendChild(container);
  }

  private createDefaultPropertiesCard(node: BaseNode): void {
    this.defaultPropertiesCard = new Card({
      id: 'default-properties-card',
      title: '📋 默认属性 (只读)',
      className: 'sidebar-section-card'
    });

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '8px';

    // 节点编号
    const nodeNumber = (node as any).nodeNumber || 'N/A';
    this.addReadOnlyProperty(content, '编号', nodeNumber.toString());
    
    // 节点ID (部分显示)
    this.addReadOnlyProperty(content, 'ID', node.id.substring(0, 8) + '...');
    
    // 节点类型
    this.addReadOnlyProperty(content, '类型', node.type);
    
    // 创建时间 (模拟)
    this.addReadOnlyProperty(content, '创建时间', new Date().toLocaleString());

    this.defaultPropertiesCard.setContent(content);
  }

  private createPortsCard(node: BaseNode): void {
    this.portsCard = new Card({
      id: 'ports-card',
      title: '🔌 端口信息',
      className: 'sidebar-section-card'
    });

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '12px';

    // 输入端口
    if (node.inputs.length > 0) {
      const inputSection = document.createElement('div');
      inputSection.innerHTML = `
        <div style="font-weight: bold; color: #4CAF50; margin-bottom: 8px; font-size: 12px;">
          📥 输入端口 (${node.inputs.length})
        </div>
      `;
      
      const inputList = document.createElement('div');
      inputList.style.display = 'flex';
      inputList.style.flexDirection = 'column';
      inputList.style.gap = '4px';
      
      node.inputs.forEach((port, index) => {
        const portItem = document.createElement('div');
        portItem.style.padding = '8px 12px';
        portItem.style.background = '#3a3a3a';
        portItem.style.borderRadius = '4px';
        portItem.style.border = '1px solid #4CAF50';
        portItem.style.fontSize = '11px';
        portItem.innerHTML = `
          <strong>${port.id}</strong><br>
          <span style="color: #888;">端口 ${port.portNumber || index + 1}</span>
        `;
        inputList.appendChild(portItem);
      });
      
      inputSection.appendChild(inputList);
      content.appendChild(inputSection);
    }

    // 输出端口
    if (node.outputs.length > 0) {
      const outputSection = document.createElement('div');
      outputSection.innerHTML = `
        <div style="font-weight: bold; color: #2196F3; margin-bottom: 8px; font-size: 12px;">
          📤 输出端口 (${node.outputs.length})
        </div>
      `;
      
      const outputList = document.createElement('div');
      outputList.style.display = 'flex';
      outputList.style.flexDirection = 'column';
      outputList.style.gap = '4px';
      
      node.outputs.forEach((port, index) => {
        const portItem = document.createElement('div');
        portItem.style.padding = '8px 12px';
        portItem.style.background = '#3a3a3a';
        portItem.style.borderRadius = '4px';
        portItem.style.border = '1px solid #2196F3';
        portItem.style.fontSize = '11px';
        portItem.innerHTML = `
          <strong>${port.id}</strong><br>
          <span style="color: #888;">端口 ${port.portNumber || index + 1}</span>
        `;
        outputList.appendChild(portItem);
      });
      
      outputSection.appendChild(outputList);
      content.appendChild(outputSection);
    }

    if (node.inputs.length === 0 && node.outputs.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; color: #888; font-style: italic; padding: 20px;">
          此节点没有端口
        </div>
      `;
    }

    this.portsCard.setContent(content);
  }

  private createVariablesCard(node: BaseNode): void {
    this.variablesCard = new Card({
      id: 'variables-card',
      title: '⚙️ 节点配置',
      className: 'sidebar-section-card'
    });

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '12px';

    // 基础可编辑属性
    this.addEditableProperties(content, node);

    this.variablesCard.setContent(content);
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

  private addEditableProperties(container: HTMLElement, node: BaseNode): void {
    // 显示名称
    this.addEditableProperty(container, '显示名称', node.title, (value) => {
      node.title = value;
      this.onNodeUpdate(node);
      this.updateCardTitle();
    });

    // 节点名称（用于变量访问）
    this.addEditableProperty(container, '节点名称', node.nodeName, (value) => {
      const cleanName = value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      node.nodeName = cleanName;
      this.onNodeUpdate(node);
    });

    // 描述
    this.addEditableProperty(container, '描述', node.description, (value) => {
      node.description = value;
      this.onNodeUpdate(node);
    }, 'textarea');

    // 变量访问提示
    const hintDiv = document.createElement('div');
    hintDiv.style.padding = '8px 12px';
    hintDiv.style.background = '#2a4d3a';
    hintDiv.style.borderRadius = '4px';
    hintDiv.style.border = '1px solid #4CAF50';
    hintDiv.style.fontSize = '11px';
    hintDiv.style.color = '#4CAF50';
    hintDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">💡 变量访问</div>
      <div>在其他节点中使用: <code style="background: #1a1a1a; padding: 2px 4px; border-radius: 2px;">${node.nodeName}.变量名</code></div>
    `;
    container.appendChild(hintDiv);
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
}