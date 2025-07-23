/**
 * Workflow Loader - 工作流加载器
 * 职责：处理工作流文件的反序列化、节点重建、连接恢复等加载逻辑
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

import { BaseNode } from '../nodes/BaseNode';
import { Connection } from '../canvas/ConnectionManager';
import { NodeRegistry } from '../nodes/NodeRegistry';
import { WorkflowData } from '../storage/WorkflowFileManager';
import { CanvasEditor } from '../canvas/CanvasEditor';
import { editorState } from '../state/EditorState';

export interface LoadResult {
  success: boolean;
  nodesLoaded: number;
  connectionsLoaded: number;
  errors: string[];
  warnings: string[];
}

export interface LoadOptions {
  preservePositions: boolean;
  validateConnections: boolean;
  skipMissingNodes: boolean;
  centerAfterLoad: boolean;
}

export class WorkflowLoader {
  private editor: CanvasEditor;
  private nodeRegistry: NodeRegistry;
  private loadedNodes: Map<string, BaseNode> = new Map();
  
  constructor(editor: CanvasEditor) {
    this.editor = editor;
    this.nodeRegistry = NodeRegistry.getInstance();
  }
  
  /**
   * 加载工作流数据到编辑器
   */
  public async loadWorkflow(workflowData: WorkflowData, options: LoadOptions): Promise<LoadResult> {
    const result: LoadResult = {
      success: false,
      nodesLoaded: 0,
      connectionsLoaded: 0,
      errors: [],
      warnings: []
    };
    
    try {
      console.log(`📂 Loading workflow: ${workflowData.metadata.name}`);
      
      // 1. 清空当前工作流
      this.clearCurrentWorkflow();
      
      // 2. 加载节点
      await this.loadNodes(workflowData.nodes, options, result);
      
      // 3. 加载连接
      await this.loadConnections(workflowData.connections, options, result);
      
      // 4. 恢复画布状态
      this.restoreCanvasState(workflowData.canvasState);
      
      // 5. 更新编辑器元数据
      this.updateWorkflowMetadata(workflowData.metadata);
      
      // 6. 验证加载结果
      this.validateLoadResult(result);
      
      // 7. 可选：居中显示
      if (options.centerAfterLoad) {
        this.centerWorkflow();
      }
      
      // 8. 刷新编辑器显示
      this.editor.refresh();
      
      result.success = result.errors.length === 0;
      
      console.log(`✅ Workflow loaded: ${result.nodesLoaded} nodes, ${result.connectionsLoaded} connections`);
      
      if (result.warnings.length > 0) {
        console.warn('⚠️ Load warnings:', result.warnings);
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Critical load error: ${errorMessage}`);
      result.success = false;
      
      console.error('❌ Failed to load workflow:', error);
      return result;
    }
  }
  
  /**
   * 加载单个节点
   */
  public async loadNode(nodeData: any, preservePosition: boolean = true): Promise<BaseNode | null> {
    try {
      // 验证节点数据
      if (!this.validateNodeData(nodeData)) {
        throw new Error(`Invalid node data: ${nodeData.id || 'unknown'}`);
      }
      
      // 检查节点类型是否已注册
      if (!this.nodeRegistry.isRegistered(nodeData.type)) {
        throw new Error(`Unknown node type: ${nodeData.type}`);
      }
      
      // 创建节点实例
      const nodeClass = this.nodeRegistry.getNodeClass(nodeData.type);
      const node = new nodeClass();
      
      // 恢复节点属性
      this.restoreNodeProperties(node, nodeData);
      
      // 恢复位置
      if (preservePosition && nodeData.position) {
        node.setPosition(nodeData.position.x, nodeData.position.y);
      }
      
      // 添加到编辑器
      this.editor.addNode(node);
      this.loadedNodes.set(node.id, node);
      
      return node;
      
    } catch (error) {
      console.error(`❌ Failed to load node ${nodeData.id}:`, error);
      return null;
    }
  }
  
  /**
   * 批量加载节点
   */
  private async loadNodes(nodesData: any[], options: LoadOptions, result: LoadResult): Promise<void> {
    console.log(`📦 Loading ${nodesData.length} nodes...`);
    
    for (const nodeData of nodesData) {
      try {
        const node = await this.loadNode(nodeData, options.preservePositions);
        
        if (node) {
          result.nodesLoaded++;
        } else if (options.skipMissingNodes) {
          result.warnings.push(`Skipped unknown node type: ${nodeData.type}`);
        } else {
          result.errors.push(`Failed to load node: ${nodeData.id} (${nodeData.type})`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (options.skipMissingNodes) {
          result.warnings.push(`Skipped node ${nodeData.id}: ${errorMessage}`);
        } else {
          result.errors.push(`Failed to load node ${nodeData.id}: ${errorMessage}`);
        }
      }
    }
  }
  
  /**
   * 加载连接
   */
  private async loadConnections(connectionsData: Connection[], options: LoadOptions, result: LoadResult): Promise<void> {
    console.log(`🔗 Loading ${connectionsData.length} connections...`);
    
    for (const connectionData of connectionsData) {
      try {
        const success = await this.loadConnection(connectionData, options.validateConnections);
        
        if (success) {
          result.connectionsLoaded++;
        } else {
          result.warnings.push(`Failed to create connection: ${connectionData.sourceNodeId} -> ${connectionData.targetNodeId}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Connection error: ${errorMessage}`);
      }
    }
  }
  
  /**
   * 加载单个连接
   */
  private async loadConnection(connectionData: Connection, validate: boolean): Promise<boolean> {
    const sourceNode = this.loadedNodes.get(connectionData.sourceNodeId);
    const targetNode = this.loadedNodes.get(connectionData.targetNodeId);
    
    if (!sourceNode || !targetNode) {
      console.warn(`⚠️ Cannot create connection: missing nodes ${connectionData.sourceNodeId} -> ${connectionData.targetNodeId}`);
      return false;
    }
    
    // 验证端口存在
    if (validate) {
      const sourcePort = sourceNode.getOutputPort(connectionData.sourcePortId);
      const targetPort = targetNode.getInputPort(connectionData.targetPortId);
      
      if (!sourcePort || !targetPort) {
        console.warn(`⚠️ Cannot create connection: missing ports`);
        return false;
      }
      
      // 验证端口类型兼容性
      if (!this.arePortsCompatible(sourcePort, targetPort)) {
        console.warn(`⚠️ Cannot create connection: incompatible port types`);
        return false;
      }
    }
    
    // 创建连接
    const connection: Connection = {
      id: connectionData.id,
      sourceNodeId: connectionData.sourceNodeId,
      sourcePortId: connectionData.sourcePortId,
      targetNodeId: connectionData.targetNodeId,
      targetPortId: connectionData.targetPortId
    };
    
    return this.editor.addConnection(connection);
  }
  
  /**
   * 恢复节点属性
   */
  private restoreNodeProperties(node: BaseNode, nodeData: any): void {
    // 基础属性
    if (nodeData.id) node.id = nodeData.id;
    if (nodeData.title) node.title = nodeData.title;
    if (nodeData.type) node.type = nodeData.type;
    
    // 配置属性
    if (nodeData.config) {
      Object.keys(nodeData.config).forEach(key => {
        node.setProperty(key, nodeData.config[key]);
      });
    }
    
    // 自定义属性
    if (nodeData.properties) {
      Object.keys(nodeData.properties).forEach(key => {
        node.setProperty(key, nodeData.properties[key]);
      });
    }
    
    // 样式和UI状态
    if (nodeData.size) {
      node.setSize(nodeData.size.width, nodeData.size.height);
    }
    
    if (nodeData.color) {
      node.setColor(nodeData.color);
    }
    
    if (nodeData.collapsed !== undefined) {
      node.setCollapsed(nodeData.collapsed);
    }
  }
  
  /**
   * 恢复画布状态
   */
  private restoreCanvasState(canvasState: any): void {
    if (!canvasState) return;
    
    try {
      if (canvasState.zoom) {
        this.editor.setZoom(canvasState.zoom);
      }
      
      if (canvasState.panX !== undefined && canvasState.panY !== undefined) {
        this.editor.setPan(canvasState.panX, canvasState.panY);
      }
      
      console.log(`🎨 Canvas state restored: zoom=${canvasState.zoom}, pan=(${canvasState.panX}, ${canvasState.panY})`);
      
    } catch (error) {
      console.warn('⚠️ Failed to restore canvas state:', error);
    }
  }
  
  /**
   * 更新工作流元数据
   */
  private updateWorkflowMetadata(metadata: any): void {
    const state = editorState.getState();
    
    editorState.setState({
      ...state,
      workflowId: metadata.id,
      workflowName: metadata.name,
      workflowDescription: metadata.description,
      workflowAuthor: metadata.author,
      workflowTags: metadata.tags,
      workflowCreatedAt: metadata.createdAt,
      workflowUpdatedAt: metadata.updatedAt
    });
  }
  
  /**
   * 验证节点数据有效性
   */
  private validateNodeData(nodeData: any): boolean {
    if (!nodeData || typeof nodeData !== 'object') {
      return false;
    }
    
    if (!nodeData.id || typeof nodeData.id !== 'string') {
      return false;
    }
    
    if (!nodeData.type || typeof nodeData.type !== 'string') {
      return false;
    }
    
    return true;
  }
  
  /**
   * 验证端口兼容性
   */
  private arePortsCompatible(sourcePort: any, targetPort: any): boolean {
    // 基础类型检查
    if (sourcePort.dataType && targetPort.dataType) {
      // 如果都有类型定义，检查类型兼容性
      if (sourcePort.dataType !== targetPort.dataType && 
          sourcePort.dataType !== 'any' && 
          targetPort.dataType !== 'any') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 验证加载结果
   */
  private validateLoadResult(result: LoadResult): void {
    // 检查是否有节点加载成功
    if (result.nodesLoaded === 0) {
      result.errors.push('No nodes were loaded');
    }
    
    // 检查连接与节点比例
    if (result.connectionsLoaded === 0 && result.nodesLoaded > 1) {
      result.warnings.push('No connections were loaded, workflow nodes may be disconnected');
    }
  }
  
  /**
   * 清空当前工作流
   */
  private clearCurrentWorkflow(): void {
    this.editor.clearCanvas();
    this.loadedNodes.clear();
  }
  
  /**
   * 居中显示工作流
   */
  private centerWorkflow(): void {
    try {
      this.editor.centerView();
    } catch (error) {
      console.warn('⚠️ Failed to center workflow view:', error);
    }
  }
}