/**
 * Enhanced Element Selector - 增强的元素选择器
 * Provides advanced element selection and locator generation capabilities
 */

import { ElementData } from '../../../shared/types';

export interface SelectorStrategy {
  name: string;
  priority: number;
  generate(element: HTMLElement): string;
  validate(selector: string, element: HTMLElement): boolean;
}

export class ElementSelector {
  private strategies: SelectorStrategy[] = [];

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // ID-based selector (highest priority)
    this.strategies.push({
      name: 'id',
      priority: 1,
      generate: (element: HTMLElement) => {
        return element.id ? `#${element.id}` : '';
      },
      validate: (selector: string, element: HTMLElement) => {
        try {
          const found = document.querySelector(selector);
          return found === element;
        } catch {
          return false;
        }
      }
    });

    // Data attribute selector
    this.strategies.push({
      name: 'data-testid',
      priority: 2,
      generate: (element: HTMLElement) => {
        const testId = element.getAttribute('data-testid') || element.getAttribute('data-test-id');
        return testId ? `[data-testid="${testId}"]` : '';
      },
      validate: (selector: string, element: HTMLElement) => {
        try {
          const found = document.querySelector(selector);
          return found === element;
        } catch {
          return false;
        }
      }
    });

    // Name attribute selector
    this.strategies.push({
      name: 'name',
      priority: 3,
      generate: (element: HTMLElement) => {
        const name = element.getAttribute('name');
        return name ? `[name="${name}"]` : '';
      },
      validate: (selector: string, element: HTMLElement) => {
        try {
          const found = document.querySelector(selector);
          return found === element;
        } catch {
          return false;
        }
      }
    });

    // Class-based selector
    this.strategies.push({
      name: 'class',
      priority: 4,
      generate: (element: HTMLElement) => {
        const classes = Array.from(element.classList)
          .filter(cls => !cls.startsWith('wao-') && !cls.match(/^(ng-|v-|_)/))
          .slice(0, 3); // Limit to 3 most relevant classes
        
        return classes.length > 0 ? `.${classes.join('.')}` : '';
      },
      validate: (selector: string, element: HTMLElement) => {
        try {
          const elements = document.querySelectorAll(selector);
          return elements.length === 1 && elements[0] === element;
        } catch {
          return false;
        }
      }
    });

    // CSS path selector
    this.strategies.push({
      name: 'css-path',
      priority: 5,
      generate: (element: HTMLElement) => {
        return this.generateCSSPath(element);
      },
      validate: (selector: string, element: HTMLElement) => {
        try {
          const found = document.querySelector(selector);
          return found === element;
        } catch {
          return false;
        }
      }
    });

    // XPath selector
    this.strategies.push({
      name: 'xpath',
      priority: 6,
      generate: (element: HTMLElement) => {
        return this.generateXPath(element);
      },
      validate: (selector: string, element: HTMLElement) => {
        try {
          const result = document.evaluate(
            selector,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          return result.singleNodeValue === element;
        } catch {
          return false;
        }
      }
    });

    // Text-based selector
    this.strategies.push({
      name: 'text',
      priority: 7,
      generate: (element: HTMLElement) => {
        const text = element.textContent?.trim();
        if (text && text.length < 50 && text.length > 2) {
          return `//*[contains(text(), "${text.replace(/"/g, '\\"')}")]`;
        }
        return '';
      },
      validate: (selector: string, element: HTMLElement) => {
        try {
          const result = document.evaluate(
            selector,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          return result.singleNodeValue === element;
        } catch {
          return false;
        }
      }
    });
  }

  public generateSelectors(element: HTMLElement): ElementData['selectors'] {
    const selectors: ElementData['selectors'] = {
      css: '',
      xpath: '',
      attributes: {}
    };

    // Generate selectors using all strategies
    const generatedSelectors: Array<{ name: string; selector: string; priority: number }> = [];

    for (const strategy of this.strategies) {
      const selector = strategy.generate(element);
      if (selector && strategy.validate(selector, element)) {
        generatedSelectors.push({
          name: strategy.name,
          selector,
          priority: strategy.priority
        });
      }
    }

    // Sort by priority and select the best ones
    generatedSelectors.sort((a, b) => a.priority - b.priority);

    // Set primary CSS selector
    const cssSelector = generatedSelectors.find(s => 
      ['id', 'data-testid', 'name', 'class', 'css-path'].includes(s.name)
    );
    selectors.css = cssSelector?.selector || this.generateCSSPath(element);

    // Set XPath selector
    const xpathSelector = generatedSelectors.find(s => 
      ['xpath', 'text'].includes(s.name)
    );
    selectors.xpath = xpathSelector?.selector || this.generateXPath(element);

    // Set attribute-based selectors
    selectors.attributes = this.generateAttributeSelectors(element);

    return selectors;
  }

  private generateCSSPath(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const path: string[] = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      // Add ID if available
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }

      // Add classes (filtered)
      const classes = Array.from(current.classList)
        .filter(cls => !cls.startsWith('wao-') && !cls.match(/^(ng-|v-|_)/))
        .slice(0, 2);
      
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }

