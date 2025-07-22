/**
 * Loop Node
 */
import { BaseNode, NodePosition, WorkflowData } from './BaseNode';

export class LoopNode extends BaseNode {
  constructor(position: NodePosition) {
    super(position, 'Loop');
    this.width = 150;
    this.height = 70;
    this.inputs.push({ id: 'in', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true });
    this.inputs.push({ id: 'break', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true });
    this.outputs.push({ id: 'body', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false });
    this.outputs.push({ id: 'end', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false });
  }

  public async execute(input: WorkflowData): Promise<{ [portId: string]: WorkflowData; }> {
    console.log(`Executing LoopNode: ${this.title}`);
    // Loop logic is complex and handled by the execution engine.
    // This node just defines the structure.
    // For now, we just pass through.
    return { 'body': input };
  }
}
