// frontend/src/nodes/NodeRegistry.ts
import { BaseNode, NodeClass, NodePosition } from './BaseNode';
import { StartNode } from './StartNode';
import { EndNode } from './EndNode';
import { ActionNode } from './ActionNode';
import { ConditionalNode } from './ConditionalNode';
import { LoopNode } from './LoopNode';
import { JumpNode } from './JumpNode';
import { DisplayNode } from './DisplayNode';
import { ContentGeneratorNode } from './ContentGeneratorNode';
import { JsonMergerNode } from './JsonMergerNode';
import { JsonFilterNode } from './JsonFilterNode';

// 浏览器工作流架构节点
import { WorkerInitializationNode } from './WorkerInitializationNode';
import { PageManagementNode } from './PageManagementNode';
import { ActionNodeV2 } from './ActionNodeV2';

export class NodeRegistry {
  private static instance: NodeRegistry;
  private nodeTypes: Map<string, NodeClass> = new Map();

  private constructor() {
    this.registerBuiltinNodes();
  }

  public static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }

  public registerNode(name: string, nodeClass: NodeClass): void {
    if (this.nodeTypes.has(name)) {
      return; // Silently ignore duplicate registrations
    }
    this.nodeTypes.set(name, nodeClass);
  }

  public createNode(name: string, position: NodePosition): BaseNode | null {
    const NodeClass = this.nodeTypes.get(name);
    if (NodeClass) {
      return new NodeClass(position);
    }
    console.error(`Node type "${name}" not found.`);
    return null;
  }

  public getNodeClass(name: string): NodeClass | undefined {
    return this.nodeTypes.get(name);
  }

  public getAllNodeTypeNames(): string[] {
    return Array.from(this.nodeTypes.keys());
  }
  
  private registerBuiltinNodes(): void {
    // 基础流程节点
    this.registerNode('Start', StartNode);
    this.registerNode('End', EndNode);
    
    // 传统节点（保持向后兼容）
    this.registerNode('Action', ActionNode);
    this.registerNode('Conditional', ConditionalNode);
    this.registerNode('Loop', LoopNode);
    this.registerNode('Jump', JumpNode);
    this.registerNode('Display', DisplayNode);
    this.registerNode('ContentGenerator', ContentGeneratorNode);
    this.registerNode('JsonMerger', JsonMergerNode);
    this.registerNode('JsonFilter', JsonFilterNode);
    
    // 浏览器工作流架构节点
    this.registerNode('WorkerInitialization', WorkerInitializationNode);
    this.registerNode('PageManagement', PageManagementNode);
    this.registerNode('ActionV2', ActionNodeV2);
  }

  // 获取节点分类
  public getNodeCategories(): { [category: string]: string[] } {
    return {
      '流程控制': ['Start', 'End', 'Conditional', 'Loop', 'Jump'],
      '数据处理': ['Display', 'ContentGenerator', 'JsonMerger', 'JsonFilter'],
      '浏览器操作': ['WorkerInitialization', 'PageManagement', 'ActionV2'],
      '传统操作': ['Action'] // 保持向后兼容
    };
  }

  // 获取节点描述
  public getNodeDescription(nodeType: string): string {
    const descriptions: { [key: string]: string } = {
      'Start': '工作流起始节点',
      'End': '工作流结束节点',
      'Action': '传统操作节点（旧版本）',
      'ActionV2': '执行序列操作节点（新版本）',
      'Conditional': '条件判断节点',
      'Loop': '循环控制节点',
      'Jump': '跳转节点',
      'Display': '数据显示节点',
      'ContentGenerator': '内容生成节点',
      'JsonMerger': 'JSON合并节点',
      'JsonFilter': 'JSON过滤节点',
      'WorkerInitialization': 'Worker初始化节点',
      'PageManagement': '页面管理节点'
    };
    return descriptions[nodeType] || '未知节点类型';
  }

  // 检查节点是否需要Worker绑定
  public requiresWorkerBinding(nodeType: string): boolean {
    const workerNodes = ['ActionV2', 'PageManagement'];
    return workerNodes.includes(nodeType);
  }

  // 检查节点是否需要Page绑定
  public requiresPageBinding(nodeType: string): boolean {
    const pageNodes = ['ActionV2'];
    return pageNodes.includes(nodeType);
  }
}
