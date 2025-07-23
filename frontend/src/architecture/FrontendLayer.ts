/**
 * Frontend Layer - 前端层：可视化编辑和监控
 * 职责：管理前端组件协调、状态管理、UI交互和执行监控
 * 
 * 作为三层执行架构的第一层，负责：
 * 1. 可视化工作流编辑器管理
 * 2. 节点配置管理器
 * 3. 执行状态监控
 * 4. 模板管理系统
 */

import { CanvasEditor } from '../canvas/CanvasEditor';
import { BaseNode } from '../nodes/BaseNode';
import { Connection } from '../canvas/types/CanvasTypes';

/**
 * 前端层配置接口
 */
export interface FrontendLayerConfig {
  container: HTMLElement;
  apiEndpoint: string;
  websocketEndpoint: string;
  enableAutoSave: boolean;
  autoSaveInterval: number; // minutes
}

/**
 * 节点配置管理器接口
 */
export interface NodeConfigManager {
  getNodeConfig(nodeId: string): Promise<any>;
  updateNodeConfig(nodeId: string, config: any): Promise<void>;
  validateNodeConfig(nodeType: string, config: any): boolean;
  getConfigSchema(nodeType: string): any;
}

/**
 * 执行监控器接口
 */
export interface ExecutionMonitor {
  startMonitoring(workflowId: string): Promise<void>;
  stopMonitoring(workflowId: string): Promise<void>;
  getExecutionStatus(workflowId: string): Promise<ExecutionStatus>;
  subscribeToUpdates(callback: (status: ExecutionStatus) => void): void;
}

/**
 * 模板管理器接口
 */
export interface TemplateManager {
  listTemplates(): Promise<WorkflowTemplate[]>;
  getTemplate(templateId: string): Promise<WorkflowTemplate>;
  saveTemplate(template: WorkflowTemplate): Promise<string>;
  deleteTemplate(templateId: string): Promise<void>;
  generateWorkflowFromTemplate(templateId: string, params: any): Promise<WorkflowData>;
}

/**
 * 执行状态接口
 */
export interface ExecutionStatus {
  workflowId: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  progress: number; // 0-100
  currentNode?: string;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  logs: LogEntry[];
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  nodeId?: string;
  message: string;
  data?: any;
}

/**
 * 工作流模板接口
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  platform?: string;
  taskType?: string;
  nodes: BaseNode[];
  connections: Connection[];
  parameters: TemplateParameter[];
  metadata: {
    version: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
  };
}

/**
 * 模板参数接口
 */
export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'url';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[]; // for select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
}

/**
 * 工作流数据接口
 */
export interface WorkflowData {
  metadata: any;
  nodes: BaseNode[];
  connections: Connection[];
  canvasState: {
    zoom: number;
    panX: number;
    panY: number;
  };
  settings: Record<string, any>;
}

/**
 * 前端层主类 - 协调所有前端组件
 */
export class FrontendLayer {
  private canvasEditor: CanvasEditor;
  private nodeConfigManager: NodeConfigManager;
  private executionMonitor: ExecutionMonitor;
  private templateManager: TemplateManager;
  private config: FrontendLayerConfig;
  private isInitialized: boolean = false;

  constructor(config: FrontendLayerConfig) {
    this.config = config;
    
    // 初始化核心编辑器
    this.canvasEditor = new CanvasEditor(config.container);
    
    // 初始化管理器（在后续实现中会替换为具体实现）
    this.nodeConfigManager = new DefaultNodeConfigManager();
    this.executionMonitor = new DefaultExecutionMonitor(config.websocketEndpoint);
    this.templateManager = new DefaultTemplateManager(config.apiEndpoint);
  }

  /**
   * 初始化前端层
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('FrontendLayer already initialized');
      return;
    }

    try {
      // 初始化各个管理器
      await this.initializeManagers();
      
      // 设置事件监听
      this.setupEventListeners();
      
      // 配置自动保存
      if (this.config.enableAutoSave) {
        this.setupAutoSave();
      }
      
      this.isInitialized = true;
      console.log('✅ FrontendLayer initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize FrontendLayer:', error);
      throw error;
    }
  }

  /**
   * 获取画布编辑器实例
   */
  public getCanvasEditor(): CanvasEditor {
    return this.canvasEditor;
  }

  /**
   * 获取节点配置管理器
   */
  public getNodeConfigManager(): NodeConfigManager {
    return this.nodeConfigManager;
  }

  /**
   * 获取执行监控器
   */
  public getExecutionMonitor(): ExecutionMonitor {
    return this.executionMonitor;
  }

  /**
   * 获取模板管理器
   */
  public getTemplateManager(): TemplateManager {
    return this.templateManager;
  }

