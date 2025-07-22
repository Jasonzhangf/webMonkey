/**
 * Node Property Renderers - 节点属性渲染器
 * 职责：为不同类型节点渲染属性编辑界面
 */
import { BaseNode } from '../../nodes/BaseNode';
import { Card } from '../Card';

export class NodePropertyRenderers {
  private rootCard: Card;
  private onNodeUpdate: (node: BaseNode) => void;

  constructor(rootCard: Card, onNodeUpdate: (node: BaseNode) => void) {
    this.rootCard = rootCard;
    this.onNodeUpdate = onNodeUpdate;
  }

  public renderActionProperties(node: BaseNode): void {
    const operationUnit = node.properties.operationUnit || {};
    const observation = operationUnit.observation || {};
    const action = operationUnit.action || {};

    // Action Type
    this.createPropertyCard('action-type-card', 'Action Type', 'select', action.type || 'click', (value) => {
      if (!node.properties.operationUnit) node.properties.operationUnit = {};
      if (!node.properties.operationUnit.action) node.properties.operationUnit.action = {};
      node.properties.operationUnit.action.type = value;
      this.onNodeUpdate(node);
    }, false, ['click', 'type', 'hover', 'scroll', 'wait']);

    // CSS Selector
    const targetValue = observation.target?.primary?.value || '';
    this.createPropertyCard('css-selector-card', 'CSS Selector', 'input', targetValue, (value) => {
      if (!node.properties.operationUnit) node.properties.operationUnit = {};
      if (!node.properties.operationUnit.observation) node.properties.operationUnit.observation = {};
      if (!node.properties.operationUnit.observation.target) node.properties.operationUnit.observation.target = {};
      if (!node.properties.operationUnit.observation.target.primary) node.properties.operationUnit.observation.target.primary = {};
      node.properties.operationUnit.observation.target.primary.type = 'css';
      node.properties.operationUnit.observation.target.primary.value = value;
      this.onNodeUpdate(node);
    });

    // Text Content (for type action)
    if (action.type === 'type') {
      const textContent = action.parameters?.text || '';
      this.createPropertyCard('text-content-card', 'Text to Type', 'textarea', textContent, (value) => {
        if (!node.properties.operationUnit.action.parameters) node.properties.operationUnit.action.parameters = {};
        node.properties.operationUnit.action.parameters.text = value;
        this.onNodeUpdate(node);
      });
    }

    // Timeout
    this.createPropertyCard('timeout-card', 'Timeout (ms)', 'input', observation.timeout_ms?.toString() || '5000', (value) => {
      if (!node.properties.operationUnit.observation) node.properties.operationUnit.observation = {};
      node.properties.operationUnit.observation.timeout_ms = parseInt(value) || 5000;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');
  }

  public renderConditionalProperties(node: BaseNode): void {
    this.createPropertyCard('condition-card', 'Condition', 'textarea', node.properties.condition || '', (value) => {
      node.properties.condition = value;
      this.onNodeUpdate(node);
    });
  }

  public renderLoopProperties(node: BaseNode): void {
    this.createPropertyCard('max-iterations-card', 'Max Iterations', 'input', node.properties.maxIterations?.toString() || '10', (value) => {
      node.properties.maxIterations = parseInt(value) || 10;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');
  }

  public renderDisplayProperties(node: BaseNode): void {
    // 显示格式选项
    this.createPropertyCard('display-format-card', 'Display Format', 'select', node.properties.displayFormat || 'json', (value) => {
      node.properties.displayFormat = value;
      this.onNodeUpdate(node);
    }, false, ['json', 'table', 'tree']);

    // 最大展示深度
    this.createPropertyCard('max-depth-card', 'Max Display Depth', 'input', node.properties.maxDepth?.toString() || '3', (value) => {
      node.properties.maxDepth = parseInt(value) || 3;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');

    // 是否显示数据类型
    this.createPropertyCard('show-types-card', 'Show Data Types', 'select', node.properties.showTypes ? 'true' : 'false', (value) => {
      node.properties.showTypes = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);

    // 折叠模式
    this.createPropertyCard('collapse-mode-card', 'Initial Collapse Mode', 'select', node.properties.collapseMode || 'first-level', (value) => {
      node.properties.collapseMode = value;
      this.onNodeUpdate(node);
    }, false, ['expanded', 'first-level', 'collapsed']);
  }

  public renderContentGeneratorProperties(node: BaseNode): void {
    // 模板选择
    this.createPropertyCard('template-card', 'Content Template', 'select', node.properties.templateName || 'user-profile', (value) => {
      node.properties.templateName = value;
      this.onNodeUpdate(node);
    }, false, ['user-profile', 'product-catalog', 'task-list', 'api-response']);

    // 自定义数量
    this.createPropertyCard('custom-count-card', 'Item Count', 'input', node.properties.customCount?.toString() || '5', (value) => {
      node.properties.customCount = parseInt(value) || 5;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');

    // 数据合并模式（当有输入时）
    this.createPropertyCard('merge-mode-card', 'Input Merge Mode', 'select', node.properties.mergeMode || 'extend', (value) => {
      node.properties.mergeMode = value;
      this.onNodeUpdate(node);
    }, false, ['extend', 'wrap', 'replace']);

    // 包含时间戳
    this.createPropertyCard('include-timestamp-card', 'Include Timestamp', 'select', node.properties.includeTimestamp ? 'true' : 'false', (value) => {
      node.properties.includeTimestamp = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);
  }

  public renderJsonMergerProperties(node: BaseNode): void {
    // 合并策略
    this.createPropertyCard('merge-strategy-card', 'Merge Strategy', 'select', node.properties.mergeStrategy || 'merge', (value) => {
      node.properties.mergeStrategy = value;
      this.onNodeUpdate(node);
    }, false, ['merge', 'replace', 'append', 'custom']);

    // 合并键
    this.createPropertyCard('merge-key-card', 'Merge Key', 'input', node.properties.mergeKey || 'merged', (value) => {
      node.properties.mergeKey = value;
      this.onNodeUpdate(node);
    });

    // 冲突解决策略
    this.createPropertyCard('conflict-resolution-card', 'Conflict Resolution', 'select', node.properties.conflictResolution || 'input2-wins', (value) => {
      node.properties.conflictResolution = value;
      this.onNodeUpdate(node);
    }, false, ['input1-wins', 'input2-wins', 'combine']);

    // 深度合并
    this.createPropertyCard('deep-merge-card', 'Deep Merge', 'select', node.properties.deepMerge ? 'true' : 'false', (value) => {
      node.properties.deepMerge = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);

    // 保留数组
    this.createPropertyCard('preserve-arrays-card', 'Preserve Arrays', 'select', node.properties.preserveArrays ? 'true' : 'false', (value) => {
      node.properties.preserveArrays = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);
  }

  public renderJsonFilterProperties(node: BaseNode): void {
    // 过滤模式
    this.createPropertyCard('filter-mode-card', 'Filter Mode', 'select', node.properties.filterMode || 'include', (value) => {
      node.properties.filterMode = value;
      this.onNodeUpdate(node);
    }, false, ['include', 'exclude', 'transform', 'validate']);

    // 过滤路径
    this.createPropertyCard('filter-paths-card', 'Filter Paths', 'textarea', (node.properties.filterPaths || ['user.name', 'user.email']).join('\n'), (value) => {
      node.properties.filterPaths = value.split('\n').filter(path => path.trim());
      this.onNodeUpdate(node);
    });

    // 保持结构
    this.createPropertyCard('preserve-structure-card', 'Preserve Structure', 'select', node.properties.preserveStructure ? 'true' : 'false', (value) => {
      node.properties.preserveStructure = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);

    // 允许空结果
    this.createPropertyCard('allow-empty-card', 'Allow Empty Results', 'select', node.properties.allowEmptyResults ? 'true' : 'false', (value) => {
      node.properties.allowEmptyResults = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);

    // 包含元数据
    this.createPropertyCard('include-metadata-card', 'Include Metadata', 'select', node.properties.includeMetadata !== false ? 'true' : 'false', (value) => {
      node.properties.includeMetadata = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);
  }

  private createPropertyCard(
    cardId: string,
    label: string, 
    type: 'input' | 'textarea' | 'select', 
    value: string, 
    onChange: ((value: string) => void) | null,
    readonly: boolean = false,
    options?: string[],
    inputType: string = 'text'
  ): void {
    const propertyCard = new Card({
      id: cardId,
      title: label,
      className: 'property-card'
    });

    let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    if (type === 'select' && options) {
      input = document.createElement('select');
      options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option;
        optionEl.textContent = option;
        optionEl.selected = option === value;
        input.appendChild(optionEl);
      });
    } else if (type === 'textarea') {
      input = document.createElement('textarea');
      input.value = value;
    } else {
      input = document.createElement('input');
      input.type = inputType;
      input.value = value;
    }

    // Style the input
    Object.assign(input.style, {
      width: '100%',
      padding: '8px 10px',
      background: '#3a3a3a',
      border: '1px solid #505050',
      borderRadius: '4px',
      color: '#ffffff',
      fontSize: '12px',
      boxSizing: 'border-box'
    });

    input.addEventListener('focus', () => {
      input.style.borderColor = '#FFC107';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = '#505050';
    });

    if (type === 'textarea') {
      input.style.height = '80px';
      input.style.resize = 'vertical';
    }

    if (readonly) {
      input.disabled = true;
    }

    if (onChange) {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        onChange(target.value);
      });
    }

    propertyCard.setContent(input);
    this.rootCard.addChild(propertyCard);
  }
}