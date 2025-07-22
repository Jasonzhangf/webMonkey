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

  constructor(
    nodeTypes: string[],
    onAddNode: (nodeType: string) => void,
    onSave: () => void,
    onLoad: (data: any) => void,
    onRun: () => void
    ) {
    this.onAddNode = onAddNode;
    this.onSave = onSave;
    this.onLoad = onLoad;
    this.onRun = onRun;

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
        Object.assign(button.style, {
          ...baseStyles,
          background: '#4CAF50',
          borderColor: '#45a049'
        });

        button.addEventListener('mouseenter', () => {
          button.style.background = '#45a049';
          button.style.transform = 'translateY(-1px)';
        });

        button.addEventListener('mouseleave', () => {
          button.style.background = '#4CAF50';
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

  private applyStyles(): void {
    this.panelElement.style.position = 'fixed';
    this.panelElement.style.top = '20px';
    this.panelElement.style.left = '20px';
    this.panelElement.style.width = '200px';
    this.panelElement.style.padding = '10px';
    this.panelElement.style.background = 'white';
    this.panelElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    this.panelElement.style.borderRadius = '8px';
    this.panelElement.style.zIndex = '1000';
    this.panelElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    // Add styles for children
    const style = document.createElement('style');
    style.textContent = `
        #wao-ui-panel h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 16px;
            color: #333;
        }
        #wao-ui-panel button {
            display: block;
            width: 100%;
            padding: 8px 12px;
            margin-bottom: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f5f5f5;
            cursor: pointer;
            text-align: left;
            font-size: 14px;
        }
        #wao-ui-panel button:hover {
            background: #e8e8e8;
        }
        #run-workflow-btn {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
        }
        #run-workflow-btn:hover {
            background-color: #45a049;
        }
    `;
    document.head.appendChild(style);
  }
}
