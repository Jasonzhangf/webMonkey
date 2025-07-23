/**
 * UI Panel - Component for adding nodes (Card-based)
 */
import { commandHistory } from '../commands/CommandHistory';
import { Card } from './Card';

export class UIPanel {
  private rootCard: Card;
  private onAddNode: (nodeType: string) => void;
  private onSave: () => void;
  private onLoad: (data: any) => void;
  private onRun: () => void;
  private canvasEditor: any; // 添加对CanvasEditor的引用

  constructor(
    nodeTypes: string[],
    onAddNode: (nodeType: string) => void,
    onSave: () => void,
    onLoad: (data: any) => void,
    onRun: () => void,
    canvasEditor?: any
    ) {
    this.onAddNode = onAddNode;
    this.onSave = onSave;
    this.onLoad = onLoad;
    this.onRun = onRun;
    this.canvasEditor = canvasEditor;

    // Create root card
    this.rootCard = new Card({
      id: 'ui-panel-root',
      title: 'Tools',
      className: 'ui-panel-card'
    });

    // Apply positioning to root card - 紧凑左侧边栏布局
    const rootElement = this.rootCard.getElement();
    rootElement.style.position = 'fixed';
    rootElement.style.top = '0';
    rootElement.style.left = '0';
    rootElement.style.height = '100vh';
    rootElement.style.width = '180px';
    rootElement.style.zIndex = '100';
    rootElement.style.display = 'flex';
    rootElement.style.flexDirection = 'column';
    rootElement.style.gap = '8px';
    rootElement.style.padding = '10px';
    rootElement.style.boxSizing = 'border-box';
    rootElement.style.overflowY = 'auto';
    rootElement.style.background = '#2d2d2d';
    rootElement.style.borderRight = '1px solid #404040';

    document.body.appendChild(rootElement);

    this.createNodeButtons(nodeTypes);
    this.createWorkflowButtons();
    this.createSystemButtons();
    
    // 初始化自动排版系统
    this.initializeAutoLayout();
  }

  /**
   * 创建统一样式的按钮
   */
  private createUniformButton(text: string, action: () => void, className: string, isSpecial: boolean = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', action);

    // 统一的紧凑按钮样式
    const baseStyles = {
      width: '100%',
      padding: '6px 8px',
      margin: '0',
      border: '1px solid #505050',
      color: '#ffffff',
      cursor: 'pointer',
      borderRadius: '3px',
      fontSize: '11px',
      fontWeight: '400',
      transition: 'all 0.15s ease',
      boxSizing: 'border-box',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      lineHeight: '1.2'
    } as any;

    if (isSpecial) {
      // 特殊按钮（Run, Test）
      const isTestButton = text.includes('Test');
      const bgColor = isTestButton ? '#FF6B35' : '#4CAF50';
      const hoverColor = isTestButton ? '#E55A2B' : '#45a049';
      
      Object.assign(button.style, {
        ...baseStyles,
        background: bgColor,
        borderColor: hoverColor,
        fontWeight: '500',
        justifyContent: 'center'
      });

      button.addEventListener('mouseenter', () => {
        button.style.background = hoverColor;
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = bgColor;
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
      });
    } else {
      // 普通按钮
      Object.assign(button.style, {
        ...baseStyles,
        background: '#3a3a3a'
      });

      button.addEventListener('mouseenter', () => {
        button.style.background = '#454545';
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = '#3a3a3a';
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
      });
    }

    return button;
  }

  private createNodeButtons(nodeTypes: string[]): void {
    // Create nodes card
    const nodesCard = new Card({
      id: 'nodes-card',
      title: 'Nodes',
      className: 'nodes-section'
    });

    // 为边栏布局设置卡片样式
    const cardElement = nodesCard.getElement();
    cardElement.style.flex = '0 0 auto';
    cardElement.style.width = '100%';

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    Object.assign(buttonsContainer.style, {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    });

    nodeTypes.forEach(nodeType => {
      // Don't create buttons for Start and End nodes as they are added by default
      if (nodeType === 'Start' || nodeType === 'End') {
        return;
      }

      const button = this.createUniformButton(
        `+ ${nodeType}`,
        () => this.onAddNode(nodeType),
        'node-add-button'
      );

      buttonsContainer.appendChild(button);
    });

    nodesCard.setContent(buttonsContainer);
    this.rootCard.addChild(nodesCard);
  }

