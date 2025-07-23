/**
 * Test System Demo - 测试系统演示脚本
 * 职责：展示自动化测试系统的使用方法和效果
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

import { WorkflowTestFramework } from './WorkflowTestFramework';

/**
 * 演示自动化测试系统
 * 在浏览器控制台中运行: window.runTestDemo()
 */
export function runTestDemo(): void {
  console.log('🎬 Starting Workflow Test System Demo...\n');
  
  // 检查编辑器是否可用
  const testRunner = (window as any).testRunner;
  if (!testRunner) {
    console.error('❌ Test Runner not found. Make sure the Canvas Editor is loaded.');
    return;
  }
  
  console.log('✅ Test Runner found, starting demo...\n');
  
  // 演示1: 显示测试面板
  console.log('📋 Demo 1: Opening Test Control Panel');
  console.log('You can also use Ctrl+Shift+T to toggle the test panel');
  testRunner.toggleTestPanel();
  
  setTimeout(() => {
    // 演示2: 运行JSON测试
    console.log('\n🧪 Demo 2: Running JSON Data Flow Tests');
    console.log('This will test JSON generation, merging, filtering, and complete workflow...\n');
    
    testRunner.runJsonTests().then(() => {
      console.log('\n✅ JSON tests completed! Check the test panel for results.\n');
      
      // 演示3: 显示测试结果
      setTimeout(() => {
        const results = testRunner.getTestResults();
        console.log('📊 Demo 3: Test Results Summary');
        
        results.forEach((testResults: any[], suiteId: string) => {
          const passed = testResults.filter((r: any) => r.success).length;
          const total = testResults.length;
          const successRate = (passed / total * 100).toFixed(1);
          
          console.log(`\n📋 Suite: ${suiteId}`);
          console.log(`✅ Passed: ${passed}/${total} (${successRate}%)`);
          
          testResults.forEach((result: any) => {
            const icon = result.success ? '✅' : '❌';
            console.log(`  ${icon} ${result.message} (${result.executionTime.toFixed(2)}ms)`);
          });
        });
        
        console.log('\n🎯 Demo completed! You can now:');
        console.log('1. Use Ctrl+Shift+T to toggle test panel');
        console.log('2. Click "Run JSON Tests" to run specific tests');
        console.log('3. Click "Run All Tests" to run complete suite');
        console.log('4. Check test results and data snapshots');
        console.log('\n🔍 For more details, see: frontend/src/tests/README.md');
        
      }, 1000);
    }).catch((error: any) => {
      console.error('❌ Test execution failed:', error);
    });
    
  }, 1000);
}

/**
 * 演示手动测试执行
 */
export async function runManualTestDemo(): Promise<void> {
  console.log('🔧 Manual Test Demo - Creating and running a custom test...\n');
  
  const testFramework = new WorkflowTestFramework();
  
  // 创建一个简单的测试用例
  const demoTest = {
    id: 'demo-test-001',
    name: 'Demo Test Case',
    description: 'A simple test to demonstrate the testing framework',
    
    setup: async () => {
      console.log('🔧 Setting up demo test...');
    },
    
    execute: async () => {
      console.log('🚀 Executing demo test...');
      
      // 模拟一些测试逻辑
      const testData = { id: 1, name: 'Demo Data', value: 100 };
      
      // 使用断言验证数据
      testFramework.assert({
        type: 'typeof',
        expected: 'object',
        actual: testData,
        message: 'Test data should be an object'
      });
      
      testFramework.assert({
        type: 'equals',
        expected: 1,
        actual: testData.id,
        message: 'ID should be 1'
      });
      
      return {
        success: true,
        message: 'Demo test passed successfully',
        details: { testData },
        executionTime: 0
      };
    },
    
    cleanup: async () => {
      console.log('🧹 Cleaning up demo test...');
    }
  };
  
  // 运行测试
  const result = await testFramework.runTest(demoTest);
  
  console.log('\n📊 Demo Test Result:');
  console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Message: ${result.message}`);
  console.log(`Execution Time: ${result.executionTime.toFixed(2)}ms`);
  
  if (result.details) {
    console.log('Details:', result.details);
  }
}

/**
 * 演示数据快照功能
 */
export function demonstrateDataSnapshots(): void {
  console.log('📸 Data Snapshots Demo\n');
  
  const testFramework = (window as any).testFramework;
  if (!testFramework) {
    console.error('❌ Test Framework not available');
    return;
  }
  
  console.log('Data snapshots capture the state of nodes during test execution:');
  console.log('- Input data (what goes into the node)');
  console.log('- Output data (what comes out of the node)');
  console.log('- Node properties (configuration state)');
  console.log('- Timestamp (when the snapshot was taken)\n');
  
  const snapshots = testFramework.getDataSnapshots();
  
  if (snapshots.length === 0) {
    console.log('📋 No data snapshots available. Run some tests first!');
    console.log('💡 Tip: Use testRunner.runJsonTests() to generate snapshots');
    return;
  }
  
  console.log(`📊 Found ${snapshots.length} data snapshots:\n`);
  
  snapshots.forEach((snapshot: any, index: number) => {
    console.log(`📸 Snapshot ${index + 1}:`);
    console.log(`  Node: ${snapshot.nodeName} (${snapshot.nodeId})`);
    console.log(`  Time: ${new Date(snapshot.timestamp).toLocaleTimeString()}`);
    console.log(`  Input:`, snapshot.inputData);
    console.log(`  Output:`, snapshot.outputData);
    console.log('');
  });
}

// 将演示函数绑定到全局对象，方便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).runTestDemo = runTestDemo;
  (window as any).runManualTestDemo = runManualTestDemo;
  (window as any).demonstrateDataSnapshots = demonstrateDataSnapshots;
  
  console.log('🎬 Test Demo Functions Available:');
  console.log('- window.runTestDemo() - Complete demo of test system');
  console.log('- window.runManualTestDemo() - Manual test execution demo');
  console.log('- window.demonstrateDataSnapshots() - Show captured data snapshots');
  console.log('- Use Ctrl+Shift+T to toggle test panel');
}