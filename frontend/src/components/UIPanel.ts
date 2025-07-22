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

    // Apply positioning to root card
    const rootElement = this.rootCard.getElement();
    rootElement.style.position = 'absolute';
    rootElement.style.top = '15px';
    rootElement.style.left = '15px';
    rootElement.style.zIndex = '100';
    rootElement.style.minWidth = '200px';

    document.body.appendChild(rootElement);

    this.createNodeButtons(nodeTypes);
    this.createWorkflowButtons();
  }

  private createNodeButtons(nodeTypes: string[]): void {
    // Create nodes card
    const nodesCard = new Card({
      id: 'nodes-card',
      title: 'Nodes',
      className: 'nodes-section'
    });

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    Object.assign(buttonsContainer.style, {
      width: '100%',
      minWidth: '180px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    });

    nodeTypes.forEach(nodeType => {
      // Don't create buttons for Start and End nodes as they are added by default
      if (nodeType === 'Start' || nodeType === 'End') {
        return;
      }

      const button = document.createElement('button');
      button.textContent = `Add ${nodeType}`;
      button.className = 'node-add-button';
      button.addEventListener('click', () => {
        this.onAddNode(nodeType);
      });

      // Apply button styles with full width
      Object.assign(button.style, {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #505050',
        background: '#3a3a3a',
        color: '#ffffff',
        cursor: 'pointer',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        transition: 'all 0.2s',
        boxSizing: 'border-box'
      });

      button.addEventListener('mouseenter', () => {
        button.style.background = '#454545';
        button.style.transform = 'translateY(-1px)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = '#3a3a3a';
        button.style.transform = 'translateY(0)';
      });

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

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    Object.assign(buttonsContainer.style, {
      width: '100%',
      minWidth: '180px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    });

    const buttons = [
      { text: 'Save', action: this.onSave, className: 'save-button' },
      { text: 'Load', action: this.createLoadAction(), className: 'load-button' },
      { text: 'Reset Workflow', action: this.createResetAction(), className: 'reset-button' },
      { text: 'Auto Layout', action: this.createAutoLayoutAction(), className: 'auto-layout-button' },
      { text: 'Test Workflow', action: this.createTestAction(), className: 'test-button', special: true },
      { text: 'Undo', action: () => commandHistory.undo(), className: 'undo-button' },
      { text: 'Redo', action: () => commandHistory.redo(), className: 'redo-button' },
      { text: 'Run', action: this.onRun, className: 'run-button', special: true }
    ];

    buttons.forEach(({ text, action, className, special }) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.className = className;
      button.addEventListener('click', action);

      // Apply button styles with full width
      const baseStyles = {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #505050',
        color: '#ffffff',
        cursor: 'pointer',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        transition: 'all 0.2s',
        boxSizing: 'border-box'
      };

      if (special) {
        // 区分不同的特殊按钮颜色
        const isTestButton = text === 'Test Workflow';
        const bgColor = isTestButton ? '#FF9800' : '#4CAF50';
        const hoverColor = isTestButton ? '#E68900' : '#45a049';
        
        Object.assign(button.style, {
          ...baseStyles,
          background: bgColor,
          borderColor: hoverColor
        });

        button.addEventListener('mouseenter', () => {
          button.style.background = hoverColor;
          button.style.transform = 'translateY(-1px)';
        });

        button.addEventListener('mouseleave', () => {
          button.style.background = bgColor;
          button.style.transform = 'translateY(0)';
        });
      } else {
        Object.assign(button.style, {
          ...baseStyles,
          background: '#3a3a3a'
        });

        button.addEventListener('mouseenter', () => {
          button.style.background = '#454545';
          button.style.transform = 'translateY(-1px)';
        });

        button.addEventListener('mouseleave', () => {
          button.style.background = '#3a3a3a';
          button.style.transform = 'translateY(0)';
        });
      }

      buttonsContainer.appendChild(button);
    });

    workflowCard.setContent(buttonsContainer);
    this.rootCard.addChild(workflowCard);
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

}
