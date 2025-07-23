/**
 * Node Shadow System - 前后端节点映射机制 (前端部分)
 * 职责：管理前后端节点的一一映射关系，确保状态同步和独立执行
 * 
 * 核心功能：
 * 1. 前后端节点对创建和管理
 * 2. 节点状态实时同步
 * 3. 配置和数据的双向同步
 * 4. 独立执行模式支持
 */

import { BaseNode } from './BaseNode';
import { NodeDefinition, nodeRegistry } from '../../../shared/NodeDefinition';

export interface ShadowNodePair {
  frontendNode: BaseNode;
  backendNodeId: string;
  mappingId: string;
  lastSyncTime: Date;
  syncStatus: 'synced' | 'out_of_sync' | 'syncing' | 'error';
  syncError?: string;
}

export interface NodeSyncData {
  nodeId: string;
  nodeType: string;
  config: any;
  state: any;
  position: { x: number; y: number };
  properties: any;
  lastModified: Date;
}

export interface SyncOptions {
  immediate: boolean;
  direction: 'frontend_to_backend' | 'backend_to_frontend' | 'bidirectional';
  includeState: boolean;
  includeConfig: boolean;
  includePosition: boolean;
}

/**
 * 节点同步管理器
 */
export class NodeSyncManager {
  private websocketUrl: string;
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds
  private syncCallbacks: Map<string, (data: NodeSyncData) => void> = new Map();

  constructor(websocketUrl: string) {
    this.websocketUrl = websocketUrl;
  }

  /**
   * 连接到后端
   */
  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.websocketUrl);
        
        this.websocket.onopen = () => {
          console.log('✅ NodeSyncManager connected to backend');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.websocket.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.websocket.onclose = () => {
          console.log('🔌 NodeSyncManager disconnected from backend');
          this.attemptReconnect();
        };
        
        this.websocket.onerror = (error) => {
          console.error('❌ NodeSyncManager connection error:', error);
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * 发送同步数据到后端
   */
  public async syncToBackend(syncData: NodeSyncData): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    const message = {
      type: 'NODE_SYNC',
      direction: 'frontend_to_backend',
      data: syncData,
      timestamp: new Date().toISOString()
    };

    this.websocket.send(JSON.stringify(message));
  }

  /**
   * 请求从后端同步数据
   */
  public async syncFromBackend(nodeId: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    const message = {
      type: 'NODE_SYNC_REQUEST',
      nodeId,
      timestamp: new Date().toISOString()
    };

    this.websocket.send(JSON.stringify(message));
  }

  /**
   * 订阅节点同步更新
   */
  public subscribeSyncUpdates(nodeId: string, callback: (data: NodeSyncData) => void): void {
    this.syncCallbacks.set(nodeId, callback);
  }

  /**
   * 取消订阅
   */
  public unsubscribeSyncUpdates(nodeId: string): void {
    this.syncCallbacks.delete(nodeId);
  }

  /**
   * 处理来自后端的消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'NODE_SYNC_RESPONSE':
          this.handleSyncResponse(message.data);
          break;
        case 'NODE_STATE_UPDATE':
          this.handleStateUpdate(message.data);
          break;
        case 'SYNC_ERROR':
          this.handleSyncError(message.error);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse sync message:', error);
    }
  }

  /**
   * 处理同步响应
   */
  private handleSyncResponse(syncData: NodeSyncData): void {
    const callback = this.syncCallbacks.get(syncData.nodeId);
    if (callback) {
      callback(syncData);
    }
  }

  /**
   * 处理状态更新
   */
  private handleStateUpdate(syncData: NodeSyncData): void {
    const callback = this.syncCallbacks.get(syncData.nodeId);
    if (callback) {
      callback(syncData);
    }
    
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('node:stateUpdate', {
      detail: syncData
    }));
  }

  /**
   * 处理同步错误
   */
  private handleSyncError(error: any): void {
    console.error('Node sync error:', error);
    
    // 触发错误事件
    window.dispatchEvent(new CustomEvent('node:syncError', {
      detail: error
    }));
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnect failed:', error);
      });
    }, this.reconnectInterval);
  }
}

/**
 * 前后端节点影子映射系统
 */
export class NodeShadowSystem {
  private static instance: NodeShadowSystem;
  private shadowPairs: Map<string, ShadowNodePair> = new Map();
  private syncManager: NodeSyncManager;
  private autoSyncEnabled: boolean = true;
  private syncInterval: number = 5000; // 5 seconds
  private syncTimer: NodeJS.Timeout | null = null;

  private constructor(websocketUrl: string) {
    this.syncManager = new NodeSyncManager(websocketUrl);
    this.setupEventListeners();
  }

  public static getInstance(websocketUrl?: string): NodeShadowSystem {
    if (!NodeShadowSystem.instance) {
      if (!websocketUrl) {
        throw new Error('WebSocket URL is required for first initialization');
      }
      NodeShadowSystem.instance = new NodeShadowSystem(websocketUrl);
    }
    return NodeShadowSystem.instance;
  }

