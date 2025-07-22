/**
 * Display Node - JSON数据显示节点
 * 用于解析和显示JSON数据，支持嵌套展开
 */

import { BaseNode, NodePosition } from './BaseNode';

export interface DisplayData {
  jsonData: any;
  expandedPaths: Set<string>; // 存储展开的路径
}

export class DisplayNode extends BaseNode {
  private displayData: DisplayData;
  private displayContainer: HTMLElement | null = null;

  constructor(position: NodePosition) {
    super(position, 'Display');
    
    this.displayData = {
      jsonData: null,
      expandedPaths: new Set<string>()
    };

    // 添加输入端口
    this.inputs.push({ id: 'input', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true, portNumber: 1 });
    
    // 添加输出端口（bypass功能）
    this.outputs.push({ id: 'output', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false, portNumber: 1 });

    // 更新端口位置
    this.updatePortPositions();
  }

  public async execute(input: any): Promise<{ [portId: string]: any }> {
    console.log('DisplayNode executing with input:', input);
    
    // 更新显示数据
    this.displayData.jsonData = input.payload;
    
    // 根据配置初始化展开状态
    this.initializeExpandedPaths();
    
    // 刷新显示
    this.updateDisplay();
    
    // Bypass输入到输出
    return {
      'output': input
    };
  }

  private updateDisplay(): void {
    if (this.displayContainer) {
      this.renderJsonData();
    }
  }

  private initializeExpandedPaths(): void {
    this.displayData.expandedPaths.clear();
    
    const collapseMode = this.properties.collapseMode || 'first-level';
    
    if (collapseMode === 'expanded') {
      // 展开所有路径（递归到最大深度）
      this.expandAllPaths('', this.displayData.jsonData, 0);
    } else if (collapseMode === 'first-level') {
      // 只展开第一层
      this.displayData.expandedPaths.add('');
    }
    // 'collapsed' 模式不需要展开任何路径
  }

  private expandAllPaths(path: string, data: any, currentDepth: number): void {
    const maxDepth = this.properties.maxDepth || 3;
    
    if (currentDepth >= maxDepth) {
      return;
    }

    if (data && typeof data === 'object') {
      this.displayData.expandedPaths.add(path);
      
      if (Array.isArray(data)) {
        data.forEach((_, index) => {
          const itemPath = path ? `${path}[${index}]` : `[${index}]`;
          this.expandAllPaths(itemPath, data[index], currentDepth + 1);
        });
      } else {
        Object.keys(data).forEach(key => {
          const keyPath = path ? `${path}.${key}` : key;
          this.expandAllPaths(keyPath, data[key], currentDepth + 1);
        });
      }
    }
  }

  private renderJsonData(): void {
    if (!this.displayContainer || !this.displayData.jsonData) {
      return;
    }

    // 清空现有内容
    this.displayContainer.innerHTML = '';

    // 创建JSON显示
    const jsonElement = this.createJsonElement(this.displayData.jsonData, '');
    this.displayContainer.appendChild(jsonElement);
  }

  private createJsonElement(data: any, path: string): HTMLElement {
    const container = document.createElement('div');
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '11px';
    container.style.color = '#ffffff';
    container.style.margin = '2px 0';

    if (data === null || data === undefined) {
      container.textContent = String(data);
      return container;
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
      // 对象类型
      this.renderObject(container, data, path);
    } else if (Array.isArray(data)) {
      // 数组类型
      this.renderArray(container, data, path);
    } else {
      // 基础类型
      const value = JSON.stringify(data);
      const showTypes = this.properties.showTypes;
      
      if (showTypes) {
        const typeSpan = document.createElement('span');
        typeSpan.textContent = `(${typeof data}) `;
        typeSpan.style.color = '#888';
        typeSpan.style.fontSize = '9px';
        container.appendChild(typeSpan);
      }
      
      const valueSpan = document.createElement('span');
      valueSpan.textContent = value;
      
      if (typeof data === 'string') {
        valueSpan.style.color = '#4CAF50'; // 绿色表示字符串
      } else if (typeof data === 'number') {
        valueSpan.style.color = '#FF9800'; // 橙色表示数字
      } else if (typeof data === 'boolean') {
        valueSpan.style.color = '#2196F3'; // 蓝色表示布尔值
      }
      
      container.appendChild(valueSpan);
    }

    return container;
  }

  private renderObject(container: HTMLElement, obj: any, path: string): void {
    const keys = Object.keys(obj);
    const isExpanded = this.displayData.expandedPaths.has(path);

    if (keys.length === 0) {
      container.textContent = '{}';
      return;
    }

    // 创建展开/折叠按钮
    const toggleButton = document.createElement('span');
    toggleButton.textContent = isExpanded ? '▼ {' : '► {';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.color = '#FFC107';
    toggleButton.style.userSelect = 'none';
    
    toggleButton.addEventListener('click', () => {
      if (this.displayData.expandedPaths.has(path)) {
        this.displayData.expandedPaths.delete(path);
      } else {
        this.displayData.expandedPaths.add(path);
      }
      this.renderJsonData();
    });

    container.appendChild(toggleButton);

    if (isExpanded) {
      // 展开显示所有键值对
      keys.forEach((key, index) => {
        const keyPath = path ? `${path}.${key}` : key;
        const itemContainer = document.createElement('div');
        itemContainer.style.marginLeft = '15px';
        itemContainer.style.borderLeft = '1px solid #555';
        itemContainer.style.paddingLeft = '8px';

        const keySpan = document.createElement('span');
        keySpan.textContent = `"${key}": `;
        keySpan.style.color = '#E91E63';
        itemContainer.appendChild(keySpan);

        const valueElement = this.createJsonElement(obj[key], keyPath);
        valueElement.style.display = 'inline';
        itemContainer.appendChild(valueElement);

        if (index < keys.length - 1) {
          const comma = document.createElement('span');
          comma.textContent = ',';
          comma.style.color = '#ffffff';
          itemContainer.appendChild(comma);
        }

        container.appendChild(itemContainer);
      });

      const closeBrace = document.createElement('div');
      closeBrace.textContent = '}';
      closeBrace.style.color = '#FFC107';
      container.appendChild(closeBrace);
    } else {
      // 折叠显示
      const summary = document.createElement('span');
      summary.textContent = ` ${keys.length} keys }`;
      summary.style.color = '#888';
      container.appendChild(summary);
    }
  }

