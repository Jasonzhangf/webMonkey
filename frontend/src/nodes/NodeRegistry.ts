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
    this.registerNode('Start', StartNode);
    this.registerNode('End', EndNode);
    this.registerNode('Action', ActionNode);
    this.registerNode('Conditional', ConditionalNode);
    this.registerNode('Loop', LoopNode);
    this.registerNode('Jump', JumpNode);
    this.registerNode('Display', DisplayNode);
    this.registerNode('ContentGenerator', ContentGeneratorNode);
    this.registerNode('JsonMerger', JsonMergerNode);
    this.registerNode('JsonFilter', JsonFilterNode);
  }
}
