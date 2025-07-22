/**
 * Conditional Node
 */
import { BaseNode, NodePosition, WorkflowData } from './BaseNode';

export class ConditionalNode extends BaseNode {
  constructor(position: NodePosition) {
    super(position, 'If');
    this.width = 150;
    this.height = 100;
    this.inputs.push({ id: 'in', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true });
    this.outputs.push({ id: 'true', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false });
    this.outputs.push({ id: 'false', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false });
  }

  public async execute(input: WorkflowData): Promise<{ [portId: string]: WorkflowData; }> {
    console.log(`Executing ConditionalNode: ${this.title}`);
    // Simulate a conditional check
    const condition = this.properties.condition || true;
    if (condition) {
      return { 'true': input };
    } else {
      return { 'false': input };
    }
  }
}
