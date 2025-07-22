/**
 * WorkerInitializationNode - Worker初始化节点
 * 职责：配置和初始化浏览器Worker，设置全局浏览器环境
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */
import { BaseNode, NodePosition, WorkflowData } from './BaseNode';

// Worker配置接口 - 来自CLAUDE.md架构定义
export interface WorkerConfig {
  // 浏览器基础配置
  headless: boolean;           // 无头模式
  viewport: {                  // 视口大小
    width: number;
    height: number;
  };
  userAgent: string;          // 用户代理
  
  // 会话配置
  cookies: Cookie[];          // 预设Cookie
  localStorage: Record<string, string>; // 本地存储
  sessionStorage: Record<string, string>; // 会话存储
  
  // 目标网页
  initialUrl: string;         // 初始访问页面
  
  // 性能配置
  timeout: number;            // 默认超时时间(ms)
  waitForLoadState: 'load' | 'domcontentloaded' | 'networkidle';
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

// Worker全局变量接口
export interface WorkerGlobalVariables {
  browserHandle: any;         // 浏览器句柄
  context: any;              // 浏览器上下文
  currentPage: any;          // 当前活动页面
  pages: Map<string, any>;   // 页面管理器
  workerConfig: WorkerConfig; // Worker配置
  globalStorage: Map<string, any>; // Worker级别的数据存储
}

export class WorkerInitializationNode extends BaseNode {
  private workerConfig: WorkerConfig;

  constructor(position: NodePosition) {
    super(position, 'Worker初始化');
    this.type = 'WorkerInitialization';
    
    // 初始化默认配置
    this.workerConfig = {
      headless: false,
      viewport: {
        width: 1920,
        height: 1080
      },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      initialUrl: 'https://www.example.com',
      timeout: 30000,
      waitForLoadState: 'load'
    };

    // 设置属性
    this.properties = {
      headless: this.workerConfig.headless,
      viewportWidth: this.workerConfig.viewport.width,
      viewportHeight: this.workerConfig.viewport.height,
      userAgent: this.workerConfig.userAgent,
      initialUrl: this.workerConfig.initialUrl,
      timeout: this.workerConfig.timeout,
      waitForLoadState: this.workerConfig.waitForLoadState,
      cookiesJson: '[]', // JSON格式的cookies字符串
      localStorageJson: '{}', // JSON格式的localStorage字符串
      sessionStorageJson: '{}' // JSON格式的sessionStorage字符串
    };

    this.setupPorts();
    this.updatePortPositions();
  }

  private setupPorts(): void {
    // Worker初始化节点没有输入端口（作为工作流的起始点）
    this.inputs = [];

    // 输出端口：Worker初始化完成信号
    this.outputs = [
      {
        id: 'worker_initialized',
        nodeId: this.id,
        position: { x: 0, y: 0 }, // 会被updatePortPositions更新
        isInput: false,
        portNumber: 1
      }
    ];
  }

  public async execute(_input: WorkflowData): Promise<{ [portId: string]: WorkflowData }> {
    try {
      // 更新配置从属性中读取最新值
      this.updateConfigFromProperties();

      // 创建Worker全局变量
      const globalVariables: WorkerGlobalVariables = {
        browserHandle: null, // 将由后端实际创建
        context: null,
        currentPage: null,
        pages: new Map(),
        workerConfig: this.workerConfig,
        globalStorage: new Map()
      };

      // 构建初始化命令
      const initializationData = {
        type: 'WORKER_INITIALIZATION',
        config: this.workerConfig,
        workerId: this.id,
        timestamp: Date.now()
      };

      const output: WorkflowData = {
        payload: {
          ...initializationData,
          globalVariables
        },
        errors: []
      };

      this.executionState = 'completed';
      
      return {
        'worker_initialized': output
      };

    } catch (error) {
      this.executionState = 'failed';
      
      return {
        'worker_initialized': {
          payload: null,
          errors: [`Worker初始化失败: ${error instanceof Error ? error.message : String(error)}`]
        }
      };
    }
  }

  private updateConfigFromProperties(): void {
    // 从properties更新workerConfig
    this.workerConfig = {
      headless: this.properties.headless || false,
      viewport: {
        width: this.properties.viewportWidth || 1920,
        height: this.properties.viewportHeight || 1080
      },
      userAgent: this.properties.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      initialUrl: this.properties.initialUrl || 'https://www.example.com',
      timeout: this.properties.timeout || 30000,
      waitForLoadState: this.properties.waitForLoadState || 'load',
      cookies: this.parseCookiesFromJson(this.properties.cookiesJson || '[]'),
      localStorage: this.parseJsonProperty(this.properties.localStorageJson, {}),
      sessionStorage: this.parseJsonProperty(this.properties.sessionStorageJson, {})
    };
  }

  private parseCookiesFromJson(cookiesJson: string): Cookie[] {
    try {
      const parsed = JSON.parse(cookiesJson);
      if (Array.isArray(parsed)) {
        return parsed.filter(cookie => 
          cookie && typeof cookie === 'object' && 
          cookie.name && cookie.value && cookie.domain
        );
      }
      return [];
    } catch (error) {
      console.warn('Invalid cookies JSON:', cookiesJson);
      return [];
    }
  }

  private parseJsonProperty(jsonString: string, defaultValue: any): any {
    try {
      return JSON.parse(jsonString || JSON.stringify(defaultValue));
    } catch (error) {
      console.warn('Invalid JSON property:', jsonString);
      return defaultValue;
    }
  }

  // 获取Worker配置（供其他节点访问）
  public getWorkerConfig(): WorkerConfig {
    this.updateConfigFromProperties();
    return { ...this.workerConfig };
  }

  // 验证配置
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.workerConfig.initialUrl) {
      errors.push('初始URL不能为空');
    } else {
      try {
        new URL(this.workerConfig.initialUrl);
      } catch {
        errors.push('初始URL格式无效');
      }
    }

    if (this.workerConfig.viewport.width <= 0 || this.workerConfig.viewport.height <= 0) {
      errors.push('视口尺寸必须大于0');
    }

    if (this.workerConfig.timeout <= 0) {
      errors.push('超时时间必须大于0');
    }

    if (!this.workerConfig.userAgent.trim()) {
      errors.push('用户代理不能为空');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 重置为默认配置
  public resetToDefaults(): void {
    this.workerConfig = {
      headless: false,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      initialUrl: 'https://www.example.com',
      timeout: 30000,
      waitForLoadState: 'load'
    };

    // 更新properties
    this.properties = {
      headless: this.workerConfig.headless,
      viewportWidth: this.workerConfig.viewport.width,
      viewportHeight: this.workerConfig.viewport.height,
      userAgent: this.workerConfig.userAgent,
      initialUrl: this.workerConfig.initialUrl,
      timeout: this.workerConfig.timeout,
      waitForLoadState: this.workerConfig.waitForLoadState,
      cookiesJson: '[]',
      localStorageJson: '{}',
      sessionStorageJson: '{}'
    };
  }
}