  /**
   * 初始化影子系统
   */
  public async initialize(): Promise<void> {
    try {
      await this.syncManager.connect();
      
      if (this.autoSyncEnabled) {
        this.startAutoSync();
      }
      
      console.log('✅ NodeShadowSystem initialized');
    } catch (error) {
      console.error('❌ Failed to initialize NodeShadowSystem:', error);
      throw error;
    }
  }

  /**
   * 关闭影子系统
   */
  public shutdown(): void {
    this.stopAutoSync();
    this.syncManager.disconnect();
    this.shadowPairs.clear();
    console.log('✅ NodeShadowSystem shutdown');
  }

  /**
   * 创建前后端节点对
   */
  public async createNodePair(frontendNode: BaseNode): Promise<ShadowNodePair> {
    const mappingId = `shadow_${frontendNode.id}_${Date.now()}`;
    
    try {
      // 获取节点定义
      const nodeDefinition = nodeRegistry.getNodeDefinition(frontendNode.type);
      if (!nodeDefinition) {
        throw new Error(`Node definition not found for type: ${frontendNode.type}`);
      }

      // 创建后端节点
      const backendNodeId = await this.createBackendNode(frontendNode, nodeDefinition);
      
      // 创建影子对
      const shadowPair: ShadowNodePair = {
        frontendNode,
        backendNodeId,
        mappingId,
        lastSyncTime: new Date(),
        syncStatus: 'synced'
      };

      // 注册影子对
      this.shadowPairs.set(frontendNode.id, shadowPair);
      
      // 订阅后端更新
      this.syncManager.subscribeSyncUpdates(backendNodeId, (data) => {
        this.handleBackendUpdate(shadowPair, data);
      });

      console.log(`✅ Created node pair: ${frontendNode.id} <-> ${backendNodeId}`);
      return shadowPair;
      
    } catch (error) {
      console.error(`❌ Failed to create node pair for ${frontendNode.id}:`, error);
      throw error;
    }
  }

  /**
   * 移除节点对
   */
  public async removeNodePair(frontendNodeId: string): Promise<boolean> {
    const shadowPair = this.shadowPairs.get(frontendNodeId);
    if (!shadowPair) {
      return false;
    }

    try {
      // 从后端删除节点
      await this.deleteBackendNode(shadowPair.backendNodeId);
      
      // 取消订阅
      this.syncManager.unsubscribeSyncUpdates(shadowPair.backendNodeId);
      
      // 移除影子对
      this.shadowPairs.delete(frontendNodeId);
      
      console.log(`✅ Removed node pair: ${frontendNodeId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to remove node pair ${frontendNodeId}:`, error);
      return false;
    }
  }

  /**
   * 同步前端节点到后端
   */
  public async syncNodeToBackend(frontendNodeId: string, options: Partial<SyncOptions> = {}): Promise<void> {
    const shadowPair = this.shadowPairs.get(frontendNodeId);
    if (!shadowPair) {
      throw new Error(`No shadow pair found for node: ${frontendNodeId}`);
    }

    const defaultOptions: SyncOptions = {
      immediate: true,
      direction: 'frontend_to_backend',
      includeState: true,
      includeConfig: true,
      includePosition: true
    };
    
    const syncOptions = { ...defaultOptions, ...options };
    
    try {
      shadowPair.syncStatus = 'syncing';
      
      // 构建同步数据
      const syncData: NodeSyncData = {
        nodeId: shadowPair.backendNodeId,
        nodeType: shadowPair.frontendNode.type,
        config: syncOptions.includeConfig ? this.extractNodeConfig(shadowPair.frontendNode) : undefined,
        state: syncOptions.includeState ? this.extractNodeState(shadowPair.frontendNode) : undefined,
        position: syncOptions.includePosition ? shadowPair.frontendNode.getPosition() : undefined,
        properties: shadowPair.frontendNode.properties,
        lastModified: new Date()
      };

      // 发送到后端
      await this.syncManager.syncToBackend(syncData);
      
      shadowPair.syncStatus = 'synced';
      shadowPair.lastSyncTime = new Date();
      
    } catch (error) {
      shadowPair.syncStatus = 'error';
      shadowPair.syncError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * 从后端同步节点数据
   */
  public async syncNodeFromBackend(frontendNodeId: string): Promise<void> {
    const shadowPair = this.shadowPairs.get(frontendNodeId);
    if (!shadowPair) {
      throw new Error(`No shadow pair found for node: ${frontendNodeId}`);
    }

    try {
      shadowPair.syncStatus = 'syncing';
      await this.syncManager.syncFromBackend(shadowPair.backendNodeId);
    } catch (error) {
      shadowPair.syncStatus = 'error';
      shadowPair.syncError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * 获取影子对信息
   */
  public getShadowPair(frontendNodeId: string): ShadowNodePair | undefined {
    return this.shadowPairs.get(frontendNodeId);
  }

  /**
   * 获取所有影子对
   */
  public getAllShadowPairs(): ShadowNodePair[] {
    return Array.from(this.shadowPairs.values());
  }

  /**
   * 独立执行节点（仅后端执行）
   */
  public async executeNodeIndependently(frontendNodeId: string, parameters: any = {}): Promise<string> {
    const shadowPair = this.shadowPairs.get(frontendNodeId);
    if (!shadowPair) {
      throw new Error(`No shadow pair found for node: ${frontendNodeId}`);
    }

    // 确保节点已同步
    if (shadowPair.syncStatus !== 'synced') {
      await this.syncNodeToBackend(frontendNodeId);
    }

    // 请求后端独立执行
    const response = await fetch('/api/nodes/execute-independent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeId: shadowPair.backendNodeId,
        parameters
      }),
    });

    if (!response.ok) {
      throw new Error(`Independent execution failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.executionId;
  }

  /**
   * 设置自动同步
   */
  public setAutoSync(enabled: boolean, interval: number = 5000): void {
    this.autoSyncEnabled = enabled;
    this.syncInterval = interval;
    
    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  /**
   * 创建后端节点
   */
  private async createBackendNode(frontendNode: BaseNode, nodeDefinition: NodeDefinition): Promise<string> {
    const response = await fetch('/api/nodes/create-shadow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeType: frontendNode.type,
        frontendNodeId: frontendNode.id,
        nodeDefinition,
        initialConfig: this.extractNodeConfig(frontendNode),
        initialState: this.extractNodeState(frontendNode)
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create backend node: ${response.statusText}`);
    }

    const result = await response.json();
    return result.backendNodeId;
  }

  /**
   * 删除后端节点
   */
  private async deleteBackendNode(backendNodeId: string): Promise<void> {
    const response = await fetch(`/api/nodes/shadow/${backendNodeId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete backend node: ${response.statusText}`);
    }
  }

