/**
 * End Node
 */
import { BaseNode, NodePosition, WorkflowData } from './BaseNode';

export class EndNode extends BaseNode {
  constructor(position: NodePosition) {
    super(position, 'End');
    this.inputs.push({ id: 'in', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true, portNumber: 1 });
    this.updatePortPositions();
  }

  public async execute(_input: WorkflowData): Promise<{ [portId: string]: WorkflowData; }> {
    console.log('Workflow finished.');
    // The end node doesn't pass data further
    return {};
  }
}