  /**
   * 执行工作流
   */
  public async executeWorkflow(workflowId?: string): Promise<string> {
    try {
      // 获取当前工作流数据
      const workflowData = this.serializeCurrentWorkflow();
      
      // 发送到API层执行
      const response = await fetch(`${this.config.apiEndpoint}/api/workflows/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          workflowData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      const executionId = result.executionId;
      
      // 开始监控执行状态
      await this.executionMonitor.startMonitoring(executionId);
      
      console.log(`🚀 Workflow execution started: ${executionId}`);
      return executionId;
    } catch (error) {
      console.error('❌ Failed to execute workflow:', error);
      throw error;
    }
  }

  /**
   * 从模板创建工作流
   */
  public async createWorkflowFromTemplate(templateId: string, parameters: Record<string, any>): Promise<void> {
    try {
      const workflowData = await this.templateManager.generateWorkflowFromTemplate(templateId, parameters);
      await this.canvasEditor.loadWorkflowData(workflowData);
      console.log(`✅ Workflow created from template: ${templateId}`);
    } catch (error) {
      console.error('❌ Failed to create workflow from template:', error);
      throw error;
    }
  }

  /**
   * 保存当前工作流为模板
   */
  public async saveAsTemplate(templateInfo: Partial<WorkflowTemplate>): Promise<string> {
    try {
      const currentWorkflow = this.serializeCurrentWorkflow();
      
      const template: WorkflowTemplate = {
        id: '',
        name: templateInfo.name || 'Untitled Template',
        description: templateInfo.description || '',
        category: templateInfo.category || 'custom',
        platform: templateInfo.platform,
        taskType: templateInfo.taskType,
        nodes: currentWorkflow.nodes,
        connections: currentWorkflow.connections,
        parameters: templateInfo.parameters || [],
        metadata: {
          version: '1.0.0',
          author: 'WebMonkey User',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: templateInfo.metadata?.tags || [],
        },
      };
      
      const templateId = await this.templateManager.saveTemplate(template);
      console.log(`✅ Template saved: ${templateId}`);
      return templateId;
    } catch (error) {
      console.error('❌ Failed to save template:', error);
      throw error;
    }
  }

  /**
   * 销毁前端层
   */
  public async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // 停止执行监控
      // TODO: 停止所有活跃的监控

      // 清理事件监听器
      this.removeEventListeners();

      // 停止自动保存
      this.stopAutoSave();

      this.isInitialized = false;
      console.log('✅ FrontendLayer destroyed');
    } catch (error) {
      console.error('❌ Failed to destroy FrontendLayer:', error);
      throw error;
    }
  }

  /**
   * 初始化管理器
   */
  private async initializeManagers(): Promise<void> {
    // TODO: 实际实现中会初始化具体的管理器
    console.log('Initializing managers...');
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听执行状态更新
    this.executionMonitor.subscribeToUpdates((status: ExecutionStatus) => {
      this.handleExecutionStatusUpdate(status);
    });

    // 监听窗口关闭事件，确保资源清理
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
  }

  /**
   * 移除事件监听器
   */
  private removeEventListeners(): void {
    // TODO: 移除所有事件监听器
  }

  /**
   * 设置自动保存
   */
  private setupAutoSave(): void {
    // TODO: 实现自动保存逻辑
    console.log(`Auto-save enabled: ${this.config.autoSaveInterval} minutes`);
  }

  /**
   * 停止自动保存
   */
  private stopAutoSave(): void {
    // TODO: 停止自动保存
  }

  /**
   * 处理执行状态更新
   */
  private handleExecutionStatusUpdate(status: ExecutionStatus): void {
    console.log('Execution status update:', status);
    
    // 更新UI显示执行状态
    // TODO: 实现状态更新UI逻辑
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('workflow:executionStatusUpdate', {
      detail: status,
    }));
  }

  /**
   * 序列化当前工作流
   */
  private serializeCurrentWorkflow(): WorkflowData {
    // 委托给CanvasEditor进行序列化
    const editorState = this.canvasEditor['serializeWorkflow'](); // 访问私有方法
    return editorState as WorkflowData;
  }
}

/**
 * 默认节点配置管理器实现
 */
class DefaultNodeConfigManager implements NodeConfigManager {
  async getNodeConfig(nodeId: string): Promise<any> {
    // TODO: 实现从后端获取节点配置
    return {};
  }

  async updateNodeConfig(nodeId: string, config: any): Promise<void> {
    // TODO: 实现更新节点配置到后端
  }

  validateNodeConfig(nodeType: string, config: any): boolean {
    // TODO: 实现节点配置验证
    return true;
  }

  getConfigSchema(nodeType: string): any {
    // TODO: 实现获取节点配置Schema
    return {};
  }
}

/**
 * 默认执行监控器实现
 */
class DefaultExecutionMonitor implements ExecutionMonitor {
  private websocketUrl: string;
  private connections: Map<string, WebSocket> = new Map();
  private callbacks: ((status: ExecutionStatus) => void)[] = [];

  constructor(websocketUrl: string) {
    this.websocketUrl = websocketUrl;
  }

  async startMonitoring(workflowId: string): Promise<void> {
    // TODO: 实现WebSocket连接和监控
    console.log(`Starting monitoring for workflow: ${workflowId}`);
  }

  async stopMonitoring(workflowId: string): Promise<void> {
    // TODO: 实现停止监控
    console.log(`Stopping monitoring for workflow: ${workflowId}`);
  }

  async getExecutionStatus(workflowId: string): Promise<ExecutionStatus> {
    // TODO: 实现获取执行状态
    return {
      workflowId,
      status: 'idle',
      progress: 0,
      logs: [],
    };
  }

  subscribeToUpdates(callback: (status: ExecutionStatus) => void): void {
    this.callbacks.push(callback);
  }
}

/**
 * 默认模板管理器实现
 */
class DefaultTemplateManager implements TemplateManager {
  private apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
  }

  async listTemplates(): Promise<WorkflowTemplate[]> {
    // TODO: 实现从后端获取模板列表
    return [];
  }

  async getTemplate(templateId: string): Promise<WorkflowTemplate> {
    // TODO: 实现从后端获取特定模板
    throw new Error('Template not found');
  }

  async saveTemplate(template: WorkflowTemplate): Promise<string> {
    // TODO: 实现保存模板到后端
    return 'template_' + Date.now();
  }

  async deleteTemplate(templateId: string): Promise<void> {
    // TODO: 实现删除模板
  }

  async generateWorkflowFromTemplate(templateId: string, params: any): Promise<WorkflowData> {
    // TODO: 实现基于模板生成工作流
    throw new Error('Not implemented');
  }
}

/**
 * 导出前端层单例实例创建函数
 */
export function createFrontendLayer(config: FrontendLayerConfig): FrontendLayer {
  return new FrontendLayer(config);
}