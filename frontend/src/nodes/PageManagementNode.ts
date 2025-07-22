/**
 * PageManagementNode - 页面管理节点
 * 职责：管理Worker中的页面（标签页），支持创建、切换、关闭操作
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */
import { BaseNode, NodePosition, WorkflowData } from './BaseNode';

export type PageAction = 'create' | 'switch' | 'close' | 'navigate' | 'reload' | 'list';

export interface PageConfig {
  action: PageAction;
  pageId?: string; // 目标页面ID
  url?: string; // 导航URL
  waitForLoad?: boolean; // 是否等待加载完成
  timeout?: number; // 超时时间
  reuseExisting?: boolean; // 是否重用已存在的页面
}

export interface PageInfo {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
  loadState: 'loading' | 'loaded' | 'error';
  createdAt: string;
  lastActiveAt: string;
}

export interface PageManagementResult {
  action: PageAction;
  success: boolean;
  pageInfo?: PageInfo;
  allPages?: PageInfo[];
  activePageId?: string;
  error?: string;
  timestamp: string;
}

export class PageManagementNode extends BaseNode {
  private config: PageConfig;

  constructor(position: NodePosition) {
    super(position, '页面管理');
    this.type = 'PageManagement';
    
    // 页面管理节点需要Worker绑定
    this.requiresWorkerBinding = true;
    this.requiresPageBinding = false; // 页面管理不需要绑定到特定页面
    
    // 初始化默认配置
    this.config = {
      action: 'create',
      url: '',
      waitForLoad: true,
      timeout: 30000,
      reuseExisting: false
    };

    this.setupPorts();
    this.setupProperties();
    this.updatePortPositions();
  }

  private setupPorts(): void {
    this.inputs = [{
      id: 'in',
      nodeId: this.id,
      position: { x: 0, y: 0 },
      isInput: true,
      portNumber: 1
    }];

    // 根据操作类型有不同的输出端口
    this.outputs = [
      {
        id: 'success',
        nodeId: this.id,
        position: { x: 0, y: 0 },
        isInput: false,
        portNumber: 1
      },
      {
        id: 'error',
        nodeId: this.id,
        position: { x: 0, y: 0 },
        isInput: false,
        portNumber: 2
      }
    ];
  }

  private setupProperties(): void {
    this.properties = {
      action: this.config.action,
      pageId: this.config.pageId || '',
      url: this.config.url || '',
      waitForLoad: this.config.waitForLoad,
      timeout: this.config.timeout,
      reuseExisting: this.config.reuseExisting
    };
  }

  public async execute(input: WorkflowData): Promise<{ [portId: string]: WorkflowData }> {
    try {
      this.executionState = 'running';
      this.updateConfigFromProperties();

      // 验证Worker绑定
      const bindingValidation = this.validateBindings();
      if (!bindingValidation.isValid) {
        throw new Error(`绑定验证失败: ${bindingValidation.errors.join(', ')}`);
      }

      const result = await this.executePageAction(input.payload);

      this.executionState = result.success ? 'completed' : 'failed';

      const outputData: WorkflowData = {
        payload: {
          ...input.payload,
          pageManagementResult: result
        },
        errors: result.success ? [] : [result.error || '页面管理操作失败']
      };

      return result.success ? 
        { 'success': outputData } : 
        { 'error': outputData };

    } catch (error) {
      this.executionState = 'failed';
      
      const errorData: WorkflowData = {
        payload: null,
        errors: [`页面管理异常: ${error instanceof Error ? error.message : String(error)}`]
      };

      return { 'error': errorData };
    }
  }

  private async executePageAction(_inputData: any): Promise<PageManagementResult> {
    const result: PageManagementResult = {
      action: this.config.action,
      success: true,
      timestamp: new Date().toISOString()
    };

    try {
      // 构建页面管理命令（实际应该发送到后端）
      console.log('PAGE_MANAGEMENT command:', {
        type: 'PAGE_MANAGEMENT',
        workerId: this.workerId,
        action: this.config.action,
        config: this.config,
        timestamp: Date.now()
      });

      // 根据不同操作执行相应逻辑
      switch (this.config.action) {
        case 'create':
          result.pageInfo = await this.createPage();
          break;
        case 'switch':
          result.pageInfo = await this.switchPage();
          break;
        case 'close':
          result.success = await this.closePage();
          break;
        case 'navigate':
          result.pageInfo = await this.navigatePage();
          break;
        case 'reload':
          result.pageInfo = await this.reloadPage();
          break;
        case 'list':
          result.allPages = await this.listPages();
          break;
        default:
          throw new Error(`不支持的页面操作: ${this.config.action}`);
      }

      return result;

    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      return result;
    }
  }

