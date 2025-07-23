/**
 * Test Runner - 测试运行器
 * 职责：集成测试框架到编辑器，提供测试UI和控制
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

import { WorkflowTestFramework, TestCase, TestResult } from './WorkflowTestFramework';
import { JsonDataFlowTests } from './JsonDataFlowTests';
import { CanvasEditor } from '../canvas/CanvasEditor';

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
}

export class TestRunner {
  private testFramework: WorkflowTestFramework;
  private jsonTests: JsonDataFlowTests;
  private editor: CanvasEditor | null = null;
  private testResults: Map<string, TestResult[]> = new Map();
  private isRunning: boolean = false;
  
  constructor() {
    this.testFramework = new WorkflowTestFramework();
    this.jsonTests = new JsonDataFlowTests(this.testFramework);
    this.setupTestUI();
  }
  
  public setEditor(editor: CanvasEditor): void {
    this.editor = editor;
    this.testFramework.setEditor(editor);
    this.jsonTests.setEditor(editor);
    
    console.log('✅ Test Runner integrated with Canvas Editor');
  }
  
  private setupTestUI(): void {
    // 创建测试控制面板
    this.createTestControlPanel();
    
    // 添加快捷键
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        this.toggleTestPanel();
      }
    });
  }
  
  private createTestControlPanel(): void {
    // 检查是否已存在测试面板
    if (document.getElementById('test-control-panel')) {
      return;
    }
    
    const panel = document.createElement('div');
    panel.id = 'test-control-panel';
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 350px;
      background: linear-gradient(135deg, #2d2d2d 0%, #404040 100%);
      border: 2px solid #FFC107;
      border-radius: 12px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 14px;
      color: #ffffff;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 1000;
      max-height: 80vh;
      overflow-y: auto;
      display: none;
    `;
    
    panel.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #555;">
        <div style="font-weight: bold; font-size: 16px; color: #FFC107; display: flex; align-items: center;">
          🧪 Workflow Tests
        </div>
        <button id="close-test-panel" style="background: none; border: none; color: #FFC107; font-size: 18px; cursor: pointer; padding: 4px; border-radius: 4px;">×</button>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; margin-bottom: 8px;">Test Suites:</div>
        <div id="test-suites-list"></div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <button id="run-all-tests" style="width: 100%; background: #4CAF50; border: none; color: white; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 8px;">
          🚀 Run All Tests
        </button>
        <button id="run-json-tests" style="width: 100%; background: #2196F3; border: none; color: white; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 8px;">
          📊 Run JSON Tests
        </button>
        <button id="clear-results" style="width: 100%; background: #FF9800; border: none; color: white; padding: 8px; border-radius: 6px; cursor: pointer;">
          🗑️ Clear Results
        </button>
      </div>
      
      <div id="test-progress" style="margin-bottom: 16px; display: none;">
        <div style="background: #333; border-radius: 4px; overflow: hidden;">
          <div id="progress-bar" style="height: 8px; background: #4CAF50; width: 0%; transition: width 0.3s;"></div>
        </div>
        <div id="progress-text" style="text-align: center; margin-top: 4px; font-size: 12px;"></div>
      </div>
      
      <div id="test-results" style="max-height: 300px; overflow-y: auto;">
        <div style="text-align: center; color: #888; font-style: italic;">No tests run yet</div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // 绑定事件
    document.getElementById('close-test-panel')?.addEventListener('click', () => {
      this.hideTestPanel();
    });
    
    document.getElementById('run-all-tests')?.addEventListener('click', () => {
      this.runAllTests();
    });
    
    document.getElementById('run-json-tests')?.addEventListener('click', () => {
      this.runJsonTests();
    });
    
    document.getElementById('clear-results')?.addEventListener('click', () => {
      this.clearResults();
    });
    
    // 初始化测试套件列表
    this.updateTestSuitesList();
  }
  
  private updateTestSuitesList(): void {
    const container = document.getElementById('test-suites-list');
    if (!container) return;
    
    const testSuites = this.getAvailableTestSuites();
    
    container.innerHTML = testSuites.map(suite => `
      <div style="margin-bottom: 8px; padding: 8px; background: rgba(255,193,7,0.1); border-radius: 4px; border-left: 3px solid #FFC107;">
        <div style="font-weight: bold; font-size: 13px;">${suite.name}</div>
        <div style="font-size: 11px; color: #ccc; margin-top: 2px;">${suite.description}</div>
        <div style="font-size: 11px; color: #999; margin-top: 2px;">${suite.testCases.length} tests</div>
      </div>
    `).join('');
  }
  
  public async runAllTests(): Promise<void> {
    if (this.isRunning) {
      console.warn('Tests are already running');
      return;
    }
    
    this.isRunning = true;
    this.showProgress();
    
    try {
      const allTestSuites = this.getAvailableTestSuites();
      let totalTests = 0;
      let completedTests = 0;
      
      // 计算总测试数
      allTestSuites.forEach(suite => {
        totalTests += suite.testCases.length;
      });
      
      this.updateProgress(0, totalTests, 'Initializing tests...');
      
      // 运行所有测试套件
      for (const suite of allTestSuites) {
        console.log(`🧪 Running test suite: ${suite.name}`);
        
        const results = await this.runTestSuite(suite, (completed) => {
          completedTests = completed;
          this.updateProgress(completedTests, totalTests, `Running ${suite.name}...`);
        });
        
        this.testResults.set(suite.id, results);
      }
      
      this.updateProgress(totalTests, totalTests, 'All tests completed!');
      setTimeout(() => this.hideProgress(), 2000);
      
      this.displayResults();
      
    } catch (error) {
      console.error('Test execution failed:', error);
      this.updateProgress(0, 1, 'Test execution failed');
      setTimeout(() => this.hideProgress(), 3000);
    } finally {
      this.isRunning = false;
    }
  }
  
  public async runJsonTests(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.showProgress();
    
    try {
      const jsonTestSuite = this.getAvailableTestSuites().find(s => s.id === 'json-data-flow');
      if (!jsonTestSuite) throw new Error('JSON test suite not found');
      
      const results = await this.runTestSuite(jsonTestSuite, (completed, total) => {
        this.updateProgress(completed, total, 'Running JSON tests...');
      });
      
      this.testResults.set(jsonTestSuite.id, results);
      this.updateProgress(results.length, results.length, 'JSON tests completed!');
      setTimeout(() => this.hideProgress(), 2000);
      
      this.displayResults();
      
    } catch (error) {
      console.error('JSON test execution failed:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  private async runTestSuite(
    suite: TestSuite, 
    onProgress?: (completed: number, total: number) => void
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (let i = 0; i < suite.testCases.length; i++) {
      const testCase = suite.testCases[i];
      
      if (onProgress) {
        onProgress(i, suite.testCases.length);
      }
      
      const result = await this.testFramework.runTest(testCase);
      results.push(result);
      
      // 测试间短暂暂停
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return results;
  }
  
  private getAvailableTestSuites(): TestSuite[] {
    return [
      {
        id: 'json-data-flow',
        name: 'JSON Data Flow Tests',
        description: 'Test JSON data generation, transformation, and flow',
        testCases: this.jsonTests.getTestCases()
      }
    ];
  }
  
  private displayResults(): void {
    const container = document.getElementById('test-results');
    if (!container) return;
    
    const allResults: TestResult[] = [];
    this.testResults.forEach(results => allResults.push(...results));
    
    if (allResults.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #888; font-style: italic;">No test results available</div>';
      return;
    }
    
    const passed = allResults.filter(r => r.success).length;
    const failed = allResults.length - passed;
    const totalTime = allResults.reduce((sum, r) => sum + r.executionTime, 0);
    
    const summaryHtml = `
      <div style="margin-bottom: 16px; padding: 12px; background: rgba(255,193,7,0.1); border-radius: 6px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #FFC107;">📊 Test Summary</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>✅ Passed:</span>
          <span style="color: #4CAF50; font-weight: bold;">${passed}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>❌ Failed:</span>
          <span style="color: #f44336; font-weight: bold;">${failed}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>⏱️ Total Time:</span>
          <span>${totalTime.toFixed(2)}ms</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>📈 Success Rate:</span>
          <span style="color: ${passed/allResults.length > 0.8 ? '#4CAF50' : '#FF9800'}; font-weight: bold;">
            ${((passed / allResults.length) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    `;
    
    const resultsHtml = allResults.map(result => `
      <div style="margin-bottom: 8px; padding: 8px; background: ${result.success ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)'}; border-radius: 4px; border-left: 3px solid ${result.success ? '#4CAF50' : '#f44336'};">
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
          <span style="margin-right: 8px;">${result.success ? '✅' : '❌'}</span>
          <span style="font-weight: bold; font-size: 12px;">${result.message}</span>
        </div>
        <div style="font-size: 11px; color: #ccc;">
          Execution time: ${result.executionTime.toFixed(2)}ms
        </div>
        ${result.details ? `
          <details style="margin-top: 4px;">
            <summary style="cursor: pointer; font-size: 11px; color: #999;">View Details</summary>
            <pre style="margin-top: 4px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 10px; color: #ccc; overflow-x: auto;">${JSON.stringify(result.details, null, 2)}</pre>
          </details>
        ` : ''}
      </div>
    `).join('');
    
    container.innerHTML = summaryHtml + resultsHtml;
  }
  
  private showProgress(): void {
    const progress = document.getElementById('test-progress');
    if (progress) {
      progress.style.display = 'block';
    }
  }
  
  private hideProgress(): void {
    const progress = document.getElementById('test-progress');
    if (progress) {
      progress.style.display = 'none';
    }
  }
  
  private updateProgress(completed: number, total: number, message: string): void {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (progressBar && progressText) {
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${message} (${completed}/${total})`;
    }
  }
  
  private clearResults(): void {
    this.testResults.clear();
    this.testFramework.clearResults();
    this.displayResults();
  }
  
  public toggleTestPanel(): void {
    const panel = document.getElementById('test-control-panel');
    if (panel) {
      const isVisible = panel.style.display !== 'none';
      panel.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        this.updateTestSuitesList();
      }
    }
  }
  
  private hideTestPanel(): void {
    const panel = document.getElementById('test-control-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }
  
  // 公共API
  public getTestResults(): Map<string, TestResult[]> {
    return new Map(this.testResults);
  }
  
  public isTestRunning(): boolean {
    return this.isRunning;
  }
}