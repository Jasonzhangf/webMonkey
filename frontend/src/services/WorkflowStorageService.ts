/**
 * Workflow Storage Service - 工作流存储服务
 * 职责：提供工作流保存、加载、管理的高级接口，处理UI交互和状态同步
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

import { WorkflowFileManager, WorkflowData, WorkflowFile, WorkflowMetadata } from '../storage/WorkflowFileManager';
import { editorState } from '../state/EditorState';
import { CanvasEditor } from '../canvas/CanvasEditor';

export interface SaveOptions {
  filename?: string;
  overwrite?: boolean;
  backup?: boolean;
}

export interface LoadOptions {
  clearCurrent?: boolean;
  validateData?: boolean;
  restoreCanvas?: boolean;
}

export class WorkflowStorageService {
  private static instance: WorkflowStorageService;
  private editor: CanvasEditor | null = null;
  private currentWorkflowFile: string | null = null;
  private hasUnsavedChanges: boolean = false;
  private autoSaveEnabled: boolean = false;
  private autoSaveInterval: number | null = null;
  
  private constructor() {
    this.setupChangeTracking();
  }
  
  public static getInstance(): WorkflowStorageService {
    if (!WorkflowStorageService.instance) {
      WorkflowStorageService.instance = new WorkflowStorageService();
    }
    return WorkflowStorageService.instance;
  }
  
  public setEditor(editor: CanvasEditor): void {
    this.editor = editor;
  }
  
  /**
   * 保存当前工作流
   */
  public async saveWorkflow(options: SaveOptions = {}): Promise<string> {
    try {
      const workflowData = this.prepareWorkflowData();
      
      // 如果有指定文件名或当前已有文件，使用指定的文件名
      let filename = options.filename;
      if (!filename && this.currentWorkflowFile && !options.overwrite) {
        filename = this.currentWorkflowFile;
      }
      
      // 创建备份
      if (options.backup && this.currentWorkflowFile) {
        await this.createBackup(this.currentWorkflowFile);
      }
      
      // 保存工作流
      const savedPath = await WorkflowFileManager.saveWorkflow(workflowData, filename);
      
      // 更新状态
      this.currentWorkflowFile = this.extractFilename(savedPath);
      this.hasUnsavedChanges = false;
      
      // 更新编辑器状态
      this.updateEditorState(workflowData.metadata);
      
      // 触发保存成功事件
      this.dispatchEvent('workflowSaved', {
        filename: this.currentWorkflowFile,
        path: savedPath,
        metadata: workflowData.metadata
      });
      
      console.log(`💾 Workflow saved successfully: ${this.currentWorkflowFile}`);
      return savedPath;
      
    } catch (error) {
      console.error('❌ Failed to save workflow:', error);
      this.dispatchEvent('workflowSaveError', { error });
      throw error;
    }
  }
  
  /**
   * 加载工作流
   */
  public async loadWorkflow(filename: string, options: LoadOptions = {}): Promise<void> {
    try {
      // 检查未保存的更改
      if (this.hasUnsavedChanges && options.clearCurrent !== false) {
        const shouldProceed = await this.confirmUnsavedChanges();
        if (!shouldProceed) {
          return;
        }
      }
      
      // 加载工作流数据
      const workflowData = await WorkflowFileManager.loadWorkflow(filename);
      
      // 验证数据
      if (options.validateData !== false) {
        this.validateWorkflowData(workflowData);
      }
      
      // 清空当前工作流
      if (options.clearCurrent !== false) {
        this.clearCurrentWorkflow();
      }
      
      // 应用工作流数据
      await this.applyWorkflowData(workflowData, options);
      
      // 更新状态
      this.currentWorkflowFile = filename;
      this.hasUnsavedChanges = false;
      
      // 触发加载成功事件
      this.dispatchEvent('workflowLoaded', {
        filename,
        metadata: workflowData.metadata,
        nodeCount: workflowData.nodes.length,
        connectionCount: workflowData.connections.length
      });
      
      console.log(`📂 Workflow loaded successfully: ${filename}`);
      
    } catch (error) {
      console.error('❌ Failed to load workflow:', error);
      this.dispatchEvent('workflowLoadError', { error, filename });
      throw error;
    }
  }
  
  /**
   * 获取工作流列表
   */
  public async getWorkflowList(): Promise<WorkflowFile[]> {
    try {
      return await WorkflowFileManager.getWorkflowList();
    } catch (error) {
      console.error('❌ Failed to get workflow list:', error);
      throw error;
    }
  }
  
  /**
   * 删除工作流
   */
  public async deleteWorkflow(filename: string): Promise<void> {
    try {
      await WorkflowFileManager.deleteWorkflow(filename);
      
      // 如果删除的是当前工作流，重置状态
      if (this.currentWorkflowFile === filename) {
        this.currentWorkflowFile = null;
        this.hasUnsavedChanges = false;
      }
      
      this.dispatchEvent('workflowDeleted', { filename });
      console.log(`🗑️ Workflow deleted: ${filename}`);
      
    } catch (error) {
      console.error('❌ Failed to delete workflow:', error);
      this.dispatchEvent('workflowDeleteError', { error, filename });
      throw error;
    }
  }
  
  /**
   * 快速保存
   */
  public async quickSave(): Promise<string> {
    if (this.currentWorkflowFile) {
      return await this.saveWorkflow({ overwrite: true });
    } else {
      return await this.saveAsNew();
    }
  }
  
  /**
   * 另存为新文件
   */
  public async saveAsNew(filename?: string): Promise<string> {
    return await this.saveWorkflow({ filename, overwrite: false });
  }
  
  /**
   * 创建新工作流
   */
  public async createNew(): Promise<void> {
    try {
      // 检查未保存的更改
      if (this.hasUnsavedChanges) {
        const shouldProceed = await this.confirmUnsavedChanges();
        if (!shouldProceed) {
          return;
        }
      }
      
      // 清空当前工作流
      this.clearCurrentWorkflow();
      
      // 重置状态
      this.currentWorkflowFile = null;
      this.hasUnsavedChanges = false;
      
      // 创建默认工作流
      if (this.editor) {
        await this.editor.createDefaultWorkflow();
      }
      
      this.dispatchEvent('workflowCreated', {});
      console.log('📄 New workflow created');
      
    } catch (error) {
      console.error('❌ Failed to create new workflow:', error);
      throw error;
    }
  }
  
  /**
   * 启用/禁用自动保存
   */
  public setAutoSave(enabled: boolean, intervalMinutes: number = 5): void {
    this.autoSaveEnabled = enabled;
    
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    
    if (enabled) {
      this.autoSaveInterval = window.setInterval(() => {
        if (this.hasUnsavedChanges && this.currentWorkflowFile) {
          this.quickSave().catch(error => {
            console.warn('⚠️ Auto-save failed:', error);
          });
        }
      }, intervalMinutes * 60 * 1000);
      
      console.log(`⏰ Auto-save enabled (${intervalMinutes} minutes)`);
    } else {
      console.log('⏰ Auto-save disabled');
    }
  }
  
  /**
   * 获取当前状态
   */
  public getCurrentState(): {
    currentFile: string | null;
    hasUnsavedChanges: boolean;
    autoSaveEnabled: boolean;
  } {
    return {
      currentFile: this.currentWorkflowFile,
      hasUnsavedChanges: this.hasUnsavedChanges,
      autoSaveEnabled: this.autoSaveEnabled
    };
  }
  
  // 私有方法
  
  private prepareWorkflowData(): WorkflowData {
    const state = editorState.getState();
    
    return {
      metadata: {
        id: state.workflowId || this.generateId(),
        name: state.workflowName || 'Untitled Workflow',
        description: state.workflowDescription || '',
        version: '1.0.0',
        createdAt: state.workflowCreatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: state.workflowAuthor || 'WebMonkey User',
        tags: state.workflowTags || []
      },
      nodes: state.nodes,
      connections: state.connections,
      canvasState: {
        zoom: state.canvasZoom || 1.0,
        panX: state.canvasPanX || 0,
        panY: state.canvasPanY || 0
      },
      settings: state.workflowSettings || {}
    };
  }
  
  private async applyWorkflowData(workflowData: WorkflowData, options: LoadOptions): Promise<void> {
    const state = editorState.getState();
    
    // 更新编辑器状态
    editorState.setState({
      ...state,
      workflowId: workflowData.metadata.id,
      workflowName: workflowData.metadata.name,
      workflowDescription: workflowData.metadata.description,
      workflowCreatedAt: workflowData.metadata.createdAt,
      workflowAuthor: workflowData.metadata.author,
      workflowTags: workflowData.metadata.tags,
      workflowSettings: workflowData.settings,
      nodes: workflowData.nodes,
      connections: workflowData.connections
    });
    
    // 恢复画布状态
    if (options.restoreCanvas !== false && this.editor) {
      this.editor.setZoom(workflowData.canvasState.zoom);
      this.editor.setPan(workflowData.canvasState.panX, workflowData.canvasState.panY);
    }
    
    // 重新渲染编辑器
    if (this.editor) {
      await this.editor.loadWorkflowData(workflowData);
    }
  }
  
  private validateWorkflowData(workflowData: WorkflowData): void {
    if (!workflowData.metadata || !workflowData.nodes || !workflowData.connections) {
      throw new Error('Invalid workflow data structure');
    }
    
    // 验证节点ID唯一性
    const nodeIds = workflowData.nodes.map(node => node.id);
    const uniqueIds = new Set(nodeIds);
    if (nodeIds.length !== uniqueIds.size) {
      throw new Error('Workflow contains duplicate node IDs');
    }
    
    // 验证连接的有效性
    for (const connection of workflowData.connections) {
      const sourceExists = nodeIds.includes(connection.sourceNodeId);
      const targetExists = nodeIds.includes(connection.targetNodeId);
      
      if (!sourceExists || !targetExists) {
        throw new Error('Workflow contains invalid connections');
      }
    }
  }
  
  private clearCurrentWorkflow(): void {
    if (this.editor) {
      this.editor.clearCanvas();
    }
    
    editorState.setState({
      ...editorState.getState(),
      nodes: [],
      connections: [],
      selectedNodes: [],
      workflowId: undefined,
      workflowName: undefined,
      workflowDescription: undefined,
      workflowCreatedAt: undefined,
      workflowAuthor: undefined,
      workflowTags: undefined,
      workflowSettings: undefined
    });
  }
  
  private updateEditorState(metadata: WorkflowMetadata): void {
    const state = editorState.getState();
    editorState.setState({
      ...state,
      workflowId: metadata.id,
      workflowName: metadata.name,
      workflowDescription: metadata.description,
      workflowCreatedAt: metadata.createdAt,
      workflowAuthor: metadata.author,
      workflowTags: metadata.tags
    });
  }
  
  private setupChangeTracking(): void {
    // 监听编辑器状态变化
    editorState.subscribe((newState, oldState) => {
      if (this.hasStateChanged(newState, oldState)) {
        this.hasUnsavedChanges = true;
        this.dispatchEvent('workflowChanged', {});
      }
    });
  }
  
  private hasStateChanged(newState: any, oldState: any): boolean {
    // 安全检查：确保状态对象存在
    if (!newState || !oldState) {
      return false;
    }
    
    // 比较关键字段是否发生变化
    const keyFields = ['nodes', 'connections', 'workflowName', 'workflowDescription'];
    
    for (const field of keyFields) {
      const newValue = newState[field];
      const oldValue = oldState[field];
      
      // 安全的比较，处理 undefined 情况
      if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        return true;
      }
    }
    
    return false;
  }
  
  private async confirmUnsavedChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = window.confirm(
        'You have unsaved changes. Do you want to continue without saving?'
      );
      resolve(confirmed);
    });
  }
  
  private async createBackup(filename: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = filename.replace('.wflow.json', `_backup_${timestamp}.wflow.json`);
      
      const workflowData = await WorkflowFileManager.loadWorkflow(filename);
      await WorkflowFileManager.saveWorkflow(workflowData, backupFilename);
      
      console.log(`💾 Backup created: ${backupFilename}`);
    } catch (error) {
      console.warn('⚠️ Failed to create backup:', error);
    }
  }
  
  private extractFilename(path: string): string {
    return path.split('/').pop() || path;
  }
  
  private generateId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private dispatchEvent(eventType: string, detail: any): void {
    const event = new CustomEvent(`workflow:${eventType}`, { detail });
    window.dispatchEvent(event);
  }
}