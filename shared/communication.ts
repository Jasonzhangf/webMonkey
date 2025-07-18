/**
 * 通信协议接口定义
 * Communication protocol interface definitions
 */

import { ElementData, NodeExecutionData, BrowserHandle, AutomationError } from './types';

// ============================================================================
// 基础通信协议 (Base Communication Protocol)
// ============================================================================

export interface BaseMessage {
  id: string;
  type: string;
  timestamp: string;
  source: 'plugin' | 'orchestrator' | 'backend' | 'executor';
  target: 'plugin' | 'orchestrator' | 'backend' | 'executor';
}

export interface RequestMessage extends BaseMessage {
  payload: any;
  expect_response: boolean;
}

export interface ResponseMessage extends BaseMessage {
  request_id: string;
  success: boolean;
  payload?: any;
  error?: AutomationError;
}

// ============================================================================
// 插件与编排器通信 (Plugin-Orchestrator Communication)
// ============================================================================

export interface PluginOrchestratorMessage extends BaseMessage {
  node_id?: string;
}

// 插件发送给编排器的消息类型
export interface ElementSelectedMessage extends PluginOrchestratorMessage {
  type: 'element_selected';
  payload: {
    node_id: string;
    element_data: ElementData;
  };
}

export interface OperationDefinedMessage extends PluginOrchestratorMessage {
  type: 'operation_defined';
  payload: {
    node_id: string;
    operation: {
      type: string;
      parameters: Record<string, any>;
      delay?: number;
    };
  };
}

export interface PluginStatusMessage extends PluginOrchestratorMessage {
  type: 'plugin_status';
  payload: {
    status: 'connected' | 'disconnected' | 'error';
    page_url: string;
    ready: boolean;
  };
}

// 编排器发送给插件的消息类型
export interface NodeConnectionRequest extends PluginOrchestratorMessage {
  type: 'node_connection_request';
  payload: {
    node_id: string;
    node_type: string;
    connection_mode: 'element_selection' | 'operation_definition';
  };
}

export interface NodeUpdateMessage extends PluginOrchestratorMessage {
  type: 'node_update';
  payload: {
    node_id: string;
    updates: Record<string, any>;
  };
}

export interface ConnectionStatusMessage extends PluginOrchestratorMessage {
  type: 'connection_status';
  payload: {
    node_id: string;
    status: 'connected' | 'disconnected';
  };
}

// ============================================================================
// 编排器与后端通信 (Orchestrator-Backend Communication)
// ============================================================================

export interface OrchestratorBackendMessage extends BaseMessage {}

// 工作流管理消息
export interface SaveWorkflowMessage extends OrchestratorBackendMessage {
  type: 'save_workflow';
  payload: {
    workflow_id: string;
    workflow_data: any;
    metadata: {
      name: string;
      description: string;
      tags: string[];
    };
  };
}

export interface LoadWorkflowMessage extends OrchestratorBackendMessage {
  type: 'load_workflow';
  payload: {
    workflow_id: string;
  };
}

export interface CreateTaskMessage extends OrchestratorBackendMessage {
  type: 'create_task';
  payload: {
    workflow_id: string;
    trigger_config: {
      type: 'manual' | 'scheduled' | 'loop';
      cron_expression?: string;
      loop_interval?: number;
    };
  };
}

// ============================================================================
// 后端与执行器通信 (Backend-Executor Communication)
// ============================================================================

export interface BackendExecutorMessage extends BaseMessage {}

export interface ExecuteTaskMessage extends BackendExecutorMessage {
  type: 'execute_task';
  payload: {
    task_id: string;
    workflow_data: NodeExecutionData[];
    execution_config: {
      headless: boolean;
      timeout_seconds: number;
      error_handling: 'stop' | 'continue' | 'retry';
    };
  };
}

export interface TaskStatusUpdateMessage extends BackendExecutorMessage {
  type: 'task_status_update';
  payload: {
    task_id: string;
    status: 'waiting' | 'executing' | 'completed' | 'error';
    progress?: number;
    current_node?: string;
    error?: AutomationError;
  };
}

export interface BrowserHandleMessage extends BackendExecutorMessage {
  type: 'browser_handle_update';
  payload: {
    task_id: string;
    handle: BrowserHandle;
  };
}

// ============================================================================
// WebSocket连接管理 (WebSocket Connection Management)
// ============================================================================

export interface WebSocketConnection {
  id: string;
  type: 'plugin' | 'orchestrator' | 'executor';
  node_id?: string;
  connected_at: string;
  last_ping: string;
}

export interface ConnectionManager {
  connections: Map<string, WebSocketConnection>;
  
  addConnection(connection: WebSocketConnection): void;
  removeConnection(connectionId: string): void;
  getConnection(connectionId: string): WebSocketConnection | undefined;
  getConnectionsByType(type: string): WebSocketConnection[];
  getConnectionsByNodeId(nodeId: string): WebSocketConnection[];
}

// ============================================================================
// REST API接口 (REST API Interfaces)
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface WorkflowCreateRequest {
  name: string;
  description?: string;
  workflow_data: any;
  tags?: string[];
}

export interface WorkflowResponse {
  id: string;
  name: string;
  description?: string;
  workflow_data: any;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface TaskCreateRequest {
  workflow_id: string;
  trigger_config: {
    type: 'manual' | 'scheduled' | 'loop';
    cron_expression?: string;
    loop_interval?: number;
    max_executions?: number;
  };
}

export interface TaskResponse {
  id: string;
  workflow_id: string;
  state: string;
  trigger_config: any;
  created_at: string;
  updated_at: string;
  execution_log?: any[];
}

// ============================================================================
// MCP协议接口 (MCP Protocol Interfaces)
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// ============================================================================
// 事件系统 (Event System)
// ============================================================================

export interface SystemEvent {
  type: string;
  source: string;
  timestamp: string;
  data: any;
}

export interface EventHandler {
  (event: SystemEvent): void | Promise<void>;
}

export interface EventEmitter {
  on(eventType: string, handler: EventHandler): void;
  off(eventType: string, handler: EventHandler): void;
  emit(eventType: string, data: any): void;
}

// ============================================================================
// 消息路由 (Message Routing)
// ============================================================================

export interface MessageRouter {
  route(message: BaseMessage): Promise<void>;
  registerHandler(messageType: string, handler: (message: BaseMessage) => Promise<ResponseMessage | void>): void;
  unregisterHandler(messageType: string): void;
}

// ============================================================================
// 通信配置 (Communication Configuration)
// ============================================================================

export interface CommunicationConfig {
  websocket: {
    port: number;
    host: string;
    path: string;
    heartbeat_interval: number;
    reconnect_attempts: number;
    reconnect_delay: number;
  };
  rest_api: {
    port: number;
    host: string;
    base_path: string;
    cors_origins: string[];
    rate_limit: {
      requests_per_minute: number;
      burst_size: number;
    };
  };
  security: {
    enable_auth: boolean;
    jwt_secret?: string;
    allowed_origins: string[];
    api_key_header?: string;
  };
}