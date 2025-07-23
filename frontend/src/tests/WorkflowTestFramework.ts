/**
 * Workflow Test Framework - 工作流自动化测试框架
 * 职责：模拟节点执行、验证数据流转、确保数据管理符合预期
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

import { BaseNode } from '../nodes/BaseNode';
import { CanvasEditor } from '../canvas/CanvasEditor';
import { editorState } from '../state/EditorState';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<TestResult>;
  cleanup?: () => Promise<void>;
}

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  executionTime: number;
  dataSnapshots?: DataSnapshot[];
}

export interface DataSnapshot {
  nodeId: string;
  nodeName: string;
  timestamp: number;
  inputData: any;
  outputData: any;
  properties: any;
}

export interface TestAssertion {
  type: 'equals' | 'contains' | 'typeof' | 'custom';
  expected: any;
  actual: any;
  message: string;
}

export class WorkflowTestFramework {
  private editor: CanvasEditor | null = null;
  private testResults: TestResult[] = [];
  // private currentTest: TestCase | null = null;
  private dataSnapshots: DataSnapshot[] = [];
  
  constructor() {
    this.setupGlobalTestEnvironment();
  }
  
  private setupGlobalTestEnvironment(): void {
    // 创建测试环境的全局配置
    (window as any).isTestEnvironment = true;
    (window as any).testFramework = this;
    
    console.log('🧪 Workflow Test Framework initialized');
  }
  
  public setEditor(editor: CanvasEditor): void {
    this.editor = editor;
    console.log('✅ Canvas Editor attached to test framework');
  }
  
  public async runTest(testCase: TestCase): Promise<TestResult> {
    console.log(`🚀 Running test: ${testCase.name}`);
    // this.currentTest = testCase;
    this.dataSnapshots = [];
    
    const startTime = performance.now();
    
    try {
      // 1. Setup phase
      await testCase.setup();
      console.log(`✅ Setup completed for test: ${testCase.name}`);
      
      // 2. Execute phase
      const result = await testCase.execute();
      result.executionTime = performance.now() - startTime;
      result.dataSnapshots = [...this.dataSnapshots];
      
      // 3. Cleanup phase
      if (testCase.cleanup) {
        await testCase.cleanup();
      }
      
      this.testResults.push(result);
      
      if (result.success) {
        console.log(`✅ Test passed: ${testCase.name} (${result.executionTime.toFixed(2)}ms)`);
      } else {
        console.error(`❌ Test failed: ${testCase.name} - ${result.message}`);
      }
      
      return result;
      
    } catch (error) {
      const errorResult: TestResult = {
        success: false,
        message: `Test execution failed: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
        executionTime: performance.now() - startTime,
        dataSnapshots: [...this.dataSnapshots]
      };
      
      this.testResults.push(errorResult);
      console.error(`💥 Test crashed: ${testCase.name}`, error);
      
      return errorResult;
    }
  }
  
  public async runTestSuite(testCases: TestCase[]): Promise<TestResult[]> {
    console.log(`🧪 Running test suite with ${testCases.length} tests`);
    
    const results: TestResult[] = [];
    
    for (const testCase of testCases) {
      const result = await this.runTest(testCase);
      results.push(result);
      
      // 在测试之间稍作暂停，确保状态清理
      await this.delay(100);
    }
    
    this.printTestSummary(results);
    return results;
  }
  
  // 数据验证工具方法
  public captureDataSnapshot(nodeId: string): void {
    if (!this.editor) return;
    
    const state = editorState.getState();
    const node = state.nodes.find(n => n.id === nodeId);
    
    if (node) {
      const snapshot: DataSnapshot = {
        nodeId: node.id,
        nodeName: node.title || node.type,
        timestamp: Date.now(),
        inputData: this.getNodeInputData(node),
        outputData: this.getNodeOutputData(node),
        properties: JSON.parse(JSON.stringify(node.properties))
      };
      
      this.dataSnapshots.push(snapshot);
      console.log(`📸 Data snapshot captured for node: ${snapshot.nodeName}`, snapshot);
    }
  }
  
  public assert(assertion: TestAssertion): void {
    let passed = false;
    
    switch (assertion.type) {
      case 'equals':
        passed = JSON.stringify(assertion.actual) === JSON.stringify(assertion.expected);
        break;
      case 'contains':
        passed = JSON.stringify(assertion.actual).includes(JSON.stringify(assertion.expected));
        break;
      case 'typeof':
        passed = typeof assertion.actual === assertion.expected;
        break;
      case 'custom':
        // 自定义断言通过函数实现
        passed = typeof assertion.expected === 'function' ? assertion.expected(assertion.actual) : false;
        break;
    }
    
    if (!passed) {
      throw new Error(`Assertion failed: ${assertion.message}. Expected: ${JSON.stringify(assertion.expected)}, Actual: ${JSON.stringify(assertion.actual)}`);
    }
    
    console.log(`✅ Assertion passed: ${assertion.message}`);
  }
  
  // 模拟节点执行
  public async simulateNodeExecution(nodeId: string, inputData: any = null): Promise<any> {
    if (!this.editor) throw new Error('Editor not attached to test framework');
    
    const state = editorState.getState();
    const node = state.nodes.find(n => n.id === nodeId);
    
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }
    
    console.log(`🔄 Simulating execution for node: ${node.title || node.type}`);
    
    // 捕获执行前状态
    this.captureDataSnapshot(nodeId);
    
    // 模拟节点状态变化
    editorState.updateNodeExecutionState(nodeId, 'running');
    await this.delay(50); // 模拟处理时间
    
    // 根据节点类型模拟不同的执行逻辑
    const outputData = await this.simulateNodeTypeExecution(node, inputData);
    
    // 更新节点输出数据（如果有输出容器）
    if (outputData && node.type !== 'End') {
      this.setNodeOutputData(node, outputData);
    }
    
    editorState.updateNodeExecutionState(nodeId, 'completed');
    
    // 捕获执行后状态
    this.captureDataSnapshot(nodeId);
    
    return outputData;
  }
  
  private async simulateNodeTypeExecution(node: BaseNode, inputData: any): Promise<any> {
    switch (node.type) {
      case 'Start':
        return { message: 'Workflow started', timestamp: Date.now() };
        
      case 'ContentGenerator':
        return this.simulateContentGeneratorExecution(node, inputData);
        
      case 'JsonMerger':
        return this.simulateJsonMergerExecution(node, inputData);
        
      case 'JsonFilter':
        return this.simulateJsonFilterExecution(node, inputData);
        
      case 'Display':
        console.log(`📺 Display node showing data:`, inputData);
        return inputData;
        
      case 'End':
        console.log(`🏁 Workflow completed with data:`, inputData);
        return null;
        
      default:
        console.warn(`⚠️ Unknown node type: ${node.type}, returning input data`);
        return inputData;
    }
  }
  
  private simulateContentGeneratorExecution(node: BaseNode, _inputData: any): any {
    const properties = node.properties;
    const contentType = properties.contentType || 'json';
    
    if (contentType === 'json') {
      const template = properties.jsonTemplate || '{"id": 1, "name": "Sample Data", "value": 100}';
      try {
        return JSON.parse(template);
      } catch (error) {
        console.warn('Invalid JSON template, returning default data');
        return { id: 1, name: 'Default Data', value: 100 };
      }
    }
    
    return { text: properties.textContent || 'Generated content' };
  }
  
  private simulateJsonMergerExecution(node: BaseNode, _inputData: any): any {
    // 模拟JSON合并逻辑
    const properties = node.properties;
    const mergeMode = properties.mergeMode || 'merge';
    
    // 这里简化处理，实际应该根据连接的输入数据进行合并
    const mockData = [
      { id: 1, name: 'Item 1', category: 'A' },
      { id: 2, name: 'Item 2', category: 'B' }
    ];
    
    if (mergeMode === 'merge') {
      return { merged: true, items: mockData, totalItems: mockData.length };
    } else if (mergeMode === 'array') {
      return mockData;
    }
    
    return { data: mockData };
  }
  
  private simulateJsonFilterExecution(node: BaseNode, inputData: any): any {
    const properties = node.properties;
    // const filterCondition = properties.filterCondition || '';
    
    if (!inputData) return null;
    
    // 简化的过滤逻辑
    if (Array.isArray(inputData)) {
      return inputData.filter((_item, index) => index < 5); // 简单过滤
    } else if (typeof inputData === 'object') {
      // 过滤对象属性
      const filtered: any = {};
      Object.keys(inputData).forEach(key => {
        if (key !== 'internal' && !key.startsWith('_')) {
          filtered[key] = inputData[key];
        }
      });
      return filtered;
    }
    
    return inputData;
  }
  
  // 工具方法
  private getNodeInputData(node: BaseNode): any {
    // 简化实现，实际应该从连接中获取输入数据
    return (node as any).inputData || null;
  }
  
  private getNodeOutputData(node: BaseNode): any {
    return (node as any).outputData || null;
  }
  
  private setNodeOutputData(node: BaseNode, data: any): void {
    (node as any).outputData = data;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private printTestSummary(results: TestResult[]): void {
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️ Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);
    
    if (failed > 0) {
      console.log('💥 Failed Tests:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.message}`);
      });
    }
  }
  
  // 获取测试结果
  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }
  
  public getDataSnapshots(): DataSnapshot[] {
    return [...this.dataSnapshots];
  }
  
  public clearResults(): void {
    this.testResults = [];
    this.dataSnapshots = [];
  }
}