/**
 * Operation Menu - 操作菜单
 * Provides UI for defining operations on selected elements
 */

import { Operation } from '../../../shared/types';
import { OPERATIONS } from '../../../shared/constants';

export interface OperationConfig {
  type: string;
  params: Record<string, any>;
  delay: number;
}

export interface OperationMenuOptions {
  position: { x: number; y: number };
  element: HTMLElement;
  onSelect: (config: OperationConfig) => void;
  onCancel: () => void;
}

export class OperationMenu {
  private menuElement: HTMLElement | null = null;
  private options: OperationMenuOptions;
  private currentStep: 'type' | 'params' | 'delay' = 'type';
  private config: OperationConfig = {
    type: '',
    params: {},
    delay: 0
  };

  constructor(options: OperationMenuOptions) {
    this.options = options;
    this.render();
  }

  private render(): void {
    this.removeMenu();
    
    const menu = document.createElement('div');
    menu.className = 'wao-operation-menu';
    
    // Position the menu
    menu.style.position = 'fixed';
    menu.style.left = `${this.options.position.x}px`;
    menu.style.top = `${this.options.position.y}px`;
    menu.style.zIndex = '2147483647';
    
    // Render current step
    switch (this.currentStep) {
      case 'type':
        this.renderTypeSelection(menu);
        break;
      case 'params':
        this.renderParamsForm(menu);
        break;
      case 'delay':
        this.renderDelayConfig(menu);
        break;
    }
    
    document.body.appendChild(menu);
    this.menuElement = menu;
    
    // Add global click handler to close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 100);
    
    // Add escape key handler
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Ensure menu is within viewport
    this.adjustMenuPosition();
  }

