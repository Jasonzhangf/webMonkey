/**
 * Test System Entry Point - 测试系统入口
 * 导出所有测试相关的类和函数
 */

export { WorkflowTestFramework } from './WorkflowTestFramework';
export { JsonDataFlowTests } from './JsonDataFlowTests';
export { TestRunner } from './TestRunner';
export { runTestDemo, runManualTestDemo, demonstrateDataSnapshots } from './demo';

export type {
  TestCase,
  TestResult,
  DataSnapshot,
  TestAssertion
} from './WorkflowTestFramework';

// 测试系统配置
export const TEST_CONFIG = {
  // 默认测试超时时间 (ms)
  DEFAULT_TIMEOUT: 5000,
  
  // 测试间隔时间 (ms)
  TEST_INTERVAL: 100,
  
  // 数据快照保留数量
  MAX_SNAPSHOTS: 100,
  
  // 测试结果保留数量  
  MAX_RESULTS: 50,
  
  // 支持的断言类型
  ASSERTION_TYPES: ['equals', 'contains', 'typeof', 'custom'] as const,
  
  // 测试节点类型
  TESTABLE_NODE_TYPES: [
    'Start',
    'ContentGenerator', 
    'JsonMerger',
    'JsonFilter',
    'Display',
    'End'
  ] as const
};

// 全局测试工具函数
export const TestUtils = {
  /**
   * 等待指定时间
   */
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * 生成测试数据
   */
  generateTestData: (type: 'simple' | 'complex' | 'array' = 'simple') => {
    switch (type) {
      case 'simple':
        return { id: 1, name: 'Test Item', value: 100 };
      case 'complex':
        return {
          id: 1,
          name: 'Complex Item',
          value: 100,
          metadata: {
            created: Date.now(),
            tags: ['test', 'data'],
            config: { enabled: true, priority: 'high' }
          }
        };
      case 'array':
        return [
          { id: 1, name: 'Item 1', category: 'A' },
          { id: 2, name: 'Item 2', category: 'B' },
          { id: 3, name: 'Item 3', category: 'C' }
        ];
      default:
        return {};
    }
  },
  
  /**
   * 验证JSON格式
   */
  isValidJSON: (data: any): boolean => {
    try {
      JSON.stringify(data);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * 深度比较两个对象
   */
  deepEqual: (obj1: any, obj2: any): boolean => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },
  
  /**
   * 创建模拟节点数据
   */
  createMockNode: (type: string, properties: any = {}) => {
    return {
      id: `mock-${type.toLowerCase()}-${Date.now()}`,
      type,
      title: `Mock ${type}`,
      position: { x: 100, y: 100 },
      properties,
      executionState: 'idle' as const
    };
  }
};

console.log('🧪 Workflow Test System initialized');
console.log('📝 Available test utilities:', Object.keys(TestUtils));
console.log('⚙️ Test configuration:', TEST_CONFIG);