  private createWorkflowButtons(): void {
    // Create workflow card
    const workflowCard = new Card({
      id: 'workflow-card',
      title: 'Workflow',
      className: 'workflow-section'
    });

    // 为边栏布局设置卡片样式
    const cardElement = workflowCard.getElement();
    cardElement.style.flex = '0 0 auto';
    cardElement.style.width = '100%';

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    Object.assign(buttonsContainer.style, {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    });

    const buttons = [
      { text: 'Save', action: this.onSave, className: 'save-button' },
      { text: 'Load', action: this.createLoadAction(), className: 'load-button' },
      { text: 'Reset', action: this.createResetAction(), className: 'reset-button' },
      { text: 'Auto Layout', action: this.createAutoLayoutAction(), className: 'auto-layout-button' },
      { text: 'Undo', action: () => commandHistory.undo(), className: 'undo-button' },
      { text: 'Redo', action: () => commandHistory.redo(), className: 'redo-button' },
      { text: 'Test Workflow', action: this.createTestAction(), className: 'test-button', special: true },
      { text: 'Run', action: this.onRun, className: 'run-button', special: true }
    ];

    buttons.forEach(({ text, action, className, special }) => {
      const button = this.createUniformButton(text, action, className, special);
      buttonsContainer.appendChild(button);
    });

    workflowCard.setContent(buttonsContainer);
    this.rootCard.addChild(workflowCard);
  }

  private createSystemButtons(): void {
    // Create system card
    const systemCard = new Card({
      id: 'system-card',
      title: 'System',
      className: 'system-section'
    });

    // 为边栏布局设置卡片样式
    const cardElement = systemCard.getElement();
    cardElement.style.flex = '0 0 auto';
    cardElement.style.width = '100%';

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    Object.assign(buttonsContainer.style, {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    });

    const buttons = [
      { text: 'Clear Console', action: () => console.clear(), className: 'clear-console-button' },
      { text: 'Export PNG', action: this.createExportPNGAction(), className: 'export-png-button' },
      { text: 'Export SVG', action: this.createExportSVGAction(), className: 'export-svg-button' },
      { text: 'Full Screen', action: this.createFullScreenAction(), className: 'fullscreen-button' },
      { text: 'Settings', action: this.createSettingsAction(), className: 'settings-button' },
      { text: 'Help', action: this.createHelpAction(), className: 'help-button' }
    ];

    buttons.forEach(({ text, action, className }) => {
      const button = this.createUniformButton(text, action, className);
      buttonsContainer.appendChild(button);
    });

    systemCard.setContent(buttonsContainer);
    this.rootCard.addChild(systemCard);
  }

