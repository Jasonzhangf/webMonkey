/**
 * Workflow Storage Example - 工作流存储系统使用示例
 * 展示如何使用工作流存储和管理功能
 */

import { WorkflowStorageService } from '../services/WorkflowStorageService';
import { getWorkflowManager } from '../ui/WorkflowManager';

export class WorkflowStorageExample {
  private storageService: WorkflowStorageService;
  
  constructor() {
    this.storageService = WorkflowStorageService.getInstance();
    this.setupExample();
  }
  
  private setupExample(): void {
    // 在窗口对象上添加示例函数，便于在控制台调用
    (window as any).workflowExample = {
      // 保存当前工作流
      saveCurrentWorkflow: async () => {
        try {
          const path = await this.storageService.saveWorkflow();
          console.log(`✅ Workflow saved to: ${path}`);
        } catch (error) {
          console.error('❌ Save failed:', error);
        }
      },
      
      // 快速保存
      quickSave: async () => {
        try {
          const path = await this.storageService.quickSave();
          console.log(`⚡ Quick save completed: ${path}`);
        } catch (error) {
          console.error('❌ Quick save failed:', error);
        }
      },
      
      // 另存为新文件
      saveAsNew: async (filename: string) => {
        try {
          const path = await this.storageService.saveAsNew(`${filename}.wflow.json`);
          console.log(`📝 Saved as new file: ${path}`);
        } catch (error) {
          console.error('❌ Save as failed:', error);
        }
      },
      
      // 列出所有工作流
      listWorkflows: async () => {
        try {
          const workflows = await this.storageService.getWorkflowList();
          console.log('📋 Available workflows:');
          workflows.forEach((workflow, index) => {
            console.log(`${index + 1}. ${workflow.metadata.name}`);
            console.log(`   File: ${workflow.filename}`);
            console.log(`   Updated: ${workflow.metadata.updatedAt}`);
            console.log(`   Size: ${workflow.size} bytes`);
            console.log('');
          });
        } catch (error) {
          console.error('❌ List failed:', error);
        }
      },
      
      // 加载指定工作流
      loadWorkflow: async (filename: string) => {
        try {
          await this.storageService.loadWorkflow(filename);
          console.log(`📂 Workflow loaded: ${filename}`);
        } catch (error) {
          console.error('❌ Load failed:', error);
        }
      },
      
      // 删除工作流
      deleteWorkflow: async (filename: string) => {
        try {
          await this.storageService.deleteWorkflow(filename);
          console.log(`🗑️ Workflow deleted: ${filename}`);
        } catch (error) {
          console.error('❌ Delete failed:', error);
        }
      },
      
      // 创建新工作流
      createNew: async () => {
        try {
          await this.storageService.createNew();
          console.log('📄 New workflow created');
        } catch (error) {
          console.error('❌ Create failed:', error);
        }
      },
      
      // 启用自动保存
      enableAutoSave: (intervalMinutes: number = 5) => {
        this.storageService.setAutoSave(true, intervalMinutes);
        console.log(`⏰ Auto-save enabled (${intervalMinutes} minutes)`);
      },
      
      // 禁用自动保存
      disableAutoSave: () => {
        this.storageService.setAutoSave(false);
        console.log('⏰ Auto-save disabled');
      },
      
      // 获取当前状态
      getCurrentState: () => {
        const state = this.storageService.getCurrentState();
        console.log('📊 Current state:', state);
        return state;
      },
      
      // 显示工作流管理器
      showManager: () => {
        getWorkflowManager().show();
        console.log('🗂️ Workflow manager opened');
      },
      
      // 隐藏工作流管理器
      hideManager: () => {
        getWorkflowManager().hide();
        console.log('🗂️ Workflow manager closed');
      }
    };
    
    // 输出使用说明
    console.log(`
🎯 Workflow Storage System Example

Available commands:
- workflowExample.saveCurrentWorkflow()     // 保存当前工作流
- workflowExample.quickSave()               // 快速保存
- workflowExample.saveAsNew('name')         // 另存为新文件
- workflowExample.listWorkflows()           // 列出所有工作流
- workflowExample.loadWorkflow('file.wflow.json')  // 加载工作流
- workflowExample.deleteWorkflow('file.wflow.json') // 删除工作流
- workflowExample.createNew()               // 创建新工作流
- workflowExample.enableAutoSave(5)         // 启用自动保存(5分钟)
- workflowExample.disableAutoSave()         // 禁用自动保存
- workflowExample.getCurrentState()         // 获取当前状态
- workflowExample.showManager()             // 显示管理器
- workflowExample.hideManager()             // 隐藏管理器

🔑 Keyboard shortcuts:
- Ctrl+S / Cmd+S: Quick save
- Ctrl+Shift+S: Save as
- Ctrl+O / Cmd+O: Open workflow
- Ctrl+Shift+N: New workflow

🎮 Try these commands in the browser console!
    `);
  }
}

// 自动初始化示例
if (typeof window !== 'undefined') {
  new WorkflowStorageExample();
}