  /**
   * 提取节点配置
   */
  private extractNodeConfig(node: BaseNode): any {
    return {
      title: node.title,
      properties: node.properties,
      position: node.getPosition(),
      size: node.getSize()
    };
  }

  /**
   * 提取节点状态
   */
  private extractNodeState(node: BaseNode): any {
    return {
      executionState: node.executionState,
      isSelected: node.isSelected,
      data: node.data || {}
    };
  }

  /**
   * 应用后端状态到前端节点
   */
  private applyBackendState(shadowPair: ShadowNodePair, syncData: NodeSyncData): void {
    const { frontendNode } = shadowPair;

    // 更新配置
    if (syncData.config) {
      if (syncData.config.title) {
        frontendNode.title = syncData.config.title;
      }
      if (syncData.config.properties) {
        Object.assign(frontendNode.properties, syncData.config.properties);
      }
      if (syncData.config.position) {
        frontendNode.setPosition(syncData.config.position.x, syncData.config.position.y);
      }
    }

    // 更新状态
    if (syncData.state) {
      if (syncData.state.executionState) {
        frontendNode.executionState = syncData.state.executionState;
      }
      if (syncData.state.data) {
        frontendNode.data = { ...frontendNode.data, ...syncData.state.data };
      }
    }
  }

  /**
   * 处理后端更新
   */
  private handleBackendUpdate(shadowPair: ShadowNodePair, syncData: NodeSyncData): void {
    try {
      this.applyBackendState(shadowPair, syncData);
      
      shadowPair.syncStatus = 'synced';
      shadowPair.lastSyncTime = new Date();
      shadowPair.syncError = undefined;
      
      // 触发节点更新事件
      window.dispatchEvent(new CustomEvent('node:updated', {
        detail: {
          nodeId: shadowPair.frontendNode.id,
          source: 'backend'
        }
      }));
      
    } catch (error) {
      shadowPair.syncStatus = 'error';
      shadowPair.syncError = error instanceof Error ? error.message : String(error);
      console.error('Failed to apply backend update:', error);
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听前端节点变更
    window.addEventListener('node:changed', (event: any) => {
      const { nodeId } = event.detail;
      const shadowPair = this.shadowPairs.get(nodeId);
      
      if (shadowPair && this.autoSyncEnabled) {
        this.syncNodeToBackend(nodeId, { immediate: false });
      }
    });
  }

  /**
   * 启动自动同步
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.performAutoSync();
    }, this.syncInterval);
  }

  /**
   * 停止自动同步
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * 执行自动同步
   */
  private async performAutoSync(): Promise<void> {
    const outOfSyncPairs = Array.from(this.shadowPairs.values()).filter(
      pair => pair.syncStatus === 'out_of_sync'
    );

    for (const pair of outOfSyncPairs) {
      try {
        await this.syncNodeToBackend(pair.frontendNode.id, { immediate: false });
      } catch (error) {
        console.error(`Auto sync failed for node ${pair.frontendNode.id}:`, error);
      }
    }
  }
}

/**
 * 创建影子系统实例的工厂函数
 */
export function createNodeShadowSystem(websocketUrl: string): NodeShadowSystem {
  return NodeShadowSystem.getInstance(websocketUrl);
}

/**
 * 获取全局影子系统实例
 */
export function getNodeShadowSystem(): NodeShadowSystem | null {
  try {
    return NodeShadowSystem.getInstance();
  } catch {
    return null;
  }
}