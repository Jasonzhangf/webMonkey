/**
 * JSON Data Flow Tests - JSON数据流转测试用例
 * 职责：测试JSON数据在不同节点间的流转、变换、合并、过滤
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

import { WorkflowTestFramework, TestCase, TestResult } from './WorkflowTestFramework';
import { CanvasEditor } from '../canvas/CanvasEditor';
import { editorState } from '../state/EditorState';
import { BaseNode } from '../nodes/BaseNode';

export class JsonDataFlowTests {
  private testFramework: WorkflowTestFramework;
  private editor: CanvasEditor | null = null;
  
  constructor(testFramework: WorkflowTestFramework) {
    this.testFramework = testFramework;
  }
  
  public setEditor(editor: CanvasEditor): void {
    this.editor = editor;
    this.testFramework.setEditor(editor);
  }
  
  public getTestCases(): TestCase[] {
    return [
      this.createBasicJsonGenerationTest(),
      this.createJsonMergeTest(),
      this.createJsonFilterTest(),
      this.createCompleteJsonWorkflowTest(),
      this.createDataTypeValidationTest(),
      this.createErrorHandlingTest()
    ];
  }
  
  private createBasicJsonGenerationTest(): TestCase {
    return {
      id: 'json-generation-001',
      name: 'Basic JSON Generation Test',
      description: 'Test that ContentGenerator nodes produce valid JSON data',
      
      setup: async () => {
        // 确保有一个基本的工作流
        await this.ensureBasicWorkflow();
      },
      
      execute: async (): Promise<TestResult> => {
        console.log('🧪 Executing JSON Generation Test...');
        
        // 找到ContentGenerator节点
        const state = editorState.getState();
        const generators = state.nodes.filter(node => node.type === 'ContentGenerator');
        
        this.testFramework.assert({
          type: 'custom',
          expected: (actual: number) => actual >= 1,
          actual: generators.length,
          message: 'At least one ContentGenerator node should exist'
        });
        
        // 测试第一个生成器
        const generator = generators[0];
        const outputData = await this.testFramework.simulateNodeExecution(generator.id);
        
        // 验证输出数据
        this.testFramework.assert({
          type: 'typeof',
          expected: 'object',
          actual: outputData,
          message: 'ContentGenerator should output an object'
        });
        
        this.testFramework.assert({
          type: 'custom',
          expected: (data: any) => data !== null && typeof data === 'object',
          actual: outputData,
          message: 'Generated data should be a valid object'
        });
        
        // 验证JSON结构
        const requiredFields = ['id', 'name', 'value'];
        const hasRequiredFields = requiredFields.every(field => field in outputData);
        
        this.testFramework.assert({
          type: 'equals',
          expected: true,
          actual: hasRequiredFields,
          message: 'Generated JSON should contain required fields (id, name, value)'
        });
        
        return {
          success: true,
          message: 'JSON generation test passed successfully',
          details: { generatedData: outputData },
          executionTime: 0
        };
      }
    };
  }
  
  private createJsonMergeTest(): TestCase {
    return {
      id: 'json-merge-002',
      name: 'JSON Merge Test',
      description: 'Test that JsonMerger nodes correctly merge multiple JSON inputs',
      
      setup: async () => {
        await this.ensureBasicWorkflow();
      },
      
      execute: async (): Promise<TestResult> => {
        console.log('🧪 Executing JSON Merge Test...');
        
        const state = editorState.getState();
        const mergers = state.nodes.filter(node => node.type === 'JsonMerger');
        
        this.testFramework.assert({
          type: 'custom',
          expected: (actual: number) => actual >= 1,
          actual: mergers.length,
          message: 'At least one JsonMerger node should exist'
        });
        
        const merger = mergers[0];
        
        // 模拟多个输入数据
        const inputData1 = { id: 1, name: 'Item 1', category: 'A' };
        const inputData2 = { id: 2, name: 'Item 2', category: 'B' };
        
        // 执行合并
        const mergedData = await this.testFramework.simulateNodeExecution(merger.id, [inputData1, inputData2]);
        
        // 验证合并结果
        this.testFramework.assert({
          type: 'typeof',
          expected: 'object',
          actual: mergedData,
          message: 'Merger should output an object'
        });
        
        // 验证合并数据包含预期结构
        if (Array.isArray(mergedData)) {
          this.testFramework.assert({
            type: 'custom',
            expected: (length: number) => length >= 2,
            actual: mergedData.length,
            message: 'Merged array should contain at least 2 items'
          });
        } else if (mergedData.items) {
          this.testFramework.assert({
            type: 'custom',
            expected: (items: any[]) => Array.isArray(items) && items.length >= 2,
            actual: mergedData.items,
            message: 'Merged data should contain items array with at least 2 items'
          });
        }
        
        return {
          success: true,
          message: 'JSON merge test passed successfully',
          details: { mergedData },
          executionTime: 0
        };
      }
    };
  }
  
  private createJsonFilterTest(): TestCase {
    return {
      id: 'json-filter-003',
      name: 'JSON Filter Test',
      description: 'Test that JsonFilter nodes correctly filter JSON data',
      
      setup: async () => {
        await this.ensureBasicWorkflow();
      },
      
      execute: async (): Promise<TestResult> => {
        console.log('🧪 Executing JSON Filter Test...');
        
        const state = editorState.getState();
        const filters = state.nodes.filter(node => node.type === 'JsonFilter');
        
        this.testFramework.assert({
          type: 'custom',
          expected: (actual: number) => actual >= 1,
          actual: filters.length,
          message: 'At least one JsonFilter node should exist'
        });
        
        const filter = filters[0];
        
        // 模拟输入数据
        const inputData = {
          id: 1,
          name: 'Test Item',
          value: 100,
          internal: 'should_be_filtered',
          _private: 'should_be_filtered',
          public: 'should_remain'
        };
        
        // 执行过滤
        const filteredData = await this.testFramework.simulateNodeExecution(filter.id, inputData);
        
        // 验证过滤结果
        this.testFramework.assert({
          type: 'typeof',
          expected: 'object',
          actual: filteredData,
          message: 'Filter should output an object'
        });
        
        // 验证内部字段被过滤
        this.testFramework.assert({
          type: 'equals',
          expected: false,
          actual: 'internal' in filteredData,
          message: 'Internal fields should be filtered out'
        });
        
        this.testFramework.assert({
          type: 'equals',
          expected: false,
          actual: '_private' in filteredData,
          message: 'Private fields (starting with _) should be filtered out'
        });
        
        // 验证公共字段保留
        this.testFramework.assert({
          type: 'equals',
          expected: true,
          actual: 'public' in filteredData,
          message: 'Public fields should be preserved'
        });
        
        return {
          success: true,
          message: 'JSON filter test passed successfully',
          details: { originalData: inputData, filteredData },
          executionTime: 0
        };
      }
    };
  }
  
  private createCompleteJsonWorkflowTest(): TestCase {
    return {
      id: 'json-workflow-004',
      name: 'Complete JSON Workflow Test',
      description: 'Test end-to-end JSON data flow through the entire workflow',
      
      setup: async () => {
        await this.ensureBasicWorkflow();
      },
      
      execute: async (): Promise<TestResult> => {
        console.log('🧪 Executing Complete JSON Workflow Test...');
        
        const state = editorState.getState();
        const startNode = state.nodes.find(node => node.type === 'Start');
        
        if (!startNode) {
          throw new Error('Start node not found');
        }
        
        // 按执行顺序获取节点
        const executionOrder = this.getExecutionOrder(state.nodes, state.connections);
        
        let currentData: any = null;
        const executionTrace: any[] = [];
        
        // 逐个执行节点
        for (const node of executionOrder) {
          console.log(`🔄 Executing node: ${node.title || node.type}`);
          
          const nodeOutput = await this.testFramework.simulateNodeExecution(node.id, currentData);
          
          executionTrace.push({
            nodeId: node.id,
            nodeType: node.type,
            nodeName: node.title || node.type,
            input: currentData,
            output: nodeOutput
          });
          
          if (nodeOutput !== null) {
            currentData = nodeOutput;
          }
          
          // 在关键节点进行数据验证
          if (node.type === 'ContentGenerator') {
            this.testFramework.assert({
              type: 'typeof',
              expected: 'object',
              actual: nodeOutput,
              message: `ContentGenerator ${node.title} should output valid JSON`
            });
          } else if (node.type === 'JsonMerger') {
            this.testFramework.assert({
              type: 'custom',
              expected: (data: any) => data && (Array.isArray(data) || typeof data === 'object'),
              actual: nodeOutput,
              message: `JsonMerger ${node.title} should output array or object`
            });
          }
        }
        
        // 验证最终数据状态
        this.testFramework.assert({
          type: 'custom',
          expected: (trace: any[]) => trace.length >= 3,
          actual: executionTrace,
          message: 'Workflow should execute at least 3 nodes'
        });
        
        // 验证数据经过完整变换
        const hasDataTransformation = executionTrace.some(step => 
          step.input !== step.output && step.output !== null
        );
        
        this.testFramework.assert({
          type: 'equals',
          expected: true,
          actual: hasDataTransformation,
          message: 'Workflow should include data transformation steps'
        });
        
        return {
          success: true,
          message: 'Complete JSON workflow test passed successfully',
          details: { executionTrace, finalData: currentData },
          executionTime: 0
        };
      }
    };
  }
  
  private createDataTypeValidationTest(): TestCase {
    return {
      id: 'json-types-005',
      name: 'JSON Data Type Validation Test',
      description: 'Test that nodes handle different JSON data types correctly',
      
      setup: async () => {
        await this.ensureBasicWorkflow();
      },
      
      execute: async (): Promise<TestResult> => {
        console.log('🧪 Executing Data Type Validation Test...');
        
        const testDataTypes = [
          { type: 'object', data: { id: 1, name: 'test' } },
          { type: 'array', data: [1, 2, 3, 'test'] },
          { type: 'string', data: 'test string' },
          { type: 'number', data: 42 },
          { type: 'boolean', data: true },
          { type: 'null', data: null }
        ];
        
        const state = editorState.getState();
        const generator = state.nodes.find(node => node.type === 'ContentGenerator');
        
        if (!generator) {
          throw new Error('ContentGenerator node not found');
        }
        
        const validationResults: any[] = [];
        
        for (const testCase of testDataTypes) {
          try {
            // 模拟不同数据类型的处理
            const result = await this.testFramework.simulateNodeExecution(generator.id, testCase.data);
            
            validationResults.push({
              inputType: testCase.type,
              inputData: testCase.data,
              outputData: result,
              success: true
            });
            
          } catch (error) {
            validationResults.push({
              inputType: testCase.type,
              inputData: testCase.data,
              error: error instanceof Error ? error.message : String(error),
              success: false
            });
          }
        }
        
        // 验证至少能处理基本的对象类型
        const objectTest = validationResults.find(r => r.inputType === 'object');
        this.testFramework.assert({
          type: 'equals',
          expected: true,
          actual: objectTest?.success || false,
          message: 'Should handle object data type'
        });
        
        return {
          success: true,
          message: 'Data type validation test completed',
          details: { validationResults },
          executionTime: 0
        };
      }
    };
  }
  
  private createErrorHandlingTest(): TestCase {
    return {
      id: 'json-errors-006',
      name: 'JSON Error Handling Test',
      description: 'Test error handling for invalid JSON and edge cases',
      
      setup: async () => {
        await this.ensureBasicWorkflow();
      },
      
      execute: async (): Promise<TestResult> => {
        console.log('🧪 Executing Error Handling Test...');
        
        const state = editorState.getState();
        const generator = state.nodes.find(node => node.type === 'ContentGenerator');
        
        if (!generator) {
          throw new Error('ContentGenerator node not found');
        }
        
        // 测试节点在无效输入下的行为
        const errorTestCases = [
          undefined,
          {},
          { malformed: 'data with circular reference' }
        ];
        
        // let errorHandlingWorking = true;
        const errorResults: any[] = [];
        
        for (const invalidData of errorTestCases) {
          try {
            const result = await this.testFramework.simulateNodeExecution(generator.id, invalidData);
            
            // 节点应该能处理无效输入并返回有效输出
            errorResults.push({
              input: invalidData,
              output: result,
              handled: true
            });
            
          } catch (error) {
            errorResults.push({
              input: invalidData,
              error: error instanceof Error ? error.message : String(error),
              handled: false
            });
            
            console.warn(`Node failed to handle invalid input:`, invalidData, error);
          }
        }
        
        // 验证错误处理机制
        const handledErrors = errorResults.filter(r => r.handled).length;
        
        this.testFramework.assert({
          type: 'custom',
          expected: (handled: number) => handled >= errorResults.length * 0.5,
          actual: handledErrors,
          message: 'At least 50% of error cases should be handled gracefully'
        });
        
        return {
          success: true,
          message: 'Error handling test completed',
          details: { errorResults },
          executionTime: 0
        };
      }
    };
  }
  
  // 工具方法
  private async ensureBasicWorkflow(): Promise<void> {
    const state = editorState.getState();
    
    if (state.nodes.length === 0) {
      console.log('📋 Creating basic workflow for testing...');
      
      if (this.editor) {
        // 让编辑器创建默认测试工作流
        await (this.editor as any).addInitialNodes();
      }
    }
  }
  
  private getExecutionOrder(nodes: BaseNode[], _connections: any[]): BaseNode[] {
    // 简化的拓扑排序 - 实际实现应该更完善
    const ordered: BaseNode[] = [];
    const visited = new Set<string>();
    
    // 先添加Start节点
    const startNode = nodes.find(node => node.type === 'Start');
    if (startNode) {
      ordered.push(startNode);
      visited.add(startNode.id);
    }
    
    // 按类型优先级添加其他节点
    const typeOrder = ['ContentGenerator', 'JsonMerger', 'JsonFilter', 'Display', 'End'];
    
    for (const nodeType of typeOrder) {
      const nodesOfType = nodes.filter(node => 
        node.type === nodeType && !visited.has(node.id)
      );
      
      for (const node of nodesOfType) {
        ordered.push(node);
        visited.add(node.id);
      }
    }
    
    return ordered;
  }
}