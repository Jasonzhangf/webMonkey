// frontend/src/canvas/CanvasEditor.ts
import { BaseNode, Port, NodePosition } from '../nodes/BaseNode';
import { NodeRegistry } from '../nodes/NodeRegistry';
import { NodeRenderer } from './NodeRenderer';
import { Sidebar } from '../components/Sidebar';
import { UIPanel } from '../components/UIPanel';
import { CommunicationManager } from '../utils/CommunicationManager';
import { AddNodeMessage, Message } from '../../../shared/types';
import { ActionNode } from '../nodes/ActionNode';
import { editorState, EditorData } from '../state/EditorState';
import { commandHistory } from '../commands/CommandHistory';
import { AddNodeCommand } from '../commands/AddNodeCommand';
import { AddConnectionCommand } from '../commands/AddConnectionCommand';
import { RemoveNodeCommand } from '../commands/RemoveNodeCommand';
import { RemoveConnectionCommand } from '../commands/RemoveConnectionCommand';

// Import other commands as needed (e.g., RemoveNodeCommand)


export interface Connection {
  id: string;
  from: Port;
  to: Port;
}

export class CanvasEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodeRenderer: NodeRenderer;
  private nodeRegistry: NodeRegistry;
  private sidebar: Sidebar;
  private communicationManager: CommunicationManager;
  private nodes: BaseNode[] = [];
  private connections: Connection[] = [];

  // Interaction state
  private isDragging: boolean = false;
  private draggedNode: BaseNode | null = null;
  private dragOffset: { x: number, y: number } = { x: 0, y: 0 };
  private isDrawingConnection: boolean = false;
  private connectionStartPort: Port | null = null;
  private tempConnectionEnd: { x: number, y: number } = { x: 0, y: 0 };
  private hoveredConnection: Connection | null = null;
  private selectedNode: BaseNode | null = null;
  private clipboard: BaseNode | null = null;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;

    this.nodeRegistry = NodeRegistry.getInstance();
    this.nodeRenderer = new NodeRenderer();
    this.sidebar = new Sidebar(this.handleNodeUpdate.bind(this));
    
    new UIPanel(
      this.nodeRegistry.getAllNodeTypeNames(),
      this.addNode.bind(this),
      this.saveWorkflow.bind(this),
      this.loadWorkflow.bind(this),
      this.runWorkflow.bind(this)
    );

    this.communicationManager = new CommunicationManager('ws://localhost:5009');
    this.initialize();
    editorState.subscribe(this.onStateUpdate.bind(this));
  }

  private initialize(): void {
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    window.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.communicationManager.connect();
    this.communicationManager.onMessage.addListener(this.handleBackendMessage.bind(this));

    this.addInitialNodes();
    // this.render(); No longer needed, as setState will trigger the first render
  }

  private handleNodeUpdate(node: BaseNode): void {
    const nodeIndex = this.nodes.findIndex(n => n.id === node.id);
    if (nodeIndex !== -1) {
      this.nodes[nodeIndex] = node;
    }
    // This should now be handled by the state manager
    // this.render();
    const currentState = editorState.getState();
    const nodeToUpdate = currentState.nodes.find(n => n.id === node.id);
    if(nodeToUpdate){
        Object.assign(nodeToUpdate, node);
        editorState.setState(currentState);
    }
  }

  private onStateUpdate(newData: EditorData): void {
      this.nodes = newData.nodes;
      this.connections = newData.connections;
      this.render();
  }

  private resizeCanvas(): void {
    this.canvas.width = this.canvas.parentElement!.clientWidth;
    this.canvas.height = this.canvas.parentElement!.clientHeight;
    this.render();
  }

  public addNode(nodeType: string, position?: NodePosition): void {
    const pos = position || this.findAvailablePosition(this.canvas.width / 2, this.canvas.height / 2);
    const newNode = this.nodeRegistry.createNode(nodeType, pos);
    if (newNode) {
      const command = new AddNodeCommand(newNode);
      commandHistory.execute(command);
    }
  }

  private addInitialNodes(): void {
    const currentState = editorState.getState();
    
    // Only add Start node if it doesn't exist
    const hasStart = currentState.nodes.some(node => node.type === 'Start');
    if (!hasStart) {
      const startPosition = this.findAvailablePosition(100, 200);
      this.addNode('Start', startPosition);
    }
    
    // Only add End node if it doesn't exist  
    const hasEnd = currentState.nodes.some(node => node.type === 'End');
    if (!hasEnd) {
      const endPosition = this.findAvailablePosition(400, 200);
      this.addNode('End', endPosition);
    }
  }

  private findAvailablePosition(preferredX: number, preferredY: number): NodePosition {
    const currentState = editorState.getState();
    const nodeWidth = 180;
    const nodeHeight = 80;
    const spacing = 20;
    
    let testX = preferredX;
    let testY = preferredY;
    
    // Check if position overlaps with existing nodes
    while (this.positionOverlapsWithNodes(testX, testY, nodeWidth, nodeHeight, currentState.nodes)) {
      testX += nodeWidth + spacing;
      // If we've moved too far right, wrap to next row
      if (testX > this.canvas.width - nodeWidth) {
        testX = 100;
        testY += nodeHeight + spacing;
      }
    }
    
    return { x: testX, y: testY };
  }

  private positionOverlapsWithNodes(x: number, y: number, width: number, height: number, existingNodes: BaseNode[]): boolean {
    const margin = 10;
    return existingNodes.some(node => {
      const nodeRight = node.position.x + node.width + margin;
      const nodeBottom = node.position.y + node.height + margin;
      const nodeLeft = node.position.x - margin;
      const nodeTop = node.position.y - margin;
      
      const testRight = x + width;
      const testBottom = y + height;
      
      return !(x >= nodeRight || testRight <= nodeLeft || y >= nodeBottom || testBottom <= nodeTop);
    });
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.drawConnections();
    this.nodes.forEach(node => this.nodeRenderer.draw(this.ctx, node, node === this.selectedNode));
    this.drawTempConnection();
  }

  private drawGrid(): void {
    const gridSize = 20;
    const largeGridSize = gridSize * 5;

    // Draw small grid
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 0.5;
    
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Draw large grid
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x < this.canvas.width; x += largeGridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.canvas.height; y += largeGridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  private drawConnections(): void {
    this.connections.forEach(conn => {
        const isHovered = this.hoveredConnection === conn;
        this.ctx.strokeStyle = isHovered ? '#FFC107' : '#888';
        this.ctx.lineWidth = isHovered ? 4 : 3;
        this.ctx.beginPath();
        this.ctx.moveTo(conn.from.position.x, conn.from.position.y);
        const cp1x = conn.from.position.x + 50;
        const cp1y = conn.from.position.y;
        const cp2x = conn.to.position.x - 50;
        const cp2y = conn.to.position.y;
        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, conn.to.position.x, conn.to.position.y);
        this.ctx.stroke();
    });
    this.ctx.lineWidth = 1;
  }

  private drawTempConnection(): void {
    if (this.isDrawingConnection && this.connectionStartPort) {
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.connectionStartPort.position.x, this.connectionStartPort.position.y);
        this.ctx.lineTo(this.tempConnectionEnd.x, this.tempConnectionEnd.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    const { x, y } = this.getMousePosition(event);
    let selectedNode: BaseNode | null = null;

    for (const node of this.nodes) {
      const port = node.getPortAt(x, y);
      if (port) {
        this.isDrawingConnection = true;
        this.connectionStartPort = port;
        return;
      }
      if (node.isInside(x, y)) {
        selectedNode = node;
      }
    }
    
    if (selectedNode) {
        this.isDragging = true;
        this.draggedNode = selectedNode;
        this.selectedNode = selectedNode;
        this.sidebar.show(selectedNode);
        this.dragOffset = { x: x - selectedNode.position.x, y: y - selectedNode.position.y };
    } else {
        this.selectedNode = null;
        this.sidebar.hide();
    }
    this.render();
  }

  private handleMouseMove(event: MouseEvent): void {
    const { x, y } = this.getMousePosition(event);
    if (this.isDrawingConnection) {
      this.tempConnectionEnd = { x, y };
      this.render();
    } else if (this.isDragging && this.draggedNode) {
      this.draggedNode.position = {
        x: x - this.dragOffset.x,
        y: y - this.dragOffset.y
      };
      this.render();
    } else {
        this.updateHoveredConnection(x, y);
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.isDrawingConnection && this.connectionStartPort) {
      const { x, y } = this.getMousePosition(event);
      let endPort: Port | null = null;
      for (const node of this.nodes) {
          const port = node.getPortAt(x, y);
          if (port) {
              endPort = port;
              break;
          }
      }
      if (endPort && this.isValidConnection(this.connectionStartPort, endPort)) {
        const newConnection = {
            id: crypto.randomUUID(),
            from: this.connectionStartPort,
            to: endPort
        };
        const command = new AddConnectionCommand(newConnection);
        commandHistory.execute(command);
    }
    }
    this.isDrawingConnection = false;
    this.connectionStartPort = null;
    this.isDragging = false;
    this.draggedNode = null;
    this.render();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z') {
            event.preventDefault();
            commandHistory.undo();
        } else if (event.key === 'y') {
            event.preventDefault();
            commandHistory.redo();
        } else if (event.key === 'c') {
            event.preventDefault();
            this.copySelectedNode();
        } else if (event.key === 'v') {
            event.preventDefault();
            this.pasteNode();
        }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        this.deleteSelectedNode();
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    const { x, y } = this.getMousePosition(event);
    const nodeToRemove = this.nodes.find(node => node.isInside(x, y));
    if (nodeToRemove && nodeToRemove.type !== 'Start' && nodeToRemove.type !== 'End') {
      const command = new RemoveNodeCommand(nodeToRemove);
      commandHistory.execute(command);
    }
  }


  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const { x, y } = this.getMousePosition(event);

    // For now, right-clicking a connection will still remove it directly.
    // This could be converted to a command later.
    for (let i = this.connections.length - 1; i >= 0; i--) {
      const conn = this.connections[i];
      if (this.isPointOnConnection(x, y, conn)) {
        const command = new RemoveConnectionCommand(conn);
        commandHistory.execute(command);
        return;
      }
    }
  }

  private getMousePosition(event: MouseEvent): { x: number, y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  
  private isValidConnection(startPort: Port, endPort: Port): boolean {
    // Cannot connect to the same node
    if (startPort.nodeId === endPort.nodeId) return false;
    
    // Must connect input to output or output to input
    if (startPort.isInput === endPort.isInput) return false;
    
    // The connection should go from output to input
    const outputPort = startPort.isInput ? endPort : startPort;
    const inputPort = startPort.isInput ? startPort : endPort;
    
    return !outputPort.isInput && inputPort.isInput;
  }

  private isPointOnConnection(px: number, py: number, conn: Connection): boolean {
    const from = conn.from.position;
    const to = conn.to.position;
    const cp1 = { x: from.x + 50, y: from.y };
    const cp2 = { x: to.x - 50, y: to.y };
    const tolerance = 5;
    for (let t = 0; t <= 1; t += 0.01) {
        const invT = 1 - t;
        const x = Math.pow(invT, 3) * from.x + 3 * Math.pow(invT, 2) * t * cp1.x + 3 * invT * Math.pow(t, 2) * cp2.x + Math.pow(t, 3) * to.x;
        const y = Math.pow(invT, 3) * from.y + 3 * Math.pow(invT, 2) * t * cp1.y + 3 * invT * Math.pow(t, 2) * cp2.y + Math.pow(t, 3) * to.y;
        if (Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2)) < tolerance) {
            return true;
        }
    }
    return false;
  }

  private updateHoveredConnection(x: number, y: number) {
      let somethingHovered = false;
      for (const conn of this.connections) {
          if (this.isPointOnConnection(x, y, conn)) {
              if (this.hoveredConnection !== conn) {
                  this.hoveredConnection = conn;
                  this.render();
              }
              somethingHovered = true;
              break;
          }
      }
      if (!somethingHovered && this.hoveredConnection) {
          this.hoveredConnection = null;
          this.render();
      }
  }

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
      if(newNode){
        newNode.properties.operationUnit.action = operation;
        newNode.properties.operationUnit.observation.target = {primary: {type: 'css', value: selector.selectors.css}};
        newNode.title = `${operation.type} Action`;
        const command = new AddNodeCommand(newNode);
        commandHistory.execute(command);
      }
    }
  }
  
  private runWorkflow(): void {
    const workflowData = this.serializeWorkflow();
    
    // Send to backend for real execution
    this.communicationManager.sendMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: workflowData,
    });
    
    // Also run a local simulation for demonstration
    this.runLocalWorkflowSimulation();
    
    console.log('Workflow sent to backend for execution:', workflowData);
  }
  
  private async runLocalWorkflowSimulation(): Promise<void> {
    console.log('Starting local workflow simulation...');
    
    // Find start node
    const startNode = this.nodes.find(node => node.type === 'Start');
    if (!startNode) {
      console.error('No start node found');
      return;
    }
    
    // Execute workflow starting from start node
    await this.executeNodeAndFollowConnections(startNode, { payload: {}, errors: [] });
  }
  
  private async executeNodeAndFollowConnections(node: BaseNode, inputData: any): Promise<void> {
    // Update node state to running
    node.executionState = 'running';
    this.render();
    
    try {
      // Execute the node
      console.log(`Executing node: ${node.title} (${node.type})`);
      const outputs = await node.execute(inputData);
      
      // Mark as completed
      node.executionState = 'completed';
      this.render();
      
      // Follow connections to next nodes
      for (const outputPortId in outputs) {
        const outputData = outputs[outputPortId];
        const outputPort = node.outputs.find(p => p.id === outputPortId);
        
        if (outputPort) {
          // Find connections from this output port
          const outgoingConnections = this.connections.filter(conn => 
            conn.from.nodeId === node.id && conn.from.id === outputPortId
          );
          
          // Execute connected nodes
          for (const connection of outgoingConnections) {
            const nextNode = this.nodes.find(n => n.id === connection.to.nodeId);
            if (nextNode) {
              // Add a delay for visualization
              await new Promise(resolve => setTimeout(resolve, 1000));
              await this.executeNodeAndFollowConnections(nextNode, outputData);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error executing node ${node.title}:`, error);
      node.executionState = 'failed';
      this.render();
    }
  }

  private serializeWorkflow() {
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

  private copySelectedNode(): void {
    if (this.selectedNode) {
      // Create a deep copy of the selected node
      this.clipboard = this.cloneNode(this.selectedNode);
      console.log(`Copied node: ${this.selectedNode.title}`);
    }
  }

  private pasteNode(): void {
    if (this.clipboard) {
      // Clone the clipboard node and position it offset from original
      const pastedNode = this.cloneNode(this.clipboard);
      pastedNode.position = {
        x: this.clipboard.position.x + 50,
        y: this.clipboard.position.y + 50
      };
      
      const command = new AddNodeCommand(pastedNode);
      commandHistory.execute(command);
      console.log(`Pasted node: ${pastedNode.title}`);
    }
  }

  private deleteSelectedNode(): void {
    if (this.selectedNode && this.selectedNode.type !== 'Start' && this.selectedNode.type !== 'End') {
      const command = new RemoveNodeCommand(this.selectedNode);
      commandHistory.execute(command);
      this.selectedNode = null;
      console.log('Deleted selected node');
    }
  }

  private cloneNode(node: BaseNode): BaseNode {
    // Create a new node of the same type
    const clonedNode = this.nodeRegistry.createNode(node.type, {
      x: node.position.x,
      y: node.position.y
    });
    
    if (clonedNode) {
      // Copy properties
      clonedNode.properties = JSON.parse(JSON.stringify(node.properties));
      clonedNode.title = node.title;
    }
    
    return clonedNode!;
  }
}