  private async createPage(): Promise<PageInfo> {
    // 检查是否重用已存在的页面
    if (this.config.reuseExisting && this.config.url) {
      const existingPages = await this.listPages();
      const existingPage = existingPages.find(page => page.url === this.config.url);
      if (existingPage) {
        return existingPage;
      }
    }

    // 创建新页面（模拟，实际应该调用后端API）
    const pageInfo: PageInfo = {
      id: crypto.randomUUID(),
      url: this.config.url || 'about:blank',
      title: '新页面',
      isActive: true,
      loadState: 'loading',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    console.log(`创建页面: ${pageInfo.id}, URL: ${pageInfo.url}`);
    
    // 如果需要等待加载完成
    if (this.config.waitForLoad) {
      await this.simulatePageLoad();
      pageInfo.loadState = 'loaded';
      pageInfo.title = `页面 - ${new URL(pageInfo.url).hostname}`;
    }

    return pageInfo;
  }

  private async switchPage(): Promise<PageInfo> {
    if (!this.config.pageId) {
      throw new Error('切换页面需要指定pageId');
    }

    // 模拟切换到指定页面
    console.log(`切换到页面: ${this.config.pageId}`);
    
    const pageInfo: PageInfo = {
      id: this.config.pageId,
      url: 'https://example.com',
      title: '已切换的页面',
      isActive: true,
      loadState: 'loaded',
      createdAt: new Date(Date.now() - 60000).toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    return pageInfo;
  }

  private async closePage(): Promise<boolean> {
    if (!this.config.pageId) {
      throw new Error('关闭页面需要指定pageId');
    }

    console.log(`关闭页面: ${this.config.pageId}`);
    
    // 模拟关闭页面
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  private async navigatePage(): Promise<PageInfo> {
    if (!this.config.url) {
      throw new Error('页面导航需要指定URL');
    }

    const currentPageId = this.config.pageId || this.pageId || 'current';
    
    console.log(`导航页面 ${currentPageId} 到: ${this.config.url}`);
    
    const pageInfo: PageInfo = {
      id: currentPageId,
      url: this.config.url,
      title: '导航中...',
      isActive: true,
      loadState: 'loading',
      createdAt: new Date(Date.now() - 60000).toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    if (this.config.waitForLoad) {
      await this.simulatePageLoad();
      pageInfo.loadState = 'loaded';
      pageInfo.title = `页面 - ${new URL(pageInfo.url).hostname}`;
    }

    return pageInfo;
  }

  private async reloadPage(): Promise<PageInfo> {
    const currentPageId = this.config.pageId || this.pageId || 'current';
    
    console.log(`重载页面: ${currentPageId}`);
    
    const pageInfo: PageInfo = {
      id: currentPageId,
      url: 'https://example.com',
      title: '重载中...',
      isActive: true,
      loadState: 'loading',
      createdAt: new Date(Date.now() - 60000).toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    if (this.config.waitForLoad) {
      await this.simulatePageLoad();
      pageInfo.loadState = 'loaded';
      pageInfo.title = `页面 - ${new URL(pageInfo.url).hostname}`;
    }

    return pageInfo;
  }

  private async listPages(): Promise<PageInfo[]> {
    console.log('获取页面列表');
    
    // 模拟返回页面列表
    return [
      {
        id: 'page-1',
        url: 'https://example.com',
        title: 'Example Domain',
        isActive: true,
        loadState: 'loaded',
        createdAt: new Date(Date.now() - 300000).toISOString(),
        lastActiveAt: new Date().toISOString()
      },
      {
        id: 'page-2',
        url: 'https://github.com',
        title: 'GitHub',
        isActive: false,
        loadState: 'loaded',
        createdAt: new Date(Date.now() - 180000).toISOString(),
        lastActiveAt: new Date(Date.now() - 60000).toISOString()
      }
    ];
  }

  private async simulatePageLoad(): Promise<void> {
    // 模拟页面加载时间
    const loadTime = Math.random() * 2000 + 500; // 0.5-2.5秒
    await new Promise(resolve => setTimeout(resolve, loadTime));
  }

  private updateConfigFromProperties(): void {
    this.config = {
      action: this.properties.action as PageAction || 'create',
      pageId: this.properties.pageId || undefined,
      url: this.properties.url || undefined,
      waitForLoad: this.properties.waitForLoad !== false,
      timeout: this.properties.timeout || 30000,
      reuseExisting: this.properties.reuseExisting || false
    };
  }

  // 公共方法：获取配置
  public getConfig(): PageConfig {
    this.updateConfigFromProperties();
    return { ...this.config };
  }

  // 公共方法：设置操作类型
  public setAction(action: PageAction, config?: Partial<PageConfig>): void {
    this.config.action = action;
    if (config) {
      Object.assign(this.config, config);
      // 更新属性
      Object.entries(config).forEach(([key, value]) => {
        if (value !== undefined) {
          this.properties[key] = value;
        }
      });
    }
    this.properties.action = action;
  }

  // 公共方法：验证配置
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.action === 'navigate' && !this.config.url) {
      errors.push('导航操作需要指定URL');
    }

    if ((this.config.action === 'switch' || this.config.action === 'close') && !this.config.pageId) {
      errors.push(`${this.config.action}操作需要指定pageId`);
    }

    if (this.config.url) {
      try {
        new URL(this.config.url);
      } catch {
        errors.push('URL格式无效');
      }
    }

    if (this.config.timeout && this.config.timeout <= 0) {
      errors.push('超时时间必须大于0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}