      // Add nth-child if needed for uniqueness
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children)
          .filter(el => el.tagName === current.tagName);
        
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement as HTMLElement;
    }

    return path.join(' > ');
  }

  private generateXPath(element: HTMLElement): string {
    const path: string[] = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();

      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children)
          .filter(el => el.tagName === current.tagName);
        
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `[${index}]`;
        }
      }

      path.unshift(selector);
      current = current.parentElement as HTMLElement;
    }

    return '//' + path.join('/');
  }

  private generateAttributeSelectors(element: HTMLElement): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    // Important attributes for element identification
    const importantAttrs = [
      'id', 'class', 'name', 'type', 'role', 'aria-label', 'aria-labelledby',
      'data-testid', 'data-test-id', 'data-cy', 'data-qa', 'placeholder',
      'title', 'alt', 'href', 'src', 'value'
    ];

    importantAttrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        attributes[attr] = value;
      }
    });

    return attributes;
  }

  public isValidTarget(element: HTMLElement): boolean {
    console.log('Validating target:', element, 'tagName:', element.tagName);
    
    // Skip our own injected elements
    if (element.classList.contains('wao-highlight') || 
        element.classList.contains('wao-operation-menu') ||
        element.classList.contains('wao-indicator') ||
        element.classList.contains('wao-main-panel') ||
        element.closest('.wao-main-panel')) {
      console.log('Skipping: our own injected element');
      return false;
    }
    
    // Skip script, style, and meta elements
    const skipTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD', 'HTML', 'BODY'];
    if (skipTags.includes(element.tagName)) {
      console.log('Skipping: skip tag', element.tagName);
      return false;
    }
    
    // 简化验证逻辑 - 只要不是隐藏元素就允许捕获
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      console.log('Skipping: hidden element');
      return false;
    }
    
    console.log('Valid: element passed validation');
    return true;
  }

  public getElementScore(element: HTMLElement): number {
    let score = 0;
    
    // Higher score for interactive elements
    const interactiveTags = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'];
    if (interactiveTags.includes(element.tagName)) {
      score += 10;
    }
    
    // Higher score for elements with IDs
    if (element.id) {
      score += 8;
    }
    
    // Higher score for elements with test attributes
    if (element.hasAttribute('data-testid') || element.hasAttribute('data-test-id')) {
      score += 7;
    }
    
    // Higher score for elements with meaningful classes
    const meaningfulClasses = Array.from(element.classList)
      .filter(cls => !cls.match(/^(ng-|v-|_|css-)/));
    score += Math.min(meaningfulClasses.length * 2, 6);
    
    // Higher score for elements with text content
    const text = element.textContent?.trim();
    if (text && text.length > 0) {
      score += Math.min(text.length / 10, 5);
    }
    
    return score;
  }
}