/**
 * Card Component - 基础卡片组件
 * 卡片化UI系统的核心组件，支持嵌套和独立数据管理
 */

export interface CardConfig {
  id: string;
  title?: string;
  className?: string;
  children?: Card[];
  data?: any;
  centered?: boolean;
  bordered?: boolean;
}

export class Card {
  private config: CardConfig;
  private element: HTMLElement;
  private contentElement: HTMLElement;
  private children: Card[] = [];
  private parent: Card | null = null;
  private dataStore: Map<string, any> = new Map();

  constructor(config: CardConfig) {
    this.config = {
      centered: true,
      bordered: true,
      ...config
    };
    
    this.createElement();
    this.setupDataStore();
    this.addChildren();
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.className = `card ${this.config.className || ''}`;
    this.element.setAttribute('data-card-id', this.config.id);

    // Create title if provided
    if (this.config.title) {
      const titleElement = document.createElement('div');
      titleElement.className = 'card-title';
      titleElement.textContent = this.config.title;
      
      // Apply compact title styles
      Object.assign(titleElement.style, {
        fontSize: '11px',
        fontWeight: '600',
        color: '#cccccc',
        marginBottom: '6px',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        paddingBottom: '4px',
        borderBottom: '1px solid #404040'
      });
      
      this.element.appendChild(titleElement);
    }

    // Create content container
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'card-content';
    this.element.appendChild(this.contentElement);

    // Apply card styles after all elements are created
    this.applyCardStyles();
  }

  private applyCardStyles(): void {
    const styles: Record<string, string> = {
      position: 'relative',
      boxSizing: 'border-box',
      backgroundColor: '#2d2d2d',
      borderRadius: '6px',
      padding: '8px',
      margin: '2px',
      width: 'auto',
      height: 'auto',
      minWidth: 'fit-content',
      minHeight: 'fit-content'
    };

    // Add border if enabled
    if (this.config.bordered) {
      styles.border = '1px solid #404040';
    }

    // Apply centering if enabled
    if (this.config.centered) {
      styles.display = 'flex';
      styles.flexDirection = 'column';
      styles.alignItems = 'center';
      styles.justifyContent = 'center';
    }

    // Apply styles to element
    Object.assign(this.element.style, styles);

    // Apply container filling styles to content element
    Object.assign(this.contentElement.style, {
      width: '100%',
      height: '100%',
      minHeight: 'fit-content',
      display: 'flex',
      flexDirection: 'column',
      alignItems: this.config.centered ? 'center' : 'stretch',
      justifyContent: this.config.centered ? 'center' : 'flex-start',
      gap: '2px'
    });
  }

  private setupDataStore(): void {
    if (this.config.data) {
      Object.entries(this.config.data).forEach(([key, value]) => {
        this.dataStore.set(key, value);
      });
    }
  }

  private addChildren(): void {
    if (this.config.children) {
      this.config.children.forEach(childConfig => {
        const child = new Card(childConfig);
        this.addChild(child);
      });
    }
  }

  public addChild(child: Card): void {
    child.parent = this;
    this.children.push(child);
    this.contentElement.appendChild(child.getElement());
    
    // Apply parent's style inheritance
    this.inheritParentStyles(child);
  }

  private inheritParentStyles(child: Card): void {
    const childElement = child.getElement();
    const childContent = child.getContentElement();

    // Inherit centering and alignment
    if (this.config.centered) {
      childElement.style.alignSelf = 'center';
      childContent.style.textAlign = 'center';
    }

    // Ensure child doesn't exceed parent boundaries
    childElement.style.maxWidth = '100%';
    childElement.style.overflow = 'hidden';
  }

  public removeChild(childId: string): void {
    const index = this.children.findIndex(child => child.getId() === childId);
    if (index !== -1) {
      const child = this.children[index];
      child.destroy();
      this.children.splice(index, 1);
    }
  }

  public setData(key: string, value: any): void {
    this.dataStore.set(key, value);
    this.onDataChange(key, value);
  }

  public getData<T = any>(key: string): T | undefined {
    return this.dataStore.get(key);
  }

  public getAllData(): Record<string, any> {
    return Object.fromEntries(this.dataStore.entries());
  }

  private onDataChange(key: string, value: any): void {
    // Trigger custom data change event
    const event = new CustomEvent('cardDataChange', {
      detail: { cardId: this.config.id, key, value }
    });
    this.element.dispatchEvent(event);
  }

  public setContent(content: string | HTMLElement): void {
    if (typeof content === 'string') {
      this.contentElement.innerHTML = content;
    } else {
      this.contentElement.innerHTML = '';
      this.contentElement.appendChild(content);
    }
  }

  public appendContent(content: string | HTMLElement): void {
    if (typeof content === 'string') {
      const div = document.createElement('div');
      div.innerHTML = content;
      this.contentElement.appendChild(div);
    } else {
      this.contentElement.appendChild(content);
    }
  }

  public getId(): string {
    return this.config.id;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getContentElement(): HTMLElement {
    return this.contentElement;
  }

  public getChildren(): Card[] {
    return [...this.children];
  }

  public getParent(): Card | null {
    return this.parent;
  }

  public updateTitle(newTitle: string): void {
    this.config.title = newTitle;
    const titleElement = this.element.querySelector('.card-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = newTitle;
    } else if (newTitle) {
      // Create title element if it doesn't exist
      const titleEl = document.createElement('div');
      titleEl.className = 'card-title';
      titleEl.textContent = newTitle;
      this.element.insertBefore(titleEl, this.contentElement);
    }
  }

  public show(): void {
    this.element.style.display = '';
  }

  public hide(): void {
    this.element.style.display = 'none';
  }

  public destroy(): void {
    // Destroy all children first
    this.children.forEach(child => child.destroy());
    
    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this.config.id);
    }
    
    // Remove from DOM
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Clear data
    this.dataStore.clear();
  }
}