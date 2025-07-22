/**
 * Canvas Editor - 画布编辑器主协调器 (重构版)
 * 职责：协调各个组件、状态管理、生命周期管理
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */
import { BaseNode, NodePosition } from '../nodes/BaseNode';
import { NodeRegistry } from '../nodes/NodeRegistry';
import { Sidebar } from '../components/Sidebar';
import { UIPanel } from '../components/UIPanel';
import { CommunicationManager } from '../utils/CommunicationManager';
import { AddNodeMessage, Message } from '../../../shared/types';
import { ActionNode } from '../nodes/ActionNode';
import { editorState, EditorData } from '../state/EditorState';
import { commandHistory } from '../commands/CommandHistory';
import { AddNodeCommand } from '../commands/AddNodeCommand';

// 导入拆分后的模块
import { CanvasRenderer } from './renderers/CanvasRenderer';
import { CanvasInteractions } from './interactions/CanvasInteractions';
import { CanvasLayoutManager } from './layout/CanvasLayoutManager';
import { WorkflowBuilder } from './workflow/WorkflowBuilder';
import { NodeVariableManager } from './managers/NodeVariableManager';
import { Connection } from './types/CanvasTypes';

export type { Connection } from './types/CanvasTypes';

export class CanvasEditor {
  // Core components
  private canvas: HTMLCanvasElement;
  private nodeRegistry: NodeRegistry;
  private sidebar: Sidebar;
  private communicationManager: CommunicationManager;
  
  // Refactored modules
  private renderer: CanvasRenderer;
  private interactions: CanvasInteractions;
  private layoutManager: CanvasLayoutManager;
  private workflowBuilder: WorkflowBuilder;
  private variableManager: NodeVariableManager;
  
  // Data
  private nodes: BaseNode[] = [];
  private connections: Connection[] = [];
  private nodeCounter: number = 0; // 节点计数器，用于分配连续编号

  constructor(container: HTMLElement) {
    // 初始化画布
    this.canvas = document.createElement('canvas');
    container.appendChild(this.canvas);

    // 初始化核心组件
    this.nodeRegistry = NodeRegistry.getInstance();
    this.sidebar = new Sidebar(this.handleNodeUpdate.bind(this));
    this.communicationManager = new CommunicationManager('ws://localhost:5009');
    
    // 初始化UI面板
    new UIPanel(
      this.nodeRegistry.getAllNodeTypeNames(),
      this.addNode.bind(this),
      this.saveWorkflow.bind(this),
      this.loadWorkflow.bind(this),
      this.runWorkflow.bind(this),
      this // 传递CanvasEditor实例给UIPanel
    );

    // 初始化拆分后的模块
    this.renderer = new CanvasRenderer(this.canvas);
    this.interactions = new CanvasInteractions(
      this.canvas, 
      this.sidebar,
      this.render.bind(this)
    );
    this.layoutManager = new CanvasLayoutManager(this.canvas);
    this.workflowBuilder = new WorkflowBuilder(this.addNode.bind(this));
    this.variableManager = new NodeVariableManager();

    // 初始化编辑器
    this.initialize();
    editorState.subscribe(this.onStateUpdate.bind(this));
  }

  private initialize(): void {
    this.renderer.resizeCanvas();
    window.addEventListener('resize', () => {
      this.renderer.resizeCanvas();
      this.render();
    });

    this.communicationManager.connect();
    this.communicationManager.onMessage.addListener(this.handleBackendMessage.bind(this));

    // 异步初始化节点
    this.addInitialNodes().catch(error => {
      console.error('Failed to initialize nodes:', error);
    });
    
    this.startAnimationLoop();
  }

