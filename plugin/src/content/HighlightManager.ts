/**
 * Enhanced Highlight Manager - 增强的高亮管理器
 * Manages element highlighting with advanced visual effects
 */

export interface HighlightOptions {
  color?: string;
  borderWidth?: number;
  borderStyle?: string;
  backgroundColor?: string;
  showTooltip?: boolean;
  tooltipContent?: string;
  animation?: boolean;
}

export class HighlightManager {
  private highlightedElement: HTMLElement | null = null;
  private highlightOverlay: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private defaultOptions: HighlightOptions = {
    color: '#4CAF50',
    borderWidth: 2,
    borderStyle: 'solid',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    showTooltip: true,
    animation: true
  };

  constructor() {
    this.injectStyles();
  }

  public highlightElement(element: HTMLElement, options?: HighlightOptions): void {
    this.removeHighlight();
    
    const opts = { ...this.defaultOptions, ...options };
    
    // Create highlight overlay
    this.createHighlightOverlay(element, opts);
    
    // Show tooltip if enabled
    if (opts.showTooltip) {
      this.showTooltip(element, opts.tooltipContent);
    }
    
    this.highlightedElement = element;
  }

  public removeHighlight(): void {
    if (this.highlightOverlay) {
      this.highlightOverlay.remove();
      this.highlightOverlay = null;
    }
    
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    
    if (this.highlightedElement) {
      this.highlightedElement.classList.remove('wao-highlight');
      this.highlightedElement = null;
    }
  }

  public updateHighlight(): void {
    if (this.highlightedElement && this.highlightOverlay) {
      const rect = this.highlightedElement.getBoundingClientRect();
      this.updateOverlayPosition(this.highlightOverlay, rect);
      
      if (this.tooltip) {
        this.updateTooltipPosition(this.tooltip, rect);
      }
    }
  }

  private createHighlightOverlay(element: HTMLElement, options: HighlightOptions): void {
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    this.highlightOverlay = document.createElement('div');
    this.highlightOverlay.className = 'wao-highlight-overlay';
    
    // Position and style the overlay
    Object.assign(this.highlightOverlay.style, {
      position: 'absolute',
      left: `${rect.left + scrollX - options.borderWidth!}px`,
      top: `${rect.top + scrollY - options.borderWidth!}px`,
      width: `${rect.width + options.borderWidth! * 2}px`,
      height: `${rect.height + options.borderWidth! * 2}px`,
      border: `${options.borderWidth}px ${options.borderStyle} ${options.color}`,
      backgroundColor: options.backgroundColor,
      pointerEvents: 'none',
      zIndex: '2147483646',
      borderRadius: '4px',
      boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.8), 0 4px 12px rgba(0, 0, 0, 0.15)`
    });
    
    if (options.animation) {
      this.highlightOverlay.style.animation = 'wao-highlight-pulse 2s infinite';
    }
    
    document.body.appendChild(this.highlightOverlay);
  }

  private showTooltip(element: HTMLElement, customContent?: string): void {
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'wao-tooltip';
    
    // Generate tooltip content
    const content = customContent || this.generateTooltipContent(element);
    this.tooltip.innerHTML = content;
    
    // Position tooltip
    const tooltipX = rect.left + scrollX + rect.width / 2;
    const tooltipY = rect.top + scrollY - 10;
    
    Object.assign(this.tooltip.style, {
      position: 'absolute',
      left: `${tooltipX}px`,
      top: `${tooltipY}px`,
      transform: 'translate(-50%, -100%)',
      zIndex: '2147483647'
    });
    
    document.body.appendChild(this.tooltip);
    
    // Adjust position if tooltip goes off-screen
    this.adjustTooltipPosition(this.tooltip);
  }

  private generateTooltipContent(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = Array.from(element.classList)
      .filter(cls => !cls.startsWith('wao-'))
      .slice(0, 2)
      .map(cls => `.${cls}`)
      .join('');
    
    const text = element.textContent?.trim().substring(0, 30) || '';
    const textDisplay = text ? `"${text}${text.length > 30 ? '...' : ''}"` : '';
    
    const selector = `${tagName}${id}${classes}`;
    
    return `
      <div class="wao-tooltip-content">
        <div class="wao-tooltip-selector">${selector}</div>
        ${textDisplay ? `<div class="wao-tooltip-text">${textDisplay}</div>` : ''}
        <div class="wao-tooltip-hint">Ctrl+Click to select</div>
      </div>
    `;
  }

  private updateOverlayPosition(overlay: HTMLElement, rect: DOMRect): void {
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const borderWidth = 2;
    
    Object.assign(overlay.style, {
      left: `${rect.left + scrollX - borderWidth}px`,
      top: `${rect.top + scrollY - borderWidth}px`,
      width: `${rect.width + borderWidth * 2}px`,
      height: `${rect.height + borderWidth * 2}px`
    });
  }

  private updateTooltipPosition(tooltip: HTMLElement, rect: DOMRect): void {
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    const tooltipX = rect.left + scrollX + rect.width / 2;
    const tooltipY = rect.top + scrollY - 10;
    
    Object.assign(tooltip.style, {
      left: `${tooltipX}px`,
      top: `${tooltipY}px`
    });
    
    this.adjustTooltipPosition(tooltip);
  }

  private adjustTooltipPosition(tooltip: HTMLElement): void {
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust horizontal position
    if (rect.right > viewportWidth) {
      tooltip.style.transform = 'translate(-100%, -100%)';
    } else if (rect.left < 0) {
      tooltip.style.transform = 'translate(0%, -100%)';
    }
    
    // Adjust vertical position
    if (rect.top < 0) {
      tooltip.style.transform = tooltip.style.transform.replace('-100%)', '100%)');
    }
  }

  private injectStyles(): void {
    if (document.getElementById('wao-highlight-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'wao-highlight-styles';
    style.textContent = `
      @keyframes wao-highlight-pulse {
        0%, 100% { 
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8), 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        50% { 
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8), 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(76, 175, 80, 0.4);
        }
      }
      
      .wao-tooltip {
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: wao-tooltip-appear 0.2s ease-out;
        pointer-events: none;
      }
      
      @keyframes wao-tooltip-appear {
        from {
          opacity: 0;
          transform: translate(-50%, -100%) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -100%) scale(1);
        }
      }
      
      .wao-tooltip-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .wao-tooltip-selector {
        font-weight: 600;
        color: #4CAF50;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }
      
      .wao-tooltip-text {
        color: #ccc;
        font-style: italic;
      }
      
      .wao-tooltip-hint {
        color: #888;
        font-size: 11px;
        margin-top: 2px;
      }
      
      .wao-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: rgba(0, 0, 0, 0.9);
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .wao-highlight-overlay {
          border-width: 3px !important;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 1), 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        }
        
        .wao-tooltip {
          background: black !important;
          border: 2px solid white !important;
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .wao-highlight-overlay {
          animation: none !important;
        }
        
        .wao-tooltip {
          animation: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  public destroy(): void {
    this.removeHighlight();
    
    const styles = document.getElementById('wao-highlight-styles');
    if (styles) {
      styles.remove();
    }
  }
}