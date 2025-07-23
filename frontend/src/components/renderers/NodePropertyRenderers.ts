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

    const properties = [
      {
        id: 'action-type',
        label: '操作类型',
        type: 'select' as const,
        value: action.type || 'click',
        onChange: (value: string) => {
          if (!node.properties.operationUnit) node.properties.operationUnit = {};
          if (!node.properties.operationUnit.action) node.properties.operationUnit.action = {};
          node.properties.operationUnit.action.type = value;
          this.onNodeUpdate(node);
        },
        options: ['click', 'type', 'hover', 'scroll', 'wait'],
        gridColumn: '1 / -1'
      },
      {
        id: 'css-selector',
        label: 'CSS选择器',
        type: 'input' as const,
        value: observation.target?.primary?.value || '',
        onChange: (value: string) => {
          if (!node.properties.operationUnit) node.properties.operationUnit = {};
          if (!node.properties.operationUnit.observation) node.properties.operationUnit.observation = {};
          if (!node.properties.operationUnit.observation.target) node.properties.operationUnit.observation.target = {};
          if (!node.properties.operationUnit.observation.target.primary) node.properties.operationUnit.observation.target.primary = {};
          node.properties.operationUnit.observation.target.primary.type = 'css';
          node.properties.operationUnit.observation.target.primary.value = value;
          this.onNodeUpdate(node);
        },
        gridColumn: '1 / -1'
      },
      {
        id: 'timeout',
        label: '超时时间 (ms)',
        type: 'input' as const,
        value: observation.timeout_ms?.toString() || '5000',
        onChange: (value: string) => {
          if (!node.properties.operationUnit.observation) node.properties.operationUnit.observation = {};
          node.properties.operationUnit.observation.timeout_ms = parseInt(value) || 5000;
          this.onNodeUpdate(node);
        },
        inputType: 'number'
      }
    ];

    // Text Content (for type action)
    if (action.type === 'type') {
      properties.push({
        id: 'text-content',
        label: '输入文本',
        type: 'textarea' as const,
        value: action.parameters?.text || '',
        onChange: (value: string) => {
          if (!node.properties.operationUnit.action.parameters) node.properties.operationUnit.action.parameters = {};
          node.properties.operationUnit.action.parameters.text = value;
          this.onNodeUpdate(node);
        }
      });
    }

    this.createGridPropertiesLayout(properties);
  }

  public renderConditionalProperties(node: BaseNode): void {
    this.createGridPropertiesLayout([
      {
        id: 'condition',
        label: '条件表达式',
        type: 'textarea',
        value: node.properties.condition || '',
        onChange: (value) => {
          node.properties.condition = value;
          this.onNodeUpdate(node);
        },
        gridColumn: '1 / -1'
      }
    ]);
  }

  public renderLoopProperties(node: BaseNode): void {
    this.createGridPropertiesLayout([
      {
        id: 'max-iterations',
        label: '最大迭代次数',
        type: 'input',
        value: node.properties.maxIterations?.toString() || '10',
        onChange: (value) => {
          node.properties.maxIterations = parseInt(value) || 10;
          this.onNodeUpdate(node);
        },
        inputType: 'number'
      }
    ]);
  }

  public renderDisplayProperties(node: BaseNode): void {
    this.createGridPropertiesLayout([
      {
        id: 'display-format',
        label: '显示格式',
        type: 'select',
        value: node.properties.displayFormat || 'json',
        onChange: (value) => {
          node.properties.displayFormat = value;
          this.onNodeUpdate(node);
        },
        options: ['json', 'table', 'tree']
      },
      {
        id: 'max-depth',
        label: '最大展示深度',
        type: 'input',
        value: node.properties.maxDepth?.toString() || '3',
        onChange: (value) => {
          node.properties.maxDepth = parseInt(value) || 3;
          this.onNodeUpdate(node);
        },
        inputType: 'number'
      },
      {
        id: 'show-types',
        label: '显示数据类型',
        type: 'select',
        value: node.properties.showTypes ? 'true' : 'false',
        onChange: (value) => {
          node.properties.showTypes = value === 'true';
          this.onNodeUpdate(node);
        },
        options: ['true', 'false']
      },
      {
        id: 'collapse-mode',
        label: '初始折叠模式',
        type: 'select',
        value: node.properties.collapseMode || 'first-level',
        onChange: (value) => {
          node.properties.collapseMode = value;
          this.onNodeUpdate(node);
        },
        options: ['expanded', 'first-level', 'collapsed']
      }
    ]);
  }

  public renderContentGeneratorProperties(node: BaseNode): void {
    this.createGridPropertiesLayout([
      {
        id: 'template',
        label: '模板选择',
        type: 'select',
        value: node.properties.templateName || 'user-profile',
        onChange: (value) => {
          node.properties.templateName = value;
          this.onNodeUpdate(node);
        },
        options: ['user-profile', 'product-catalog', 'task-list', 'api-response'],
        gridColumn: '1 / -1'
      },
      {
        id: 'count',
        label: '生成数量',
        type: 'input',
        value: node.properties.customCount?.toString() || '5',
        onChange: (value) => {
          node.properties.customCount = parseInt(value) || 5;
          this.onNodeUpdate(node);
        },
        inputType: 'number'
      },
      {
        id: 'timestamp',
        label: '包含时间戳',
        type: 'select',
        value: node.properties.includeTimestamp ? 'true' : 'false',
        onChange: (value) => {
          node.properties.includeTimestamp = value === 'true';
          this.onNodeUpdate(node);
        },
        options: ['true', 'false']
      }
    ]);
  }

  public renderJsonMergerProperties(node: BaseNode): void {
    this.createGridPropertiesLayout([
      {
        id: 'merge-strategy',
        label: '合并策略',
        type: 'select',
        value: node.properties.mergeStrategy || 'merge',
        onChange: (value) => {
          node.properties.mergeStrategy = value;
          this.onNodeUpdate(node);
        },
        options: ['merge', 'replace', 'append', 'custom'],
        gridColumn: '1 / -1'
      },
      {
        id: 'merge-key',
        label: '合并键',
        type: 'input',
        value: node.properties.mergeKey || 'merged',
        onChange: (value) => {
          node.properties.mergeKey = value;
          this.onNodeUpdate(node);
        }
      },
      {
        id: 'conflict-resolution',
        label: '冲突解决',
        type: 'select',
        value: node.properties.conflictResolution || 'input2-wins',
        onChange: (value) => {
          node.properties.conflictResolution = value;
          this.onNodeUpdate(node);
        },
        options: ['input1-wins', 'input2-wins', 'combine']
      },
      {
        id: 'deep-merge',
        label: '深度合并',
        type: 'select',
        value: node.properties.deepMerge ? 'true' : 'false',
        onChange: (value) => {
          node.properties.deepMerge = value === 'true';
          this.onNodeUpdate(node);
        },
        options: ['true', 'false']
      },
      {
        id: 'preserve-arrays',
        label: '保留数组',
        type: 'select',
        value: node.properties.preserveArrays ? 'true' : 'false',
        onChange: (value) => {
          node.properties.preserveArrays = value === 'true';
          this.onNodeUpdate(node);
        },
        options: ['true', 'false']
      }
    ]);
  }

  public renderJsonFilterProperties(node: BaseNode): void {
    this.createGridPropertiesLayout([
      {
        id: 'filter-mode',
        label: '过滤模式',
        type: 'select',
        value: node.properties.filterMode || 'include',
        onChange: (value) => {
          node.properties.filterMode = value;
          this.onNodeUpdate(node);
        },
        options: ['include', 'exclude', 'transform', 'validate'],
        gridColumn: '1 / -1'
      },
      {
        id: 'filter-paths',
        label: '过滤路径',
        type: 'textarea',
        value: (node.properties.filterPaths || ['user.name', 'user.email']).join('\n'),
        onChange: (value) => {
          node.properties.filterPaths = value.split('\n').filter(path => path.trim());
          this.onNodeUpdate(node);
        },
        gridColumn: '1 / -1'
      },
      {
        id: 'preserve-structure',
        label: '保持结构',
        type: 'select',
        value: node.properties.preserveStructure ? 'true' : 'false',
        onChange: (value) => {
          node.properties.preserveStructure = value === 'true';
          this.onNodeUpdate(node);
        },
        options: ['true', 'false']
      },
      {
        id: 'allow-empty',
        label: '允许空结果',
        type: 'select',
        value: node.properties.allowEmptyResults ? 'true' : 'false',
        onChange: (value) => {
          node.properties.allowEmptyResults = value === 'true';
          this.onNodeUpdate(node);
        },
        options: ['true', 'false']
      },
      {
        id: 'include-metadata',
        label: '包含元数据',
        type: 'select',
        value: node.properties.includeMetadata !== false ? 'true' : 'false',
        onChange: (value) => {
          node.properties.includeMetadata = value === 'true';
          this.onNodeUpdate(node);
        },
        options: ['true', 'false'],
        gridColumn: '1 / -1'
      }
    ]);
  }

  // 浏览器工作流节点属性渲染方法

  public renderWorkerInitializationProperties(node: BaseNode): void {
    // 无头模式
    this.createPropertyCard('headless-card', 'Headless Mode', 'select', node.properties.headless ? 'true' : 'false', (value) => {
      node.properties.headless = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);

    // 视口宽度
    this.createPropertyCard('viewport-width-card', 'Viewport Width', 'input', node.properties.viewportWidth?.toString() || '1920', (value) => {
      node.properties.viewportWidth = parseInt(value) || 1920;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');

    // 视口高度
    this.createPropertyCard('viewport-height-card', 'Viewport Height', 'input', node.properties.viewportHeight?.toString() || '1080', (value) => {
      node.properties.viewportHeight = parseInt(value) || 1080;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');

    // 用户代理
    this.createPropertyCard('user-agent-card', 'User Agent', 'textarea', node.properties.userAgent || '', (value) => {
      node.properties.userAgent = value;
      this.onNodeUpdate(node);
    });

    // 初始URL
    this.createPropertyCard('initial-url-card', 'Initial URL', 'input', node.properties.initialUrl || '', (value) => {
      node.properties.initialUrl = value;
      this.onNodeUpdate(node);
    });

    // 超时时间
    this.createPropertyCard('timeout-card', 'Timeout (ms)', 'input', node.properties.timeout?.toString() || '30000', (value) => {
      node.properties.timeout = parseInt(value) || 30000;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');

    // 等待加载状态
    this.createPropertyCard('wait-for-load-card', 'Wait For Load State', 'select', node.properties.waitForLoadState || 'load', (value) => {
      node.properties.waitForLoadState = value;
      this.onNodeUpdate(node);
    }, false, ['load', 'domcontentloaded', 'networkidle']);

    // Cookies配置 (JSON格式)
    this.createPropertyCard('cookies-json-card', 'Cookies (JSON)', 'textarea', node.properties.cookiesJson || '[]', (value) => {
      node.properties.cookiesJson = value;
      this.onNodeUpdate(node);
    });

    // localStorage配置 (JSON格式)
    this.createPropertyCard('local-storage-card', 'Local Storage (JSON)', 'textarea', node.properties.localStorageJson || '{}', (value) => {
      node.properties.localStorageJson = value;
      this.onNodeUpdate(node);
    });
  }

  public renderPageManagementProperties(node: BaseNode): void {
    // 页面操作类型
    this.createPropertyCard('action-card', 'Page Action', 'select', node.properties.action || 'create', (value) => {
      node.properties.action = value;
      this.onNodeUpdate(node);
    }, false, ['create', 'switch', 'close', 'navigate', 'reload', 'list']);

    // 页面ID (用于切换和关闭)
    this.createPropertyCard('page-id-card', 'Page ID', 'input', node.properties.pageId || '', (value) => {
      node.properties.pageId = value;
      this.onNodeUpdate(node);
    });

    // URL (用于创建和导航)
    this.createPropertyCard('url-card', 'URL', 'input', node.properties.url || '', (value) => {
      node.properties.url = value;
      this.onNodeUpdate(node);
    });

    // 等待加载完成
    this.createPropertyCard('wait-for-load-card', 'Wait For Load', 'select', node.properties.waitForLoad !== false ? 'true' : 'false', (value) => {
      node.properties.waitForLoad = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);

    // 重用已存在页面
    this.createPropertyCard('reuse-existing-card', 'Reuse Existing Page', 'select', node.properties.reuseExisting ? 'true' : 'false', (value) => {
      node.properties.reuseExisting = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);

    // 超时时间
    this.createPropertyCard('timeout-card', 'Timeout (ms)', 'input', node.properties.timeout?.toString() || '30000', (value) => {
      node.properties.timeout = parseInt(value) || 30000;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');
  }

  public renderActionV2Properties(node: BaseNode): void {
    // Worker绑定
    this.createPropertyCard('worker-id-card', 'Worker ID', 'input', node.workerId || '', (value) => {
      node.bindToWorker(value);
      this.onNodeUpdate(node);
    });

    // Page绑定
    this.createPropertyCard('page-id-card', 'Page ID', 'input', node.pageId || '', (value) => {
      node.bindToPage(value);
      this.onNodeUpdate(node);
    });

    // 全局超时
    this.createPropertyCard('global-timeout-card', 'Global Timeout (ms)', 'input', node.properties.globalTimeout?.toString() || '30000', (value) => {
      node.properties.globalTimeout = parseInt(value) || 30000;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');

    // 并行执行序列
    this.createPropertyCard('parallel-card', 'Parallel Execution', 'select', node.properties.parallel ? 'true' : 'false', (value) => {
      node.properties.parallel = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);

    // 遇到错误停止
    this.createPropertyCard('on-error-stop-card', 'Stop On Error', 'select', node.properties.onErrorStop !== false ? 'true' : 'false', (value) => {
      node.properties.onErrorStop = value === 'true';
      this.onNodeUpdate(node);
    }, false, ['true', 'false']);

    // 简化操作配置
    this.createPropertyCard('simple-selector-card', 'Simple Selector', 'input', node.properties.simpleSelector || '', (value) => {
      node.properties.simpleSelector = value;
      this.onNodeUpdate(node);
    });

    this.createPropertyCard('simple-action-card', 'Simple Action', 'select', node.properties.simpleAction || 'click', (value) => {
      node.properties.simpleAction = value;
      this.onNodeUpdate(node);
    }, false, ['click', 'input', 'hover', 'scroll', 'extract', 'screenshot', 'navigate']);

    this.createPropertyCard('simple-text-card', 'Simple Text', 'input', node.properties.simpleText || '', (value) => {
      node.properties.simpleText = value;
      this.onNodeUpdate(node);
    });

    this.createPropertyCard('simple-wait-card', 'Simple Wait (ms)', 'input', node.properties.simpleWaitTime?.toString() || '1000', (value) => {
      node.properties.simpleWaitTime = parseInt(value) || 1000;
      this.onNodeUpdate(node);
    }, false, undefined, 'number');

    // 高级配置 (JSON编辑器)
    this.createPropertyCard('sequences-json-card', 'Execution Sequences (JSON)', 'textarea', node.properties.sequencesJson || '', (value) => {
      node.properties.sequencesJson = value;
      this.onNodeUpdate(node);
    });

    this.createPropertyCard('output-containers-card', 'Output Containers (JSON)', 'textarea', node.properties.outputContainersJson || '', (value) => {
      node.properties.outputContainersJson = value;
      this.onNodeUpdate(node);
    });
  }

  private createGridPropertiesLayout(properties: Array<{
    id: string;
    label: string;
    type: 'input' | 'textarea' | 'select';
    value: string;
    onChange: ((value: string) => void) | null;
    readonly?: boolean;
    options?: string[];
    inputType?: string;
    gridColumn?: string;
  }>): void {
    // 创建网格容器卡片
    const gridCard = new Card({
      id: 'properties-grid-card',
      title: '',
      className: 'property-grid-card',
      centered: false,
      bordered: false
    });

    // 创建网格容器
    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      width: 100%;
    `;

    properties.forEach(prop => {
      const container = document.createElement('div');
      if (prop.gridColumn) {
        container.style.gridColumn = prop.gridColumn;
      }
      if (prop.gridColumn === '1 / -1') {
        container.style.marginBottom = '4px';
      }
      
      const label = document.createElement('div');
      label.textContent = prop.label;
      label.style.cssText = `
        color: #cccccc;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 4px;
      `;
      
      let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

      if (prop.type === 'select' && prop.options) {
        input = document.createElement('select');
        prop.options.forEach(option => {
          const optionEl = document.createElement('option');
          optionEl.value = option;
          optionEl.textContent = option;
          optionEl.selected = option === prop.value;
          input.appendChild(optionEl);
        });
      } else if (prop.type === 'textarea') {
        input = document.createElement('textarea');
        input.value = prop.value;
      } else {
        input = document.createElement('input');
        input.type = prop.inputType || 'text';
        input.value = prop.value;
      }

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

      if (prop.type === 'textarea') {
        input.style.height = '80px';
        input.style.resize = 'vertical';
      }

      input.addEventListener('focus', () => {
        input.style.borderColor = '#FFC107';
      });

      input.addEventListener('blur', () => {
        input.style.borderColor = '#505050';
      });

      if (prop.readonly) {
        input.disabled = true;
      }

      if (prop.onChange) {
        input.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          prop.onChange!(target.value);
        });
      }

      container.appendChild(label);
      container.appendChild(input);
      gridContainer.appendChild(container);
    });

    gridCard.setContent(gridContainer);
    this.rootCard.addChild(gridCard);
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