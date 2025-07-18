/**
 * 系统常量定义
 * System constants definitions
 */

// ============================================================================
// 通信相关常量 (Communication Constants)
// ============================================================================

export const COMMUNICATION = {
  // WebSocket配置
  WEBSOCKET: {
    DEFAULT_PORT: 8765,
    DEFAULT_HOST: 'localhost',
    DEFAULT_PATH: '/ws',
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 5000, // 5 seconds
  },
  
  // REST API配置
  REST_API: {
    DEFAULT_PORT: 8000,
    DEFAULT_HOST: 'localhost',
    BASE_PATH: '/api/v1',
    TIMEOUT: 30000, // 30 seconds
  },
  
  // 消息类型
  MESSAGE_TYPES: {
    // Plugin <-> Orchestrator
    ELEMENT_SELECTED: 'element_selected',
    OPERATION_DEFINED: 'operation_defined',
    PLUGIN_STATUS: 'plugin_status',
    NODE_CONNECTION_REQUEST: 'node_connection_request',
    NODE_UPDATE: 'node_update',
    CONNECTION_STATUS: 'connection_status',
    
    // Orchestrator <-> Backend
    SAVE_WORKFLOW: 'save_workflow',
    LOAD_WORKFLOW: 'load_workflow',
    CREATE_TASK: 'create_task',
    
    // Backend <-> Executor
    EXECUTE_TASK: 'execute_task',
    TASK_STATUS_UPDATE: 'task_status_update',
    BROWSER_HANDLE_UPDATE: 'browser_handle_update',
  }
} as const;

// ============================================================================
// 节点相关常量 (Node Constants)
// ============================================================================

export const NODES = {
  // 节点类型
  TYPES: {
    UNIVERSAL_ACTION: 'universal_action',
    CONDITION_CHECK: 'condition_check',
    DELAY_WAIT: 'delay_wait',
    LOOP_CONTROL: 'loop_control',
    DATA_EXTRACTOR: 'data_extractor',
    BROWSER_NAVIGATOR: 'browser_navigator',
  },
  
  // 节点分类
  CATEGORIES: {
    WEB_ACTIONS: 'Web Actions',
    LOGIC: 'Logic',
    UTILITIES: 'Utilities',
    DATA: 'Data',
    BROWSER: 'Browser',
  },
  
  // Socket类型
  SOCKET_TYPES: {
    STRING: 'string',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    OBJECT: 'object',
    ARRAY: 'array',
    BROWSER_HANDLE: 'browser_handle',
  },
  
  // 默认尺寸
  DEFAULT_SIZE: {
    WIDTH: 250,
    HEIGHT: 200,
  },
  
  // 颜色主题
  COLORS: {
    WEB_ACTIONS: '#4CAF50',
    LOGIC: '#FF9800',
    UTILITIES: '#9C27B0',
    DATA: '#2196F3',
    BROWSER: '#F44336',
  }
} as const;

// ============================================================================
// Canvas相关常量 (Canvas Constants)
// ============================================================================

export const CANVAS = {
  // 默认配置
  DEFAULT_ZOOM: 1.0,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 3.0,
  ZOOM_STEP: 0.1,
  
  // 网格配置
  GRID_SIZE: 20,
  GRID_COLOR: '#e0e0e0',
  GRID_MAJOR_COLOR: '#c0c0c0',
  GRID_MAJOR_INTERVAL: 5,
  
  // 连接线配置
  CONNECTION_COLOR: '#666666',
  CONNECTION_HOVER_COLOR: '#2196F3',
  CONNECTION_SELECTED_COLOR: '#4CAF50',
  CONNECTION_WIDTH: 2,
  CONNECTION_HOVER_WIDTH: 3,
  
  // 选择框配置
  SELECTION_COLOR: '#2196F3',
  SELECTION_ALPHA: 0.2,
  SELECTION_BORDER_WIDTH: 1,
  
  // 拖拽配置
  DRAG_THRESHOLD: 5, // pixels
  SNAP_THRESHOLD: 10, // pixels
} as const;

// ============================================================================
// 操作相关常量 (Operation Constants)
// ============================================================================