  private startAnimationLoop(): void {
    const animate = () => {
      // 检查是否有节点在运行中，如果有就重新渲染
      const hasRunningNodes = this.nodes.some(node => node.executionState === 'running');
      if (hasRunningNodes) {
        this.render();
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  private handleNodeUpdate(node: BaseNode): void {
    const nodeIndex = this.nodes.findIndex(n => n.id === node.id);
    if (nodeIndex !== -1) {
      this.nodes[nodeIndex] = node;
    }
    
    // 更新状态管理器
    const currentState = editorState.getState();
    const nodeToUpdate = currentState.nodes.find(n => n.id === node.id);
    if (nodeToUpdate) {
      Object.assign(nodeToUpdate, node);
      editorState.setState(currentState);
    }
  }

  private onStateUpdate(newData: EditorData): void {
    this.nodes = newData.nodes;
    this.connections = newData.connections;
    
    // 更新各个模块的数据
    this.interactions.setData(this.nodes, this.connections);
    this.variableManager.setNodes(this.nodes);
    
    this.render();
  }

  private render(): void {
    this.renderer.render(
      this.nodes, 
      this.connections, 
      this.interactions.getInteractionState(),
      this.interactions.getZoomLevel(),
      this.interactions.getPanX(),
      this.interactions.getPanY()
    );
  }

  public addNode(nodeType: string, position?: NodePosition): BaseNode | null {
    const pos = position || this.layoutManager.findAvailablePosition(
      this.canvas.width / 2, 
      this.canvas.height / 2,
      this.nodes
    );
    
    const newNode = this.nodeRegistry.createNode(nodeType, pos);
    if (newNode) {
      // 分配节点编号
      this.nodeCounter++;
      (newNode as any).nodeNumber = this.nodeCounter;
      
      const command = new AddNodeCommand(newNode);
      commandHistory.execute(command);
      return newNode;
    }
    return null;
  }

  private async addInitialNodes(): Promise<void> {
    const currentState = editorState.getState();
    
    // 如果已经有节点了，只确保有Start和End节点
    if (currentState.nodes.length > 0) {
      this.ensureStartEndNodes();
      return;
    }

    console.log('Creating default test workflow...');
    // 创建默认测试工作流
    try {
      await this.workflowBuilder.createDefaultTestWorkflow();
      console.log('✅ Default workflow creation completed successfully');
    } catch (error) {
      console.error('❌ Failed to create default workflow:', error);
      // 如果失败，创建基本的Start和End节点
      this.ensureStartEndNodes();
    }
  }

  private ensureStartEndNodes(): void {
    const currentState = editorState.getState();
    
    // 检查是否有Start节点
    const hasStart = currentState.nodes.some(node => node.type === 'Start');
    if (!hasStart) {
      const startPosition = this.layoutManager.findAvailablePosition(300, 250, this.nodes);
      this.addNode('Start', startPosition);
    }
    
    // 检查是否有End节点
    const hasEnd = currentState.nodes.some(node => node.type === 'End');
    if (!hasEnd) {
      const endPosition = this.layoutManager.findAvailablePosition(1100, 200, this.nodes);
      this.addNode('End', endPosition);
    }
  }

  // 节点变量访问系统 - 委托给NodeVariableManager
  public setNodeVariable(nodeName: string, key: string, value: any): void {
    this.variableManager.setNodeVariable(nodeName, key, value);
  }

  public getNodeVariable(nodeName: string, key: string): any {
    return this.variableManager.getNodeVariable(nodeName, key);
  }

  public resolveVariableExpression(expression: string): any {
    return this.variableManager.resolveVariableExpression(expression);
  }

  public getAllNodeVariables(): { [key: string]: any } {
    return this.variableManager.getAllNodeVariables();
  }

  // 自动排版功能 - 委托给LayoutManager
  public autoLayoutNodes(): void {
    this.layoutManager.autoLayoutNodes(this.nodes, this.connections);
    this.render();
    
    // 更新状态（触发保存）
    const currentState = editorState.getState();
    editorState.setState({
      ...currentState,
      nodes: this.nodes
    });
    
    console.log('Auto layout completed!');
  }

  // 消息处理
  private handleBackendMessage(message: Message): void {
    switch (message.type) {
      case 'ADD_NODE':
        this.handlePluginMessage(message);
        break;
      case 'NODE_EXECUTION_UPDATE':
        this.handleNodeExecutionUpdate(message.payload);
        break;
      case 'WORKFLOW_EXECUTION_COMPLETED':
        this.handleWorkflowExecutionCompleted(message.payload);
        break;
      default:
        console.warn(`Unknown message type received: ${message.type}`);
    }
  }

  private handleNodeExecutionUpdate(payload: any): void {
    const { nodeId, state } = payload;
    editorState.updateNodeExecutionState(nodeId, state);
  }

  private handleWorkflowExecutionCompleted(payload: any): void {
    console.log("Workflow execution completed", payload);
    // Reset all node states to idle
    const currentState = editorState.getState();
    currentState.nodes.forEach(node => node.executionState = 'idle');
    editorState.setState(currentState, false); // don't save this visual change to history
  }
  
  private handlePluginMessage(message: Message): void {
    if (message.type === 'ADD_NODE') {
      const { operation, selector } = (message as AddNodeMessage).payload;
      const pos = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
      const newNode = this.nodeRegistry.createNode('Action', pos) as ActionNode;
      if (newNode) {
        newNode.properties.operationUnit.action = operation;
        newNode.properties.operationUnit.observation.target = {
          primary: {type: 'css', value: selector.selectors.css}
        };
        newNode.title = `${operation.type} Action`;
        const command = new AddNodeCommand(newNode);
        commandHistory.execute(command);
      }
    }
  }

  // 工作流操作
  private runWorkflow(): void {
    const workflowData = this.serializeWorkflow();
    
    // Send to backend for real execution
    this.communicationManager.sendMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: workflowData,
    });
    
    console.log('Workflow sent to backend for execution:', workflowData);
  }

  private serializeWorkflow(): EditorData {
    return editorState.getState();
  }
  
  public saveWorkflow(): void {
    const workflowData = this.serializeWorkflow();
    const dataStr = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  public loadWorkflow(data: any): void {
    // Basic validation
    if (data && Array.isArray(data.nodes) && Array.isArray(data.connections)) {
      editorState.setState(data);
    } else {
      console.error("Invalid workflow data format.");
    }
  }

  // 测试工作流执行功能 - 创建简化版本，避免超过500行
  public async testWorkflowExecution(): Promise<void> {
    console.log('=== Starting Workflow Execution Test ===');
    
    try {
      // 1. 验证节点存在性
      console.log('1. Verifying nodes...');
      const requiredNodeTypes = ['Start', 'ContentGenerator', 'JsonMerger', 'JsonFilter', 'Display', 'End'];
      const nodeCounts: { [key: string]: number } = {};
      
      this.nodes.forEach(node => {
        nodeCounts[node.type] = (nodeCounts[node.type] || 0) + 1;
      });
      
      console.log('Node counts:', nodeCounts);
      
      // 验证必要节点
      const missingNodes = requiredNodeTypes.filter(type => {
        if (type === 'ContentGenerator') return (nodeCounts[type] || 0) < 2;
        return !nodeCounts[type];
      });
      
      if (missingNodes.length > 0) {
        throw new Error(`Missing required nodes: ${missingNodes.join(', ')}`);
      }
      
      // 2. 验证连接完整性
      console.log('2. Verifying connections...');
      console.log(`Total connections: ${this.connections.length}`);
      
      if (this.connections.length < 6) {
        console.warn('Warning: Expected at least 6 connections for complete workflow');
      }
      
      console.log('=== Workflow Test Completed Successfully ===');
      
    } catch (error) {
      console.error('=== Workflow Test Failed ===');
      console.error('Error:', error);
      throw error;
    }
  }
}