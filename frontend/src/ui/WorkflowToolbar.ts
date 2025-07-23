/**
 * Workflow Toolbar - 工作流工具栏
 * 职责：提供工作流保存、加载、管理的UI界面，包含快捷操作按钮
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

import { Card } from '../components/Card';
import { WorkflowStorageService } from '../services/WorkflowStorageService';
import { WorkflowFile } from '../storage/WorkflowFileManager';
import { getWorkflowManager } from './WorkflowManager';

export class WorkflowToolbar {
  private container: HTMLElement;
  private storageService: WorkflowStorageService;
  private toolbarCard: Card;
  private currentWorkflowDisplay: HTMLElement;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.storageService = WorkflowStorageService.getInstance();
    this.toolbarCard = new Card({
      id: 'workflow-toolbar',
      title: 'Workflow',
      className: 'workflow-toolbar-card',
      bordered: true,
      centered: true
    });
    
    this.createToolbar();
    this.setupEventListeners();
  }
  
  private createToolbar(): void {
    // 当前工作流显示
    this.currentWorkflowDisplay = this.createCurrentWorkflowDisplay();
    this.toolbarCard.appendContent(this.currentWorkflowDisplay);
    
    // 文件操作按钮组
    const fileActionsCard = this.createFileActionsCard();
    this.toolbarCard.appendContent(fileActionsCard.getElement());
    
    // 快捷操作按钮组
    const quickActionsCard = this.createQuickActionsCard();
    this.toolbarCard.appendContent(quickActionsCard.getElement());
    
    // 将工具栏添加到容器
    this.container.appendChild(this.toolbarCard.getElement());
    
    this.updateCurrentWorkflowDisplay();
  }
  
  private createCurrentWorkflowDisplay(): HTMLElement {
    const display = document.createElement('div');
    display.className = 'current-workflow-display';
    display.style.cssText = `
      padding: 8px 12px;
      background: #333333;
      border: 1px solid #505050;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 12px;
      color: #cccccc;
      text-align: center;
    `;
    
    return display;
  }
  
  private createFileActionsCard(): Card {
    const fileActionsCard = new Card({
      id: 'file-actions',
      title: 'File',
      className: 'file-actions-card',
      bordered: true
    });
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
    
    // 新建工作流按钮
    const newButton = this.createButton('New', '📄', async () => {
      await this.handleNewWorkflow();
    });
    
    // 打开工作流按钮
    const openButton = this.createButton('Open', '📂', () => {
      this.showWorkflowSelector();
    });
    
    // 保存按钮
    const saveButton = this.createButton('Save', '💾', async () => {
      await this.handleSave();
    });
    
    // 另存为按钮
    const saveAsButton = this.createButton('Save As', '📝', () => {
      this.showSaveAsDialog();
    });
    
    buttonsContainer.appendChild(newButton);
    buttonsContainer.appendChild(openButton);
    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(saveAsButton);
    
    fileActionsCard.setContent(buttonsContainer);
    return fileActionsCard;
  }
  
  private createQuickActionsCard(): Card {
    const quickActionsCard = new Card({
      id: 'quick-actions',
      title: 'Quick Actions',
      className: 'quick-actions-card',
      bordered: true
    });
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
    
    // 快速保存按钮
    const quickSaveButton = this.createButton('Quick Save', '⚡', async () => {
      await this.handleQuickSave();
    });
    
    // 管理工作流按钮
    const manageButton = this.createButton('Manage', '🗂️', () => {
      this.showWorkflowManager();
    });
    
    // 自动保存切换按钮
    const autoSaveButton = this.createToggleButton('Auto Save', '⏰', false, (enabled) => {
      this.storageService.setAutoSave(enabled);
    });
    
    buttonsContainer.appendChild(quickSaveButton);
    buttonsContainer.appendChild(manageButton);
    buttonsContainer.appendChild(autoSaveButton);
    
    quickActionsCard.setContent(buttonsContainer);
    return quickActionsCard;
  }
  
  private createButton(text: string, icon: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.textContent = `${icon} ${text}`;
    button.className = 'workflow-toolbar-button';
    button.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: #404040;
      border: 1px solid #606060;
      border-radius: 4px;
      color: #ffffff;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = '#505050';
      button.style.borderColor = '#FFC107';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = '#404040';
      button.style.borderColor = '#606060';
    });
    
    button.addEventListener('click', onClick);
    
    return button;
  }
  
  private createToggleButton(text: string, icon: string, initialState: boolean, onChange: (enabled: boolean) => void): HTMLElement {
    const button = document.createElement('button');
    let isEnabled = initialState;
    
    const updateButton = () => {
      button.textContent = `${icon} ${text}`;
      button.style.background = isEnabled ? '#FFC107' : '#404040';
      button.style.color = isEnabled ? '#000000' : '#ffffff';
    };
    
    button.className = 'workflow-toolbar-toggle-button';
    button.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #606060;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    updateButton();
    
    button.addEventListener('click', () => {
      isEnabled = !isEnabled;
      updateButton();
      onChange(isEnabled);
    });
    
    return button;
  }
  
  private updateCurrentWorkflowDisplay(): void {
    const state = this.storageService.getCurrentState();
    
    if (state.currentFile) {
      const filename = state.currentFile.replace('.wflow.json', '');
      const status = state.hasUnsavedChanges ? '●' : '';
      this.currentWorkflowDisplay.textContent = `${status} ${filename}`;
      this.currentWorkflowDisplay.style.color = state.hasUnsavedChanges ? '#FFC107' : '#cccccc';
    } else {
      this.currentWorkflowDisplay.textContent = 'Untitled Workflow';
      this.currentWorkflowDisplay.style.color = '#cccccc';
    }
  }
  
  private setupEventListeners(): void {
    // 监听工作流状态变化
    window.addEventListener('workflow:workflowSaved', () => {
      this.updateCurrentWorkflowDisplay();
      this.showNotification('Workflow saved successfully', 'success');
    });
    
    window.addEventListener('workflow:workflowLoaded', (event: any) => {
      this.updateCurrentWorkflowDisplay();
      this.showNotification(`Workflow loaded: ${event.detail.filename}`, 'success');
    });
    
    window.addEventListener('workflow:workflowChanged', () => {
      this.updateCurrentWorkflowDisplay();
    });
    
    window.addEventListener('workflow:workflowSaveError', (event: any) => {
      this.showNotification(`Save failed: ${event.detail.error.message}`, 'error');
    });
    
    window.addEventListener('workflow:workflowLoadError', (event: any) => {
      this.showNotification(`Load failed: ${event.detail.error.message}`, 'error');
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            if (event.shiftKey) {
              this.showSaveAsDialog();
            } else {
              this.handleQuickSave();
            }
            break;
          case 'o':
            event.preventDefault();
            this.showWorkflowSelector();
            break;
          case 'n':
            if (event.shiftKey) {
              event.preventDefault();
              this.handleNewWorkflow();
            }
            break;
        }
      }
    });
  }
  
  private async handleNewWorkflow(): Promise<void> {
    try {
      await this.storageService.createNew();
    } catch (error) {
      console.error('Failed to create new workflow:', error);
      this.showNotification('Failed to create new workflow', 'error');
    }
  }
  
  private async handleSave(): Promise<void> {
    try {
      await this.storageService.saveWorkflow();
    } catch (error) {
      console.error('Failed to save workflow:', error);
      this.showNotification('Failed to save workflow', 'error');
    }
  }
  
  private async handleQuickSave(): Promise<void> {
    try {
      await this.storageService.quickSave();
    } catch (error) {
      console.error('Failed to quick save workflow:', error);
      this.showNotification('Failed to save workflow', 'error');
    }
  }
  
  private showWorkflowSelector(): void {
    // 创建工作流选择对话框
    const dialog = this.createWorkflowSelectorDialog();
    document.body.appendChild(dialog);
  }
  
  private showSaveAsDialog(): void {
    const filename = prompt('Enter workflow name:');
    if (filename) {
      this.storageService.saveAsNew(`${filename}.wflow.json`).catch(error => {
        this.showNotification('Failed to save workflow', 'error');
      });
    }
  }
  
  private showWorkflowManager(): void {
    // 显示工作流管理器
    getWorkflowManager().show();
  }
  
  private createWorkflowSelectorDialog(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 20px;
      width: 500px;
      max-height: 400px;
      overflow-y: auto;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Open Workflow';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #ffffff;
    `;
    
    dialog.appendChild(title);
    
    // 加载工作流列表
    this.storageService.getWorkflowList().then(files => {
      const list = this.createWorkflowList(files, (filename) => {
        this.storageService.loadWorkflow(filename).catch(error => {
          this.showNotification('Failed to load workflow', 'error');
        });
        overlay.remove();
      });
      dialog.appendChild(list);
    }).catch(error => {
      dialog.appendChild(document.createTextNode('Failed to load workflow list'));
    });
    
    // 关闭按钮
    const closeButton = this.createButton('Close', '✖️', () => {
      overlay.remove();
    });
    dialog.appendChild(closeButton);
    
    overlay.appendChild(dialog);
    
    // 点击外部关闭
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.remove();
      }
    });
    
    return overlay;
  }
  
  private createWorkflowManagerDialog(): HTMLElement {
    // 类似工作流选择对话框，但包含管理功能（删除、重命名等）
    const overlay = this.createWorkflowSelectorDialog();
    // 添加管理功能...
    return overlay;
  }
  
  private createWorkflowList(files: WorkflowFile[], onSelect: (filename: string) => void): HTMLElement {
    const list = document.createElement('div');
    list.style.cssText = `
      max-height: 250px;
      overflow-y: auto;
      margin-bottom: 16px;
    `;
    
    if (files.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No workflows found';
      emptyMessage.style.cssText = `
        text-align: center;
        color: #cccccc;
        padding: 20px;
      `;
      list.appendChild(emptyMessage);
      return list;
    }
    
    files.forEach(file => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 8px 12px;
        border: 1px solid #404040;
        border-radius: 4px;
        margin-bottom: 4px;
        cursor: pointer;
        color: #ffffff;
        background: #333333;
        transition: background 0.2s ease;
      `;
      
      item.innerHTML = `
        <div style="font-weight: bold;">${file.metadata.name}</div>
        <div style="font-size: 11px; color: #cccccc;">
          Updated: ${new Date(file.metadata.updatedAt).toLocaleDateString()}
        </div>
      `;
      
      item.addEventListener('mouseenter', () => {
        item.style.background = '#404040';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.background = '#333333';
      });
      
      item.addEventListener('click', () => {
        onSelect(file.filename);
      });
      
      list.appendChild(item);
    });
    
    return list;
  }
  
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    const colors = {
      success: '#4CAF50',
      error: '#F44336',
      info: '#2196F3'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: opacity 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}