  private renderArray(container: HTMLElement, arr: any[], path: string): void {
    const isExpanded = this.displayData.expandedPaths.has(path);

    if (arr.length === 0) {
      container.textContent = '[]';
      return;
    }

    // 创建展开/折叠按钮
    const toggleButton = document.createElement('span');
    toggleButton.textContent = isExpanded ? '▼ [' : '► [';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.color = '#FFC107';
    toggleButton.style.userSelect = 'none';
    
    toggleButton.addEventListener('click', () => {
      if (this.displayData.expandedPaths.has(path)) {
        this.displayData.expandedPaths.delete(path);
      } else {
        this.displayData.expandedPaths.add(path);
      }
      this.renderJsonData();
    });

    container.appendChild(toggleButton);

    if (isExpanded) {
      // 展开显示所有数组项
      arr.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        const itemContainer = document.createElement('div');
        itemContainer.style.marginLeft = '15px';
        itemContainer.style.borderLeft = '1px solid #555';
        itemContainer.style.paddingLeft = '8px';

        const indexSpan = document.createElement('span');
        indexSpan.textContent = `[${index}]: `;
        indexSpan.style.color = '#E91E63';
        itemContainer.appendChild(indexSpan);

        const valueElement = this.createJsonElement(item, itemPath);
        valueElement.style.display = 'inline';
        itemContainer.appendChild(valueElement);

        if (index < arr.length - 1) {
          const comma = document.createElement('span');
          comma.textContent = ',';
          comma.style.color = '#ffffff';
          itemContainer.appendChild(comma);
        }

        container.appendChild(itemContainer);
      });

      const closeBracket = document.createElement('div');
      closeBracket.textContent = ']';
      closeBracket.style.color = '#FFC107';
      container.appendChild(closeBracket);
    } else {
      // 折叠显示
      const summary = document.createElement('span');
      summary.textContent = ` ${arr.length} items ]`;
      summary.style.color = '#888';
      container.appendChild(summary);
    }
  }

  public renderCustomContent(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    // 创建或更新显示容器
    if (!this.displayContainer) {
      this.displayContainer = document.createElement('div');
      this.displayContainer.style.position = 'absolute';
      this.displayContainer.style.background = 'rgba(45, 45, 45, 0.95)';
      this.displayContainer.style.border = '1px solid #666';
      this.displayContainer.style.borderRadius = '4px';
      this.displayContainer.style.padding = '8px';
      this.displayContainer.style.maxHeight = '200px';
      this.displayContainer.style.overflowY = 'auto';
      this.displayContainer.style.minWidth = '200px';
      this.displayContainer.style.maxWidth = '400px';
      this.displayContainer.style.zIndex = '1000';
      this.displayContainer.style.pointerEvents = 'all';
      
      // 添加到页面
      document.body.appendChild(this.displayContainer);
      
      // 渲染初始数据
      this.renderJsonData();
    }

    // 更新位置
    const canvasRect = ctx.canvas.getBoundingClientRect();
    this.displayContainer.style.left = `${canvasRect.left + x}px`;
    this.displayContainer.style.top = `${canvasRect.top + y + height + 5}px`;

    // 在节点上绘制简单的指示器
    ctx.save();
    ctx.fillStyle = '#9C27B0';
    ctx.fillRect(x + width - 20, y + 5, 15, 15);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('JSON', x + width - 12.5, y + 14);
    ctx.restore();
  }

  public cleanup(): void {
    if (this.displayContainer && this.displayContainer.parentNode) {
      this.displayContainer.parentNode.removeChild(this.displayContainer);
      this.displayContainer = null;
    }
    // 清理完成
  }

  // 重写isInside方法，包含display容器的交互区域
  public isInside(x: number, y: number): boolean {
    // 首先检查节点主体
    if (super.isInside(x, y)) {
      return true;
    }

    // 如果有显示容器，也检查其区域（用于避免意外关闭）
    if (this.displayContainer) {
      const rect = this.displayContainer.getBoundingClientRect();
      const canvasRect = this.displayContainer.offsetParent?.getBoundingClientRect();
      
      if (canvasRect) {
        const relativeX = x - (rect.left - canvasRect.left);
        const relativeY = y - (rect.top - canvasRect.top);
        
        return relativeX >= 0 && relativeX <= rect.width && 
               relativeY >= 0 && relativeY <= rect.height;
      }
    }

    return false;
  }
}