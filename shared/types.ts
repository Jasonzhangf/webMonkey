/**
 * 核心数据接口和类型定义
 * Core data interfaces and type definitions
 */

// ============================================================================
// 元素定位相关类型 (Element Location Types)
// ============================================================================

export interface ElementLocator {
  primary: {
    type: 'css' | 'xpath' | 'id' | 'class';
    value: string;
  };
  fallbacks: Array<{
    type: 'css' | 'xpath' | 'attributes';
    value: string | Record<string, string>;
  }>;
  validation?: {
    expectedText?: string;
    expectedAttributes?: Record<string, string>;
  };
}

export interface ElementData {
  selectors: {
    css: string;
    xpath: string;
    attributes: Record<string, string>;
  };
  operations: Operation[];
  metadata: {
    tagName: string;
    text: string;
    position: { x: number; y: number };
  };
}

// ============================================================================
// 操作相关类型 (Operation Types)
// ============================================================================

export interface Operation {
  type: 'click' | 'input' | 'hover' | 'extract' | 'keyboard' | 'scroll' | 'navigate' | 'wait';
  params: Record<string, any>;
  delay?: number;
}

export interface OperationUnit {
  id: string;
  observation: ObservationStep;
  action: ActionStep;
  condition?: ConditionCheck;
  loop?: LoopConfig;
}

export interface ObservationStep {
  type: 'element_exists' | 'text_contains' | 'attribute_equals' | 'page_loaded';
  target: ElementLocator;
  expected_value?: string;
  timeout_ms: number;
  retry_count: number;
}

export interface ActionStep {
  type: 'click' | 'input' | 'hover' | 'scroll' | 'extract' | 'navigate' | 'wait';
  target?: ElementLocator;
  parameters: Record<string, any>;
  validation?: ObservationStep;
}

export interface ConditionCheck {
  type: 'if' | 'while' | 'until';
  condition: ObservationStep;
  true_branch?: OperationUnit[];
  false_branch?: OperationUnit[];
}

export interface LoopConfig {
  type: 'for' | 'while' | 'foreach';
  condition: string | number | ObservationStep;
  max_iterations: number;
  break_condition?: ObservationStep;
}

// ============================================================================
// 浏览器句柄相关类型 (Browser Handle Types)
// ============================================================================

export interface BrowserHandle {
  instance_id: string;
  session_id: string;
  current_url: string;
  cookies: Record<string, any>;
  local_storage: Record<string, any>;
  window_handles: string[];
  current_window: string;
  page_state: {
    loading: boolean;
    ready_state: string;
    scroll_position: { x: number; y: number };
  };
}

// ============================================================================
// 节点相关类型 (Node Types)
// ============================================================================

export interface NodeDefinition {
  type: string;
  category: string;
  title: string;
  inputs: InputSocket[];
  outputs: OutputSocket[];
  properties: PropertyDefinition[];
  ui_config: UIConfig;
}

export interface InputSocket {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default_value?: any;
  validation?: ValidationRule[];
  description?: string;
}

export interface OutputSocket {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
}

export interface PropertyDefinition {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'file';
  label: string;
  default_value: any;
  options?: string[] | { value: any; label: string }[];
  validation?: ValidationRule[];
}

export interface UIConfig {
  width: number;
  height: number;
  color: string;
  icon?: string;
  collapsible: boolean;
  form_layout: 'vertical' | 'horizontal' | 'grid';
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface NodeExecutionData {
  node_id: string;
  node_type: string;
  properties: Record<string, any>;
  operation_units?: OperationUnit[];
  browser_handle_input?: string;
  browser_handle_output?: string;
  headless_mode: boolean;
}

// ============================================================================
// Canvas工作流相关类型 (Canvas Workflow Types)
// ============================================================================

export interface CanvasNodeInstance {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, any>;
  input_connections: Record<string, ConnectionRef>;
  output_connections: Record<string, ConnectionRef[]>;
  ui_state: {
    collapsed: boolean;
    selected: boolean;
    error_state?: string;
  };
}

export interface ConnectionRef {
  node_id: string;
  socket_name: string;
}

export interface CanvasConnection {
  id: string;
  from_node: string;
  from_socket: string;
  to_node: string;
  to_socket: string;
  data_type: string;
}

export interface CanvasWorkflowJSON {
  version: string;
  nodes: CanvasNodeInstance[];
  connections: CanvasConnection[];
  canvas_state: {
    zoom: number;
    pan: { x: number; y: number };
    grid_size: number;
  };
  execution_config: {
    mode: 'sequential' | 'parallel' | 'optimized';
    error_handling: 'stop' | 'continue' | 'retry';
    headless: boolean;
    timeout_seconds: number;
  };
  triggers: TriggerConfig[];
  metadata: {
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    version: string;
    tags: string[];
  };
}

// ============================================================================
// 任务和状态相关类型 (Task and State Types)
// ============================================================================

export enum TaskState {
  WAITING = 'waiting',
  EXECUTING = 'executing',
  ERROR = 'error',
  COMPLETED = 'completed'
}

export interface Task {
  id: string;
  workflow: CanvasWorkflowJSON;
  state: TaskState;
  trigger_config: TriggerConfig;
  created_at: string;
  updated_at: string;
}

export interface TriggerConfig {
  type: 'manual' | 'scheduled' | 'loop';
  cron_expression?: string;
  loop_interval?: number;
  max_executions?: number;
}

export interface ExecutionResult {
  success: boolean;
  results?: Record<string, any>;
  handle_chain?: Map<string, BrowserHandle>;
  error?: string;
  execution_time?: number;
}

// ============================================================================
// Cookie管理相关类型 (Cookie Management Types)
// ============================================================================

export interface CookieStore {
  domain: string;
  timestamp: string;
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
  }>;
}

// ============================================================================
// 错误处理相关类型 (Error Handling Types)
// ============================================================================

export interface AutomationError {
  type: 'element_not_found' | 'communication_error' | 'execution_error' | 'validation_error';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}