/**
 * Jump Node
 */
import { BaseNode, NodePosition, WorkflowData } from './BaseNode';

export class JumpNode extends BaseNode {
  constructor(position: NodePosition) {
    super(position, 'Jump');
    this.width = 120;
    this.height = 50;
    this.inputs.push({ id: 'in', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true });
    this.outputs.push({ id: 'out', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false });
  }

  public async execute(input: WorkflowData): Promise<{ [portId: string]: WorkflowData; }> {
    console.log(`Executing JumpNode: ${this.title}`);
    // Jump logic would be handled by the execution engine based on properties
    return { 'out': input };
  }
}