  private createExportPNGAction() {
    return () => {
      if (!this.canvasEditor) {
        alert('Canvas editor not available');
        return;
      }
      
      try {
        // 获取canvas元素
        const canvas = document.querySelector('canvas');
        if (!canvas) {
          alert('Canvas not found');
          return;
        }

        // 创建下载链接
        const link = document.createElement('a');
        link.download = `workflow_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        console.log('✅ PNG exported successfully');
      } catch (error) {
        console.error('PNG export failed:', error);
        alert('PNG export failed');
      }
    };
  }

  private createExportSVGAction() {
    return () => {
      alert('SVG export feature coming soon!');
    };
  }

  private createFullScreenAction() {
    return () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err);
        });
      } else {
        document.exitFullscreen();
      }
    };
  }

  private createSettingsAction() {
    return () => {
      // 创建简单的设置对话框
      const settings = prompt(`Current Settings:
- Auto save: enabled
- Grid size: 20px
- Snap to grid: enabled

Enter new grid size (current: 20):`, '20');
      
      if (settings && !isNaN(Number(settings))) {
        console.log(`Grid size updated to: ${settings}px`);
        // 这里可以应用设置到canvas编辑器
      }
    };
  }

  private createHelpAction() {
    return () => {
      alert(`Web Automation Orchestrator Help:

🎯 Add Nodes: Use the Nodes panel to add workflow components
🔄 Workflow: Save, load, and manage your workflows  
⚙️ System: Export, settings, and utility functions

Keyboard Shortcuts:
- Ctrl+S: Save workflow
- Ctrl+O: Load workflow
- F11: Full screen
- Delete: Remove selected node

For more help, check the console for detailed logs.`);
    };
  }

  private createLoadAction() {
    return () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target?.result as string);
              this.onLoad(data);
            } catch (error) {
              console.error('Error parsing JSON file:', error);
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    };
  }

  private createResetAction() {
    return () => {
      if (confirm('This will clear the current workflow and create a new default test workflow. Continue?')) {
        // 清除当前工作流
        localStorage.removeItem('canvas-editor-state');
        // 重新加载页面以创建默认工作流
        window.location.reload();
      }
    };
  }

  private createAutoLayoutAction() {
    return () => {
      if (!this.canvasEditor) {
        console.error('Canvas editor reference not available');
        alert('Cannot auto layout - editor not available');
        return;
      }

      console.log('Starting auto layout...');
      
      try {
        // 执行自动排版
        this.canvasEditor.autoLayoutNodes();
        
        // 显示成功消息
        console.log('✅ Auto layout completed!');
        
      } catch (error) {
        console.error('Auto layout failed:', error);
        alert(`❌ Auto layout failed: ${error.message}`);
      }
    };
  }

  private createTestAction() {
    return async () => {
      if (!this.canvasEditor) {
        console.error('Canvas editor reference not available');
        alert('Cannot run test - editor not available');
        return;
      }

      console.log('Starting workflow test...');
      
      try {
        // 显示测试开始消息
        const testButton = document.querySelector('.test-button') as HTMLButtonElement;
        const originalText = testButton?.textContent;
        
        if (testButton) {
          testButton.textContent = 'Testing...';
          testButton.disabled = true;
        }

        // 执行测试
        await this.canvasEditor.testWorkflowExecution();
        
        // 显示成功消息
        alert('✅ Workflow test completed successfully! Check console for detailed results.');
        
      } catch (error) {
        console.error('Workflow test failed:', error);
        alert(`❌ Workflow test failed: ${error.message}\nCheck console for details.`);
        
      } finally {
        // 恢复按钮状态
        const testButton = document.querySelector('.test-button') as HTMLButtonElement;
        if (testButton) {
          testButton.textContent = 'Test Workflow';
          testButton.disabled = false;
        }
      }
    };
  }

  /**
   * 初始化自动排版系统
   */
  private initializeAutoLayout(): void {
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.adjustPanelLayout();
    });

    // 监听页面内容变化，防止与其他元素重叠
    const observer = new MutationObserver(() => {
      this.checkAndAvoidOverlaps();
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // 初始排版
    this.adjustPanelLayout();
  }

  /**
   * 调整面板布局，确保边栏完全可见（左侧边栏布局）
   */
  private adjustPanelLayout(): void {
    const rootElement = this.rootCard.getElement();
    const viewportHeight = window.innerHeight;
    
    // 边栏固定在左侧，只需要调整高度
    rootElement.style.height = `${viewportHeight}px`;
    
    // 确保边栏内容不会超出视口
    this.ensurePanelVisibility();
  }

  /**
   * 确保边栏内容完全可见
   */
  private ensurePanelVisibility(): void {
    const rootElement = this.rootCard.getElement();
    
    // 边栏位置固定，只需要确保滚动条正常工作
    // 如果内容超出高度，scrollbar会自动出现
    
    // 为页面主体内容添加左边距，避免被边栏遮挡
    this.adjustBodyMargin();
  }

  /**
   * 为页面主体内容添加左边距，避免被边栏遮挡
   */
  private adjustBodyMargin(): void {
    const bodyStyle = document.body.style;
    bodyStyle.marginLeft = '180px'; // 边栏宽度
    bodyStyle.transition = 'margin-left 0.3s ease';
  }

  /**
   * 检查并避免与其他页面元素重叠（边栏布局下无需重复检查）
   */
  private checkAndAvoidOverlaps(): void {
    // 边栏位置固定，通过adjustBodyMargin()来避免重叠
    // 无需频繁检查重叠，只需要确保body有正确的左边距
    this.adjustBodyMargin();
  }

  /**
   * 检查两个矩形是否重叠
   */
  private isOverlapping(rect1: DOMRect, rect2: DOMRect): boolean {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
  }

  /**
   * 边栏布局下无需寻找最佳位置（位置固定）
   */
  private findBestPosition(): void {
    // 边栏位置固定在左侧，无需动态调整位置
    // 只需要确保body有正确的边距即可
    this.adjustBodyMargin();
  }

}
