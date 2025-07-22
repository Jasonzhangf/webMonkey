/**
 * Content Generator Node - 内容生成节点
 * 生成各种典型的JSON测试数据
 */

import { BaseNode, NodePosition } from './BaseNode';

export interface ContentTemplate {
  name: string;
  description: string;
  generator: () => any;
}

export class ContentGeneratorNode extends BaseNode {
  private templates: Map<string, ContentTemplate> = new Map();

  constructor(position: NodePosition) {
    super(position, 'ContentGenerator');
    this.title = 'Content Generator';
    
    // 添加输出端口
    this.outputs.push({ id: 'output', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false });
    
    // 初始化模板
    this.initializeTemplates();
    
    // 设置默认属性
    this.properties = {
      templateName: 'user-profile',
      customCount: 5,
      includeTimestamp: true,
      ...this.properties
    };
    
    this.updatePortPositions();
  }

  private initializeTemplates(): void {
    // 用户资料模板
    this.templates.set('user-profile', {
      name: '用户资料',
      description: '生成用户个人信息数据',
      generator: () => ({
        user: {
          id: Math.floor(Math.random() * 10000),
          name: this.getRandomName(),
          email: `${this.getRandomString(6)}@example.com`,
          age: Math.floor(Math.random() * 50) + 18,
          profile: {
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
            location: this.getRandomLocation(),
            bio: this.getRandomBio(),
            preferences: {
              theme: Math.random() > 0.5 ? 'dark' : 'light',
              language: Math.random() > 0.7 ? 'en' : 'zh-CN',
              notifications: {
                email: Math.random() > 0.3,
                push: Math.random() > 0.4,
                sms: Math.random() > 0.8
              }
            }
          },
          status: this.getRandomStatus(),
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
    });

    // 产品数据模板
    this.templates.set('product-catalog', {
      name: '产品目录',
      description: '生成商品信息数据',
      generator: () => ({
        products: Array.from({ length: this.properties.customCount || 5 }, (_, i) => ({
          id: `prod_${1000 + i}`,
          name: this.getRandomProductName(),
          category: this.getRandomCategory(),
          price: {
            original: Math.floor(Math.random() * 1000) + 100,
            discount: Math.random() > 0.6 ? Math.floor(Math.random() * 50) + 10 : null,
            currency: 'CNY'
          },
          inventory: {
            stock: Math.floor(Math.random() * 100),
            reserved: Math.floor(Math.random() * 10),
            available: function() { return this.stock - this.reserved; }
          },
          attributes: {
            brand: this.getRandomBrand(),
            color: this.getRandomColor(),
            size: this.getRandomSize(),
            weight: `${(Math.random() * 5 + 0.1).toFixed(1)}kg`
          },
          reviews: {
            count: Math.floor(Math.random() * 500),
            average: (Math.random() * 2 + 3).toFixed(1),
            distribution: {
              5: Math.floor(Math.random() * 100),
              4: Math.floor(Math.random() * 80),
              3: Math.floor(Math.random() * 40),
              2: Math.floor(Math.random() * 20),
              1: Math.floor(Math.random() * 10)
            }
          }
        }))
      })
    });

    // 任务列表模板
    this.templates.set('task-list', {
      name: '任务列表',
      description: '生成项目任务数据',
      generator: () => ({
        project: {
          id: `proj_${Math.floor(Math.random() * 1000)}`,
          name: this.getRandomProjectName(),
          description: '这是一个示例项目',
          status: this.getRandomProjectStatus()
        },
        tasks: Array.from({ length: this.properties.customCount || 5 }, (_, i) => ({
          id: `task_${i + 1}`,
          title: this.getRandomTaskTitle(),
          description: this.getRandomTaskDescription(),
          status: this.getRandomTaskStatus(),
          priority: this.getRandomPriority(),
          assignee: {
            id: Math.floor(Math.random() * 10) + 1,
            name: this.getRandomName(),
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${Math.random()}`
          },
          tags: this.getRandomTags(),
          dates: {
            created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            due: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            completed: Math.random() > 0.7 ? new Date().toISOString() : null
          },
          progress: Math.floor(Math.random() * 101)
        }))
      })
    });

    // API响应模板
    this.templates.set('api-response', {
      name: 'API响应',
      description: '生成标准API响应格式',
      generator: () => ({
        success: Math.random() > 0.1,
        code: Math.random() > 0.1 ? 200 : this.getRandomErrorCode(),
        message: Math.random() > 0.1 ? 'Success' : this.getRandomErrorMessage(),
        data: {
          items: Array.from({ length: this.properties.customCount || 3 }, () => ({
            id: Math.floor(Math.random() * 10000),
            type: this.getRandomItemType(),
            value: Math.random() * 100,
            metadata: {
              source: 'api',
              version: '1.0',
              cached: Math.random() > 0.5
            }
          })),
          pagination: {
            page: 1,
            perPage: this.properties.customCount || 3,
            total: Math.floor(Math.random() * 100) + 10,
            hasNext: Math.random() > 0.5
          }
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Math.random().toString(36).substr(2, 9)}`
      })
    });
  }

  public async execute(_input: any): Promise<{ [portId: string]: any }> {
    console.log('ContentGeneratorNode executing...');
    
    const templateName = this.properties.templateName || 'user-profile';
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    let generatedData = template.generator();

    // 添加时间戳（如果启用）
    if (this.properties.includeTimestamp) {
      generatedData = {
        ...generatedData,
        generatedAt: new Date().toISOString(),
        generator: {
          node: 'ContentGenerator',
          template: templateName,
          version: '1.0'
        }
      };
    }

    return {
      'output': {
        payload: generatedData,
        errors: []
      }
    };
  }

  // 随机数据生成辅助方法
  private getRandomName(): string {
    const names = ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十', '孙悟空', '猪八戒'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private getRandomLocation(): string {
    const locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '西安', '南京', '武汉'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private getRandomBio(): string {
    const bios = [
      '热爱技术，喜欢分享',
      '全栈开发工程师',
      '代码改变世界',
      '永远保持学习的心态',
      '用代码创造美好生活'
    ];
    return bios[Math.floor(Math.random() * bios.length)];
  }

  private getRandomStatus(): string {
    const statuses = ['active', 'inactive', 'pending', 'suspended'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getRandomProductName(): string {
    const adjectives = ['智能', '高端', '便携', '专业', '时尚'];
    const nouns = ['手机', '耳机', '键盘', '鼠标', '显示器', '音响', '充电器'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
  }

  private getRandomCategory(): string {
    const categories = ['电子产品', '服装配饰', '家居用品', '运动户外', '图书文具'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private getRandomBrand(): string {
    const brands = ['Apple', 'Samsung', '华为', '小米', 'OPPO', 'vivo'];
    return brands[Math.floor(Math.random() * brands.length)];
  }

  private getRandomColor(): string {
    const colors = ['黑色', '白色', '银色', '金色', '蓝色', '红色'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getRandomSize(): string {
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private getRandomTaskTitle(): string {
    const actions = ['实现', '优化', '修复', '设计', '测试', '部署'];
    const objects = ['用户界面', '数据库', 'API接口', '登录功能', '支付模块', '通知系统'];
    return `${actions[Math.floor(Math.random() * actions.length)]}${objects[Math.floor(Math.random() * objects.length)]}`;
  }

  private getRandomTaskDescription(): string {
    const descriptions = [
      '这是一个重要的任务，需要仔细处理',
      '涉及多个模块，需要协调处理',
      '优先级较高，请尽快完成',
      '需要与设计团队协作完成',
      '包含前端和后端的修改'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private getRandomTaskStatus(): string {
    const statuses = ['pending', 'in-progress', 'completed', 'blocked'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getRandomPriority(): string {
    const priorities = ['low', 'medium', 'high', 'critical'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  private getRandomTags(): string[] {
    const allTags = ['前端', '后端', '数据库', 'UI/UX', '测试', '部署', '优化', '重构'];
    const count = Math.floor(Math.random() * 3) + 1;
    return allTags.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private getRandomProjectName(): string {
    const prefixes = ['智能', '数字化', '云端', '移动', '企业级'];
    const suffixes = ['平台', '系统', '应用', '解决方案', '管理系统'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }

  private getRandomProjectStatus(): string {
    const statuses = ['planning', 'active', 'on-hold', 'completed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getRandomErrorCode(): number {
    const codes = [400, 401, 403, 404, 500, 502, 503];
    return codes[Math.floor(Math.random() * codes.length)];
  }

  private getRandomErrorMessage(): string {
    const messages = ['Bad Request', 'Unauthorized', 'Forbidden', 'Not Found', 'Internal Server Error'];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private getRandomItemType(): string {
    const types = ['user', 'product', 'order', 'invoice', 'report'];
    return types[Math.floor(Math.random() * types.length)];
  }

  public getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  public getTemplateDescription(templateName: string): string {
    const template = this.templates.get(templateName);
    return template ? template.description : '';
  }
}