  private renderTypeSelection(menu: HTMLElement): void {
    menu.innerHTML = `
      <div class="wao-menu-header">选择操作类型</div>
      <div class="wao-menu-options">
        <button data-operation="${OPERATIONS.ACTION_TYPES.CLICK}" class="wao-operation-button">
          <span class="wao-operation-icon">👆</span>点击
        </button>
        <button data-operation="${OPERATIONS.ACTION_TYPES.INPUT}" class="wao-operation-button">
          <span class="wao-operation-icon">✏️</span>输入
        </button>
        <button data-operation="${OPERATIONS.ACTION_TYPES.HOVER}" class="wao-operation-button">
          <span class="wao-operation-icon">👋</span>悬停
        </button>
        <button data-operation="${OPERATIONS.ACTION_TYPES.EXTRACT}" class="wao-operation-button">
          <span class="wao-operation-icon">📋</span>提取
        </button>
        <button data-operation="${OPERATIONS.ACTION_TYPES.SCROLL}" class="wao-operation-button">
          <span class="wao-operation-icon">📜</span>滚动
        </button>
        <button data-operation="${OPERATIONS.ACTION_TYPES.WAIT}" class="wao-operation-button">
          <span class="wao-operation-icon">⏱️</span>等待
        </button>
        <button data-operation="${OPERATIONS.ACTION_TYPES.KEYBOARD}" class="wao-operation-button">
          <span class="wao-operation-icon">⌨️</span>键盘
        </button>
      </div>
      <div class="wao-menu-footer">
        <button class="wao-cancel">取消</button>
      </div>
    `;
    
    // Add event listeners
    const operationButtons = menu.querySelectorAll('.wao-operation-button');
    operationButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const operationType = (e.currentTarget as HTMLElement).getAttribute('data-operation');
        if (operationType) {
          this.config.type = operationType;
          this.config.params = this.getDefaultParams(operationType);
          this.currentStep = 'params';
          this.render();
        }
      });
    });
    
    const cancelButton = menu.querySelector('.wao-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.cancel();
      });
    }
  }

  private renderParamsForm(menu: HTMLElement): void {
    const operationType = this.config.type;
    let formHtml = '';
    
    switch (operationType) {
      case OPERATIONS.ACTION_TYPES.CLICK:
        formHtml = `
          <div class="wao-form-group">
            <label class="wao-form-label">按钮</label>
            <select class="wao-form-select" name="button">
              <option value="left" ${this.config.params.button === 'left' ? 'selected' : ''}>左键</option>
              <option value="right" ${this.config.params.button === 'right' ? 'selected' : ''}>右键</option>
              <option value="middle" ${this.config.params.button === 'middle' ? 'selected' : ''}>中键</option>
            </select>
          </div>
          <div class="wao-form-group">
            <label class="wao-form-label">双击</label>
            <input type="checkbox" class="wao-form-checkbox" name="double" ${this.config.params.double ? 'checked' : ''}>
          </div>
        `;
        break;
        
      case OPERATIONS.ACTION_TYPES.INPUT:
        formHtml = `
          <div class="wao-form-group">
            <label class="wao-form-label">文本</label>
            <textarea class="wao-form-textarea" name="text" rows="3">${this.config.params.text || ''}</textarea>
          </div>
          <div class="wao-form-group">
            <label class="wao-form-label">先清空</label>
            <input type="checkbox" class="wao-form-checkbox" name="clear_first" ${this.config.params.clear_first ? 'checked' : ''}>
          </div>
        `;
        break;
        
      case OPERATIONS.ACTION_TYPES.HOVER:
        formHtml = `
          <div class="wao-form-group">
            <label class="wao-form-label">持续时间 (毫秒)</label>
            <input type="number" class="wao-form-input" name="duration" value="${this.config.params.duration || 1000}" min="0" step="100">
          </div>
        `;
        break;
        
      case OPERATIONS.ACTION_TYPES.EXTRACT:
        formHtml = `
          <div class="wao-form-group">
            <label class="wao-form-label">提取内容</label>
            <select class="wao-form-select" name="attribute">
              <option value="text" ${this.config.params.attribute === 'text' ? 'selected' : ''}>文本内容</option>
              <option value="html" ${this.config.params.attribute === 'html' ? 'selected' : ''}>HTML</option>
              <option value="value" ${this.config.params.attribute === 'value' ? 'selected' : ''}>值</option>
              <option value="href" ${this.config.params.attribute === 'href' ? 'selected' : ''}>链接</option>
              <option value="src" ${this.config.params.attribute === 'src' ? 'selected' : ''}>源地址</option>
              <option value="custom" ${this.config.params.attribute === 'custom' ? 'selected' : ''}>自定义属性</option>
            </select>
          </div>
          <div class="wao-form-group ${this.config.params.attribute === 'custom' ? '' : 'wao-hidden'}">
            <label class="wao-form-label">自定义属性名</label>
            <input type="text" class="wao-form-input" name="custom_attribute" value="${this.config.params.custom_attribute || ''}">
          </div>
          <div class="wao-form-group">
            <label class="wao-form-label">输出格式</label>
            <select class="wao-form-select" name="format">
              <option value="string" ${this.config.params.format === 'string' ? 'selected' : ''}>字符串</option>
              <option value="number" ${this.config.params.format === 'number' ? 'selected' : ''}>数字</option>
              <option value="boolean" ${this.config.params.format === 'boolean' ? 'selected' : ''}>布尔值</option>
              <option value="json" ${this.config.params.format === 'json' ? 'selected' : ''}>JSON</option>
            </select>
          </div>
        `;
        break;
        
      case OPERATIONS.ACTION_TYPES.SCROLL:
        formHtml = `
          <div class="wao-form-group">
            <label class="wao-form-label">方向</label>
            <select class="wao-form-select" name="direction">
              <option value="down" ${this.config.params.direction === 'down' ? 'selected' : ''}>向下</option>
              <option value="up" ${this.config.params.direction === 'up' ? 'selected' : ''}>向上</option>
              <option value="left" ${this.config.params.direction === 'left' ? 'selected' : ''}>向左</option>
              <option value="right" ${this.config.params.direction === 'right' ? 'selected' : ''}>向右</option>
              <option value="into-view" ${this.config.params.direction === 'into-view' ? 'selected' : ''}>滚动到视图</option>
            </select>
          </div>
          <div class="wao-form-group ${this.config.params.direction === 'into-view' ? 'wao-hidden' : ''}">
            <label class="wao-form-label">滚动距离 (像素)</label>
            <input type="number" class="wao-form-input" name="amount" value="${this.config.params.amount || 100}" min="0" step="10">
          </div>
          <div class="wao-form-group">
            <label class="wao-form-label">平滑滚动</label>
            <input type="checkbox" class="wao-form-checkbox" name="smooth" ${this.config.params.smooth ? 'checked' : ''}>
          </div>
        `;
        break;
        
      case OPERATIONS.ACTION_TYPES.WAIT:
        formHtml = `
          <div class="wao-form-group">
            <label class="wao-form-label">等待类型</label>
            <select class="wao-form-select" name="condition">
              <option value="time" ${this.config.params.condition === 'time' ? 'selected' : ''}>时间</option>
              <option value="element" ${this.config.params.condition === 'element' ? 'selected' : ''}>元素出现</option>
              <option value="element-gone" ${this.config.params.condition === 'element-gone' ? 'selected' : ''}>元素消失</option>
              <option value="text" ${this.config.params.condition === 'text' ? 'selected' : ''}>文本出现</option>
            </select>
          </div>
          <div class="wao-form-group ${this.config.params.condition === 'time' ? '' : 'wao-hidden'}">
            <label class="wao-form-label">等待时间 (毫秒)</label>
            <input type="number" class="wao-form-input" name="duration" value="${this.config.params.duration || 1000}" min="0" step="100">
          </div>
          <div class="wao-form-group ${this.config.params.condition === 'text' ? '' : 'wao-hidden'}">
            <label class="wao-form-label">等待文本</label>
            <input type="text" class="wao-form-input" name="text" value="${this.config.params.text || ''}">
          </div>
          <div class="wao-form-group">
            <label class="wao-form-label">超时 (毫秒)</label>
            <input type="number" class="wao-form-input" name="timeout" value="${this.config.params.timeout || 5000}" min="0" step="1000">
          </div>
        `;
        break;
        
      case OPERATIONS.ACTION_TYPES.KEYBOARD:
        formHtml = `
          <div class="wao-form-group">
            <label class="wao-form-label">按键类型</label>
            <select class="wao-form-select" name="key_type">
              <option value="single" ${this.config.params.key_type === 'single' ? 'selected' : ''}>单个按键</option>
              <option value="combination" ${this.config.params.key_type === 'combination' ? 'selected' : ''}>组合键</option>
              <option value="text" ${this.config.params.key_type === 'text' ? 'selected' : ''}>文本</option>
            </select>
          </div>
          <div class="wao-form-group ${this.config.params.key_type === 'single' || this.config.params.key_type === 'combination' ? '' : 'wao-hidden'}">
            <label class="wao-form-label">按键</label>
            <select class="wao-form-select" name="key">
              <option value="Enter" ${this.config.params.key === 'Enter' ? 'selected' : ''}>回车</option>
              <option value="Tab" ${this.config.params.key === 'Tab' ? 'selected' : ''}>Tab</option>
              <option value="Escape" ${this.config.params.key === 'Escape' ? 'selected' : ''}>Esc</option>
              <option value="ArrowUp" ${this.config.params.key === 'ArrowUp' ? 'selected' : ''}>上箭头</option>
              <option value="ArrowDown" ${this.config.params.key === 'ArrowDown' ? 'selected' : ''}>下箭头</option>
              <option value="ArrowLeft" ${this.config.params.key === 'ArrowLeft' ? 'selected' : ''}>左箭头</option>
              <option value="ArrowRight" ${this.config.params.key === 'ArrowRight' ? 'selected' : ''}>右箭头</option>
              <option value="Backspace" ${this.config.params.key === 'Backspace' ? 'selected' : ''}>退格</option>
              <option value="Delete" ${this.config.params.key === 'Delete' ? 'selected' : ''}>删除</option>
              <option value="PageUp" ${this.config.params.key === 'PageUp' ? 'selected' : ''}>Page Up</option>
              <option value="PageDown" ${this.config.params.key === 'PageDown' ? 'selected' : ''}>Page Down</option>
              <option value="Home" ${this.config.params.key === 'Home' ? 'selected' : ''}>Home</option>
              <option value="End" ${this.config.params.key === 'End' ? 'selected' : ''}>End</option>
            </select>
          </div>
          <div class="wao-form-group ${this.config.params.key_type === 'combination' ? '' : 'wao-hidden'}">
            <label class="wao-form-label">修饰键</label>
            <div class="wao-checkbox-group">
              <label>
                <input type="checkbox" name="ctrl" ${this.config.params.ctrl ? 'checked' : ''}>
                Ctrl
              </label>
              <label>
                <input type="checkbox" name="alt" ${this.config.params.alt ? 'checked' : ''}>
                Alt
              </label>
              <label>
                <input type="checkbox" name="shift" ${this.config.params.shift ? 'checked' : ''}>
                Shift
              </label>
              <label>
                <input type="checkbox" name="meta" ${this.config.params.meta ? 'checked' : ''}>
                Meta
              </label>
            </div>
          </div>
          <div class="wao-form-group ${this.config.params.key_type === 'text' ? '' : 'wao-hidden'}">
            <label class="wao-form-label">文本</label>
            <textarea class="wao-form-textarea" name="text" rows="3">${this.config.params.text || ''}</textarea>
          </div>
        `;
        break;
    }
    
    menu.innerHTML = `
      <div class="wao-menu-header">${this.getOperationTitle(operationType)}</div>
      <div class="wao-menu-content">
        <form class="wao-operation-form">
          ${formHtml}
        </form>
      </div>
      <div class="wao-menu-footer">
        <button class="wao-back">返回</button>
        <button class="wao-next">下一步</button>
      </div>
    `;
    
    // Add event listeners
    const backButton = menu.querySelector('.wao-back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.currentStep = 'type';
        this.render();
      });
    }
    
    const nextButton = menu.querySelector('.wao-next');
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        this.updateParamsFromForm();
        this.currentStep = 'delay';
        this.render();
      });
    }
    
    // Add dynamic form behavior
    const attributeSelect = menu.querySelector('select[name="attribute"]');
    if (attributeSelect) {
      attributeSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        const customAttrGroup = menu.querySelector('.wao-form-group:has(input[name="custom_attribute"])');
        if (customAttrGroup) {
          if (value === 'custom') {
            customAttrGroup.classList.remove('wao-hidden');
          } else {
            customAttrGroup.classList.add('wao-hidden');
          }
        }
      });
    }
    
    const directionSelect = menu.querySelector('select[name="direction"]');
    if (directionSelect) {
      directionSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        const amountGroup = menu.querySelector('.wao-form-group:has(input[name="amount"])');
        if (amountGroup) {
          if (value === 'into-view') {
            amountGroup.classList.add('wao-hidden');
          } else {
            amountGroup.classList.remove('wao-hidden');
          }
        }
      });
    }
    
    const conditionSelect = menu.querySelector('select[name="condition"]');
    if (conditionSelect) {
      conditionSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        const durationGroup = menu.querySelector('.wao-form-group:has(input[name="duration"])');
        const textGroup = menu.querySelector('.wao-form-group:has(input[name="text"])');
        
        if (durationGroup) {
          if (value === 'time') {
            durationGroup.classList.remove('wao-hidden');
          } else {
            durationGroup.classList.add('wao-hidden');
          }
        }
        
        if (textGroup) {
          if (value === 'text') {
            textGroup.classList.remove('wao-hidden');
          } else {
            textGroup.classList.add('wao-hidden');
          }
        }
      });
    }
    
    const keyTypeSelect = menu.querySelector('select[name="key_type"]');
    if (keyTypeSelect) {
      keyTypeSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        const keyGroup = menu.querySelector('.wao-form-group:has(select[name="key"])');
        const modifierGroup = menu.querySelector('.wao-form-group:has(.wao-checkbox-group)');
        const textGroup = menu.querySelector('.wao-form-group:has(textarea[name="text"])');
        
        if (keyGroup) {
          if (value === 'single' || value === 'combination') {
            keyGroup.classList.remove('wao-hidden');
          } else {
            keyGroup.classList.add('wao-hidden');
          }
        }
        
        if (modifierGroup) {
          if (value === 'combination') {
            modifierGroup.classList.remove('wao-hidden');
          } else {
            modifierGroup.classList.add('wao-hidden');
          }
        }
        
        if (textGroup) {
          if (value === 'text') {
            textGroup.classList.remove('wao-hidden');
          } else {
            textGroup.classList.add('wao-hidden');
          }
        }
      });
    }
  }

  private renderDelayConfig(menu: HTMLElement): void {
    menu.innerHTML = `
      <div class="wao-menu-header">设置延时</div>
      <div class="wao-menu-content">
        <form class="wao-operation-form">
          <div class="wao-form-group">
            <label class="wao-form-label">操作前延时 (毫秒)</label>
            <input type="number" class="wao-form-input" name="delay" value="${this.config.delay}" min="0" step="100">
          </div>
          <div class="wao-form-info">
            <p>延时将在执行操作前等待指定的毫秒数。</p>
            <p>对于需要等待页面响应的情况，建议设置适当的延时。</p>
          </div>
        </form>
      </div>
      <div class="wao-menu-footer">
        <button class="wao-back">返回</button>
        <button class="wao-finish">完成</button>
      </div>
    `;
    
    // Add event listeners
    const backButton = menu.querySelector('.wao-back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.currentStep = 'params';
        this.render();
      });
    }
    
    const finishButton = menu.querySelector('.wao-finish');
    if (finishButton) {
      finishButton.addEventListener('click', () => {
        const delayInput = menu.querySelector('input[name="delay"]') as HTMLInputElement;
        if (delayInput) {
          this.config.delay = parseInt(delayInput.value) || 0;
        }
        
        this.finish();
      });
    }
  }

  private updateParamsFromForm(): void {
    if (!this.menuElement) return;
    
    const form = this.menuElement.querySelector('.wao-operation-form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const name = input.getAttribute('name');
      if (!name) return;
      
      if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox') {
          this.config.params[name] = input.checked;
        } else if (input.type === 'number') {
          this.config.params[name] = parseInt(input.value) || 0;
        } else {
          this.config.params[name] = input.value;
        }
      } else if (input instanceof HTMLSelectElement) {
        this.config.params[name] = input.value;
      } else if (input instanceof HTMLTextAreaElement) {
        this.config.params[name] = input.value;
      }
    });
  }

  private getDefaultParams(operationType: string): Record<string, any> {
    switch (operationType) {
      case OPERATIONS.ACTION_TYPES.CLICK:
        return { button: 'left', double: false };
      case OPERATIONS.ACTION_TYPES.INPUT:
        return { text: '', clear_first: true };
      case OPERATIONS.ACTION_TYPES.HOVER:
        return { duration: 1000 };
      case OPERATIONS.ACTION_TYPES.EXTRACT:
        return { attribute: 'text', format: 'string' };
      case OPERATIONS.ACTION_TYPES.SCROLL:
        return { direction: 'down', amount: 100, smooth: true };
      case OPERATIONS.ACTION_TYPES.WAIT:
        return { condition: 'time', duration: 1000, timeout: 5000 };
      case OPERATIONS.ACTION_TYPES.KEYBOARD:
        return { key_type: 'single', key: 'Enter' };
      default:
        return {};
    }
  }

  private getOperationTitle(operationType: string): string {
    switch (operationType) {
      case OPERATIONS.ACTION_TYPES.CLICK:
        return '点击操作';
      case OPERATIONS.ACTION_TYPES.INPUT:
        return '输入操作';
      case OPERATIONS.ACTION_TYPES.HOVER:
        return '悬停操作';
      case OPERATIONS.ACTION_TYPES.EXTRACT:
        return '提取操作';
      case OPERATIONS.ACTION_TYPES.SCROLL:
        return '滚动操作';
      case OPERATIONS.ACTION_TYPES.WAIT:
        return '等待操作';
      case OPERATIONS.ACTION_TYPES.KEYBOARD:
        return '键盘操作';
      default:
        return '操作配置';
    }
  }

  private adjustMenuPosition(): void {
    if (!this.menuElement) return;
    
    const menuRect = this.menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust horizontal position if menu extends beyond viewport
    if (menuRect.right > viewportWidth - 10) {
      this.menuElement.style.left = 'auto';
      this.menuElement.style.right = '10px';
    }
    
    // Adjust vertical position if menu extends beyond viewport
    if (menuRect.bottom > viewportHeight - 10) {
      this.menuElement.style.top = 'auto';
      this.menuElement.style.bottom = '10px';
    }
  }

  private handleOutsideClick = (e: MouseEvent): void => {
    if (!this.menuElement) return;
    
    // Check if click is outside the menu
    if (!this.menuElement.contains(e.target as Node)) {
      this.cancel();
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.cancel();
    }
  };

  private finish(): void {
    if (this.options.onSelect) {
      this.options.onSelect(this.config);
    }
    
    this.removeMenu();
  }

  private cancel(): void {
    if (this.options.onCancel) {
      this.options.onCancel();
    }
    
    this.removeMenu();
  }

  private removeMenu(): void {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}