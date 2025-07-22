/**
 * ExecutionTypes - 执行序列相关类型定义
 * 职责：定义Action节点的执行序列、步骤和输出容器类型
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

// 元素选择器接口
export interface ElementSelector {
  css?: string;
  xpath?: string;
  text?: string;
  attributes?: Record<string, string>;
  nth?: number; // 第n个匹配元素
}

// 等待配置
export interface WaitConfig {
  type: 'time' | 'element' | 'network' | 'custom';
  duration?: number; // 时间等待(ms)
  selector?: ElementSelector; // 等待元素出现
  condition?: string; // 自定义条件JavaScript代码
  timeout?: number; // 超时时间(ms)
}

// 操作配置
export interface Operation {
  action: 'click' | 'input' | 'hover' | 'scroll' | 'extract' | 'screenshot' | 'navigate';
  target?: ElementSelector;
  parameters?: {
    text?: string; // 输入文本
    offset?: { x: number; y: number }; // 点击偏移
    scrollBy?: { x: number; y: number }; // 滚动距离
    url?: string; // 导航URL
    screenshotPath?: string; // 截图保存路径
  };
}

// 提取配置
export interface ExtractConfig {
  target: ElementSelector;
  extractType: 'text' | 'html' | 'attribute' | 'image' | 'link' | 'json';
  attributeName?: string; // 当extractType为'attribute'时使用
  multiple?: boolean; // 是否提取多个元素
  transform?: DataTransform;
}

// 数据转换规则
export interface DataTransform {
  regex?: string; // 正则提取
  replace?: { from: string; to: string }[]; // 文本替换
  format?: 'url' | 'number' | 'date' | 'json'; // 格式化
  validator?: string; // 数据验证规则JavaScript代码
}

// 循环配置
export interface LoopConfig {
  type: 'count' | 'condition' | 'forEach';
  count?: number; // 循环次数
  condition?: string; // 循环条件JavaScript代码
  maxIterations?: number; // 最大迭代次数
  breakOnError?: boolean; // 遇到错误是否跳出循环
}

// 动作步骤类型
export type ActionStepType = 'select' | 'operation' | 'wait' | 'extract';

// 基础动作步骤
export interface ActionStep {
  id: string;
  type: ActionStepType;
  name?: string; // 步骤名称
  description?: string; // 步骤描述
  
  // 具体配置（根据type决定哪些字段有效）
  selector?: ElementSelector;
  operation?: Operation;
  waitConfig?: WaitConfig;
  extractConfig?: ExtractConfig;
  
  // 执行控制
  continueOnError?: boolean; // 出错时是否继续
  retryCount?: number; // 重试次数
  timeout?: number; // 单步超时时间
}

// 执行序列
export interface ExecutionSequence {
  id: string;
  name: string;
  description?: string;
  steps: ActionStep[];
  condition?: string; // 执行条件JavaScript代码
  loop?: LoopConfig;
  parallel?: boolean; // 是否并行执行步骤
  continueOnError?: boolean; // 序列级别的错误处理
}

// 输出容器
export interface OutputContainer {
  id: string;
  name: string; // 变量名称
  type: 'text' | 'html' | 'attribute' | 'image' | 'link' | 'json' | 'screenshot';
  source: 'step' | 'sequence' | 'global'; // 数据源
  sourceId?: string; // 源步骤或序列ID
  transform?: DataTransform;
  storage: 'node' | 'global' | 'worker'; // 存储作用域
  persistent?: boolean; // 是否持久化存储
}

// Action节点配置
export interface ActionNodeConfig {
  workerId: string; // 绑定的Worker
  pageId: string; // 绑定的Page
  sequences: ExecutionSequence[];
  outputContainers: OutputContainer[];
  globalTimeout?: number; // 全局超时
  parallel?: boolean; // 是否并行执行序列
  onErrorStop?: boolean; // 遇到错误是否停止整个Action
}

// 步骤执行结果
export interface StepExecutionResult {
  stepId: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number; // 执行时间(ms)
  timestamp: string;
  retryCount: number;
}

// 序列执行结果
export interface SequenceExecutionResult {
  sequenceId: string;
  success: boolean;
  steps: StepExecutionResult[];
  outputData: Record<string, any>;
  error?: string;
  duration: number;
  timestamp: string;
}

// Action执行结果
export interface ActionExecutionResult {
  actionId: string;
  workerId: string;
  pageId: string;
  success: boolean;
  sequences: SequenceExecutionResult[];
  outputs: Record<string, any>;
  globalData: Record<string, any>;
  error?: string;
  duration: number;
  timestamp: string;
}

// 常用选择器工厂
export class SelectorFactory {
  static css(selector: string): ElementSelector {
    return { css: selector };
  }
  
  static xpath(xpath: string): ElementSelector {
    return { xpath };
  }
  
  static text(text: string): ElementSelector {
    return { text };
  }
  
  static attribute(name: string, value: string): ElementSelector {
    return { attributes: { [name]: value } };
  }
  
  static combined(css: string, text?: string, attributes?: Record<string, string>): ElementSelector {
    return { css, text, attributes };
  }
}

// 常用操作工厂
export class OperationFactory {
  static click(selector: ElementSelector, offset?: { x: number; y: number }): ActionStep {
    return {
      id: crypto.randomUUID(),
      type: 'operation',
      name: '点击操作',
      operation: {
        action: 'click',
        target: selector,
        parameters: { offset }
      }
    };
  }
  
  static input(selector: ElementSelector, text: string): ActionStep {
    return {
      id: crypto.randomUUID(),
      type: 'operation',
      name: '输入操作',
      operation: {
        action: 'input',
        target: selector,
        parameters: { text }
      }
    };
  }
  
  static wait(duration: number): ActionStep {
    return {
      id: crypto.randomUUID(),
      type: 'wait',
      name: '等待操作',
      waitConfig: {
        type: 'time',
        duration
      }
    };
  }
  
  static waitForElement(selector: ElementSelector, timeout = 10000): ActionStep {
    return {
      id: crypto.randomUUID(),
      type: 'wait',
      name: '等待元素',
      waitConfig: {
        type: 'element',
        selector,
        timeout
      }
    };
  }
  
  static extract(selector: ElementSelector, type: 'text' | 'html' | 'attribute' = 'text'): ActionStep {
    return {
      id: crypto.randomUUID(),
      type: 'extract',
      name: '提取数据',
      extractConfig: {
        target: selector,
        extractType: type
      }
    };
  }
}