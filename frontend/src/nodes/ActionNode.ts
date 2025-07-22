// frontend/src/nodes/ActionNode.ts
import { BaseNode, NodePosition, WorkflowData } from './BaseNode';
import { OperationUnit, ActionStep, ObservationStep } from '../../../shared/types';

export class ActionNode extends BaseNode {
  constructor(position: NodePosition) {
    super(position, 'Action');
    this.inputs.push({ id: 'in', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true });
    this.outputs.push({ id: 'out', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false });
    this.updatePortPositions();

    // Default properties for an action using OperationUnit
    this.properties.operationUnit = {
      id: crypto.randomUUID(),
      observation: {
        type: 'element_exists',
        target: { primary: { type: 'css', value: '' } },
        timeout_ms: 5000,
        retry_count: 3
      } as ObservationStep,
      action: {
        type: 'click',
        parameters: {}
      } as ActionStep
    } as OperationUnit;
  }

  public async execute(input: WorkflowData): Promise<{ [portId: string]: WorkflowData; }> {
    const operation = this.properties.operationUnit as OperationUnit;
    console.log(`Executing ActionNode: ${this.title}, Action: ${operation.action.type}`);
    
    // In a real scenario, this would interact with the browser extension
    // Here we just pass the data through, maybe adding some execution info
    const outputPayload = {
      ...input.payload,
      lastAction: operation.action.type,
      executedAt: new Date().toISOString()
    };
    
    const outputData: WorkflowData = {
      payload: outputPayload,
      errors: []
    };

    return { 'out': outputData };
  }
}
