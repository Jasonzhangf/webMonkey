/**
 * Workflow Manager - 工作流管理面板
 * 职责：提供工作流列表、删除、重命名、导入导出等管理功能
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

import { Card } from '../components/Card';
import { WorkflowStorageService } from '../services/WorkflowStorageService';
import { WorkflowFile } from '../storage/WorkflowFileManager';

export class WorkflowManager {
  private container: HTMLElement;
  private storageService: WorkflowStorageService;
  private managerCard: Card;
  private workflowListContainer: HTMLElement;
  private isVisible: boolean = false;
  
  constructor() {
    this.storageService = WorkflowStorageService.getInstance();
    this.container = this.createManagerContainer();
    this.managerCard = new Card({
      id: 'workflow-manager',
      title: 'Workflow Manager',
      className: 'workflow-manager-card',
      bordered: true,
      centered: true
    });
    
    this.createManagerUI();
    this.setupEventListeners();
    
    // 添加到页面
    document.body.appendChild(this.container);
  }
  
  public show(): void {
    this.isVisible = true;
    this.container.style.display = 'flex';
    this.refreshWorkflowList();
  }
  
  public hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
  }
  
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  private createManagerContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'workflow-manager-overlay';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
    `;
    
    return container;
  }
  
  private createManagerUI(): void {
    // 设置管理器卡片样式
    this.managerCard.getElement().style.cssText += `
      width: 700px;
      max-height: 600px;
      overflow: hidden;
      background: #2d2d2d;
    `;
    
    // 创建头部工具栏
    const headerToolbar = this.createHeaderToolbar();
    this.managerCard.appendContent(headerToolbar);
    
    // 创建工作流列表容器
    this.workflowListContainer = this.createWorkflowListContainer();
    this.managerCard.appendContent(this.workflowListContainer);
    
    // 创建底部按钮栏
    const footerButtons = this.createFooterButtons();
    this.managerCard.appendContent(footerButtons);
    
    this.container.appendChild(this.managerCard.getElement());
  }
  
  private createHeaderToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'workflow-manager-toolbar';
    toolbar.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      padding: 8px;
      background: #333333;
      border-radius: 6px;
    `;
    
    // 刷新按钮
    const refreshButton = this.createButton('Refresh', '🔄', () => {
      this.refreshWorkflowList();
    });
    
    // 导入按钮
    const importButton = this.createButton('Import', '📥', () => {
      this.handleImport();
    });
    
    // 新建按钮
    const newButton = this.createButton('New', '📄', async () => {
      await this.handleNewWorkflow();
    });
    
    toolbar.appendChild(refreshButton);
    toolbar.appendChild(importButton);
    toolbar.appendChild(newButton);
    
    return toolbar;
  }
  
  private createWorkflowListContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'workflow-list-container';
    container.style.cssText = `
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 12px;
      border: 1px solid #404040;
      border-radius: 6px;
      background: #333333;
    `;
    
    return container;
  }
  
  private createFooterButtons(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'workflow-manager-footer';
    footer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #404040;
    `;
    
    const closeButton = this.createButton('Close', '✖️', () => {
      this.hide();
    });
    
    footer.appendChild(closeButton);
    
    return footer;
  }
  
  private createButton(text: string, icon: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.textContent = `${icon} ${text}`;
    button.style.cssText = `
      padding: 6px 12px;
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
  
  private async refreshWorkflowList(): Promise<void> {
    try {
      const workflows = await this.storageService.getWorkflowList();
      this.renderWorkflowList(workflows);
    } catch (error) {
      console.error('Failed to refresh workflow list:', error);
      this.showError('Failed to load workflow list');
    }
  }
  
  private renderWorkflowList(workflows: WorkflowFile[]): void {
    this.workflowListContainer.innerHTML = '';
    
    if (workflows.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No workflows found';
      emptyMessage.style.cssText = `
        text-align: center;
        color: #cccccc;
        padding: 40px;
        font-style: italic;
      `;
      this.workflowListContainer.appendChild(emptyMessage);
      return;
    }
    
    workflows.forEach(workflow => {
      const workflowItem = this.createWorkflowItem(workflow);
      this.workflowListContainer.appendChild(workflowItem);
    });
  }
  
  private createWorkflowItem(workflow: WorkflowFile): HTMLElement {
    const item = document.createElement('div');
    item.className = 'workflow-item';
    item.style.cssText = `
      display: flex;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #404040;
      background: #2d2d2d;
      transition: background 0.2s ease;
    `;
    
    // 工作流信息
    const info = document.createElement('div');
    info.className = 'workflow-info';
    info.style.cssText = `
      flex: 1;
      cursor: pointer;
    `;
    
    info.innerHTML = `
      <div style="font-weight: bold; color: #ffffff; margin-bottom: 4px;">
        ${workflow.metadata.name}
      </div>
      <div style="font-size: 11px; color: #cccccc; margin-bottom: 2px;">
        ${workflow.metadata.description || 'No description'}
      </div>
      <div style="font-size: 10px; color: #999999;">
        Updated: ${new Date(workflow.metadata.updatedAt).toLocaleString()} | 
        Size: ${this.formatFileSize(workflow.size)}
      </div>
    `;
    
    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'workflow-actions';
    actions.style.cssText = `
      display: flex;
      gap: 4px;
    `;
    
    // 加载按钮
    const loadButton = this.createSmallButton('📂', 'Load', async () => {
      try {
        await this.storageService.loadWorkflow(workflow.filename);
        this.hide();
        this.showSuccess(`Loaded: ${workflow.metadata.name}`);
      } catch (error) {
        this.showError('Failed to load workflow');
      }
    });
    
    // 导出按钮
    const exportButton = this.createSmallButton('📤', 'Export', () => {
      this.handleExport(workflow);
    });
    
    // 删除按钮
    const deleteButton = this.createSmallButton('🗑️', 'Delete', async () => {
      if (confirm(`Are you sure you want to delete "${workflow.metadata.name}"?`)) {
        try {
          await this.storageService.deleteWorkflow(workflow.filename);
          this.refreshWorkflowList();
          this.showSuccess(`Deleted: ${workflow.metadata.name}`);
        } catch (error) {
          this.showError('Failed to delete workflow');
        }
      }
    });
    
    actions.appendChild(loadButton);
    actions.appendChild(exportButton);
    actions.appendChild(deleteButton);
    
    // 点击信息区域加载工作流
    info.addEventListener('click', async () => {
      try {
        await this.storageService.loadWorkflow(workflow.filename);
        this.hide();
        this.showSuccess(`Loaded: ${workflow.metadata.name}`);
      } catch (error) {
        this.showError('Failed to load workflow');
      }
    });
    
    // 悬停效果
    item.addEventListener('mouseenter', () => {
      item.style.background = '#3a3a3a';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.background = '#2d2d2d';
    });
    
    item.appendChild(info);
    item.appendChild(actions);
    
    return item;
  }
  
  private createSmallButton(icon: string, tooltip: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.textContent = icon;
    button.title = tooltip;
    button.style.cssText = `
      width: 24px;
      height: 24px;
      padding: 0;
      background: #404040;
      border: 1px solid #606060;
      border-radius: 4px;
      color: #ffffff;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
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
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    
    return button;
  }
  
  private setupEventListeners(): void {
    // 点击外部关闭
    this.container.addEventListener('click', (event) => {
      if (event.target === this.container) {
        this.hide();
      }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
    
    // 监听工作流事件
    window.addEventListener('workflow:workflowSaved', () => {
      if (this.isVisible) {
        this.refreshWorkflowList();
      }
    });
    
    window.addEventListener('workflow:workflowDeleted', () => {
      if (this.isVisible) {
        this.refreshWorkflowList();
      }
    });
  }
  
  private async handleNewWorkflow(): Promise<void> {
    try {
      await this.storageService.createNew();
      this.hide();
      this.showSuccess('New workflow created');
    } catch (error) {
      this.showError('Failed to create new workflow');
    }
  }
  
  private handleImport(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.wflow.json';
    
    input.addEventListener('change', async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const content = await file.text();
          
          // 这里应该调用导入API
          const response = await fetch('/api/workflow/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, filePath: '' })
          });
          
          if (response.ok) {
            this.refreshWorkflowList();
            this.showSuccess(`Imported: ${file.name}`);
          } else {
            throw new Error('Import failed');
          }
        } catch (error) {
          this.showError('Failed to import workflow');
        }
      }
    });
    
    input.click();
  }
  
  private async handleExport(workflow: WorkflowFile): Promise<void> {
    try {
      const response = await fetch('/api/workflow/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: workflow.path })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // 下载文件
        const blob = new Blob([result.content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = workflow.filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showSuccess(`Exported: ${workflow.metadata.name}`);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      this.showError('Failed to export workflow');
    }
  }
  
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
  
  private showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }
  
  private showError(message: string): void {
    this.showNotification(message, 'error');
  }
  
  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#F44336'};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10002;
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

// 延迟创建全局工作流管理器实例
let _workflowManager: WorkflowManager | null = null;

export function getWorkflowManager(): WorkflowManager {
  if (!_workflowManager) {
    _workflowManager = new WorkflowManager();
  }
  return _workflowManager;
}

// 兼容性导出，但延迟初始化
export const workflowManager = new Proxy({} as WorkflowManager, {
  get(target, prop, receiver) {
    return Reflect.get(getWorkflowManager(), prop, receiver);
  },
  set(target, prop, value, receiver) {
    return Reflect.set(getWorkflowManager(), prop, value, receiver);
  }
});