export const OPERATIONS = {
  // 观察类型
  OBSERVATION_TYPES: {
    ELEMENT_EXISTS: 'element_exists',
    TEXT_CONTAINS: 'text_contains',
    ATTRIBUTE_EQUALS: 'attribute_equals',
    PAGE_LOADED: 'page_loaded',
  },
  
  // 动作类型
  ACTION_TYPES: {
    CLICK: 'click',
    INPUT: 'input',
    HOVER: 'hover',
    SCROLL: 'scroll',
    EXTRACT: 'extract',
    NAVIGATE: 'navigate',
    WAIT: 'wait',
    KEYBOARD: 'keyboard',
  },
  
  // 条件类型
  CONDITION_TYPES: {
    IF: 'if',
    WHILE: 'while',
    UNTIL: 'until',
  },
  
  // 循环类型
  LOOP_TYPES: {
    FOR: 'for',
    WHILE: 'while',
    FOREACH: 'foreach',
  },
  
  // 默认超时时间
  DEFAULT_TIMEOUT: 5000, // 5 seconds
  DEFAULT_RETRY_COUNT: 3,
  DEFAULT_DELAY: 1000, // 1 second
} as const;

// ============================================================================
// 元素定位相关常量 (Element Locator Constants)
// ============================================================================

export const LOCATORS = {
  // 定位器类型
  TYPES: {
    CSS: 'css',
    XPATH: 'xpath',
    ID: 'id',
    CLASS: 'class',
    ATTRIBUTES: 'attributes',
  },
  
  // 定位器优先级
  PRIORITY: ['id', 'css', 'xpath', 'attributes'],
  
  // 验证规则
  VALIDATION: {
    CSS_SELECTOR_REGEX: /^[a-zA-Z0-9\-_\[\]="':.,#\s>+~*()]+$/,
    XPATH_REGEX: /^\/\/|^\/|\.|@/,
  }
} as const;

// ============================================================================
// 任务状态相关常量 (Task State Constants)
// ============================================================================

export const TASK_STATES = {
  WAITING: 'waiting',
  EXECUTING: 'executing',
  ERROR: 'error',
  COMPLETED: 'completed',
} as const;

export const TRIGGER_TYPES = {
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
  LOOP: 'loop',
} as const;

// ============================================================================
// 错误相关常量 (Error Constants)
// ============================================================================

export const ERROR_TYPES = {
  ELEMENT_NOT_FOUND: 'element_not_found',
  COMMUNICATION_ERROR: 'communication_error',
  EXECUTION_ERROR: 'execution_error',
  VALIDATION_ERROR: 'validation_error',
  TIMEOUT_ERROR: 'timeout_error',
  NETWORK_ERROR: 'network_error',
} as const;

// ============================================================================
// 文件相关常量 (File Constants)
// ============================================================================

export const FILES = {
  // 工作流文件
  WORKFLOW_EXTENSION: '.json',
  WORKFLOW_VERSION: '1.0',
  
  // Cookie文件
  COOKIE_EXTENSION: '.json',
  COOKIE_FILENAME_FORMAT: '{domain}_{timestamp}',
  
  // 日志文件
  LOG_EXTENSION: '.log',
  LOG_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  LOG_MAX_FILES: 5,
} as const;

// ============================================================================
// 浏览器相关常量 (Browser Constants)
// ============================================================================

export const BROWSER = {
  // Camoufox配置
  CAMOUFOX: {
    DEFAULT_TIMEOUT: 30000, // 30 seconds
    PAGE_LOAD_TIMEOUT: 60000, // 60 seconds
    SCRIPT_TIMEOUT: 30000, // 30 seconds
    IMPLICIT_WAIT: 10000, // 10 seconds
  },
  
  // 实例池配置
  INSTANCE_POOL: {
    MIN_SIZE: 1,
    MAX_SIZE: 5,
    IDLE_TIMEOUT: 300000, // 5 minutes
    HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  },
  
  // 窗口配置
  WINDOW: {
    DEFAULT_WIDTH: 1920,
    DEFAULT_HEIGHT: 1080,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
  }
} as const;

// ============================================================================
// 性能相关常量 (Performance Constants)
// ============================================================================

export const PERFORMANCE = {
  // 缓存配置
  CACHE: {
    MAX_SIZE: 1000,
    TTL: 300000, // 5 minutes
  },
  
  // 并发限制
  CONCURRENCY: {
    MAX_CONCURRENT_TASKS: 3,
    MAX_CONCURRENT_REQUESTS: 10,
    RATE_LIMIT_REQUESTS_PER_MINUTE: 100,
  },
  
  // 内存限制
  MEMORY: {
    MAX_WORKFLOW_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_LOG_ENTRIES: 10000,
  }
} as const;

// ============================================================================
// 开发相关常量 (Development Constants)
// ============================================================================

export const DEVELOPMENT = {
  // 调试配置
  DEBUG: {
    ENABLE_CONSOLE_LOGS: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_ERROR_TRACKING: true,
  },
  
  // 测试配置
  TESTING: {
    MOCK_DELAY: 100, // milliseconds
    TIMEOUT: 5000, // 5 seconds
  }
} as const;