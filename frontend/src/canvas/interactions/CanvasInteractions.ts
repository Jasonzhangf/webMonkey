/**
 * Canvas Interactions - 画布交互处理器
 * 职责：鼠标、键盘事件处理，连接验证，节点操作
 */
import { BaseNode, Port } from '../../nodes/BaseNode';
import { Connection, InteractionState } from '../types/CanvasTypes';
import { Sidebar } from '../../components/Sidebar';
import { commandHistory } from '../../commands/CommandHistory';
import { AddConnectionCommand } from '../../commands/AddConnectionCommand';
import { RemoveNodeCommand } from '../../commands/RemoveNodeCommand';
import { RemoveConnectionCommand } from '../../commands/RemoveConnectionCommand';
import { NodeRegistry } from '../../nodes/NodeRegistry';
import { AddNodeCommand } from '../../commands/AddNodeCommand';

export class CanvasInteractions {
  private canvas: HTMLCanvasElement;
  private sidebar: Sidebar;
  private interactionState: InteractionState;
  private nodes: BaseNode[] = [];
  private connections: Connection[] = [];
  private nodeRegistry: NodeRegistry;
  private onRender: () => void;

  constructor(
    canvas: HTMLCanvasElement, 
    sidebar: Sidebar,
    onRender: () => void
  ) {
    this.canvas = canvas;
    this.sidebar = sidebar;
    this.onRender = onRender;
    this.nodeRegistry = NodeRegistry.getInstance();
    
    // 初始化交互状态
    this.interactionState = {
      isDragging: false,
      draggedNode: null,
      dragOffset: { x: 0, y: 0 },
      isDrawingConnection: false,
      connectionStartPort: null,
      tempConnectionEnd: { x: 0, y: 0 },
      hoveredConnection: null,
      selectedNode: null,
      selectedConnection: null,
      clipboard: null
    };

    this.initializeEventListeners();
  }

  public setData(nodes: BaseNode[], connections: Connection[]): void {
    this.nodes = nodes;
    this.connections = connections;
  }

  public getInteractionState(): InteractionState {
    return this.interactionState;
  }

  private initializeEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleMouseDown(event: MouseEvent): void {
    const { x, y } = this.getMousePosition(event);
    let selectedNode: BaseNode | null = null;
    let selectedConnection: Connection | null = null;

    // 检查是否点击了端口
    for (const node of this.nodes) {
      const port = node.getPortAt(x, y);
      if (port) {
        this.interactionState.isDrawingConnection = true;
        this.interactionState.connectionStartPort = port;
        this.interactionState.selectedNode = null;
        this.interactionState.selectedConnection = null;
        this.sidebar.hide();
        return;
      }
      if (node.isInside(x, y)) {
        selectedNode = node;
      }
    }
    
    // 检查是否点击了连线
    if (!selectedNode) {
      for (const conn of this.connections) {
        if (this.isPointOnConnection(x, y, conn)) {
          selectedConnection = conn;
          break;
        }
      }
    }
    
    if (selectedNode) {
      this.interactionState.isDragging = true;
      this.interactionState.draggedNode = selectedNode;
      this.interactionState.selectedNode = selectedNode;
      this.interactionState.selectedConnection = null;
      this.sidebar.show(selectedNode);
      this.interactionState.dragOffset = { 
        x: x - selectedNode.position.x, 
        y: y - selectedNode.position.y 
      };
    } else if (selectedConnection) {
      this.interactionState.selectedConnection = selectedConnection;
      this.interactionState.selectedNode = null;
      this.sidebar.hide();
      console.log('Selected connection:', selectedConnection.id);
    } else {
      this.interactionState.selectedNode = null;
      this.interactionState.selectedConnection = null;
      this.sidebar.hide();
    }
    this.onRender();
  }

  private handleMouseMove(event: MouseEvent): void {
    const { x, y } = this.getMousePosition(event);
    
    if (this.interactionState.isDrawingConnection) {
      this.interactionState.tempConnectionEnd = { x, y };
      this.onRender();
    } else if (this.interactionState.isDragging && this.interactionState.draggedNode) {
      this.interactionState.draggedNode.position = {
        x: x - this.interactionState.dragOffset.x,
        y: y - this.interactionState.dragOffset.y
      };
      this.onRender();
    } else {
      this.updateHoveredConnection(x, y);
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.interactionState.isDrawingConnection && this.interactionState.connectionStartPort) {
      const { x, y } = this.getMousePosition(event);
      let endPort: Port | null = null;
      
      for (const node of this.nodes) {
        const port = node.getPortAt(x, y);
        if (port) {
          endPort = port;
          break;
        }
      }
      
      if (endPort && this.isValidConnection(this.interactionState.connectionStartPort, endPort)) {
        const newConnection = {
          id: crypto.randomUUID(),
          from: this.interactionState.connectionStartPort,
          to: endPort
        };
        const command = new AddConnectionCommand(newConnection);
        commandHistory.execute(command);
      }
    }
    
    this.interactionState.isDrawingConnection = false;
    this.interactionState.connectionStartPort = null;
    this.interactionState.isDragging = false;
    this.interactionState.draggedNode = null;
    this.onRender();
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
      
      // 优先删除选中的连线，如果没有连线选中则删除选中的节点
      if (this.interactionState.selectedConnection) {
        this.deleteSelectedConnection();
      } else if (this.interactionState.selectedNode) {
        this.deleteSelectedNode();
      }
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    // 双击不再删除节点，只用于编辑（将来可能添加节点编辑功能）
    const { x, y } = this.getMousePosition(event);
    const clickedNode = this.nodes.find(node => node.isInside(x, y));
    if (clickedNode) {
      console.log(`Double-clicked node: ${clickedNode.title}`);
      // 可以在这里添加节点编辑弹窗等功能
    }
  }

  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const { x, y } = this.getMousePosition(event);

    // For now, right-clicking a connection will still remove it directly.
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
    
    if (outputPort.isInput || !inputPort.isInput) return false;
    
    // 连线约束规则：
    // 1. 一个输出端口可以连接到多个输入端口
    // 2. 一个输入端口只能接收一个连接
    
    // 检查目标输入端口是否已经有连接
    const existingInputConnection = this.connections.find(conn => 
      conn.to.nodeId === inputPort.nodeId && conn.to.id === inputPort.id
    );
    
    // 如果输入端口已经有连接，不允许新连接
    if (existingInputConnection) {
      console.log(`Input port ${inputPort.id} of node ${inputPort.nodeId} already has a connection`);
      return false;
    }
    
    return true;
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

  private updateHoveredConnection(x: number, y: number): void {
    let somethingHovered = false;
    for (const conn of this.connections) {
      if (this.isPointOnConnection(x, y, conn)) {
        if (this.interactionState.hoveredConnection !== conn) {
          this.interactionState.hoveredConnection = conn;
          this.onRender();
        }
        somethingHovered = true;
        break;
      }
    }
    if (!somethingHovered && this.interactionState.hoveredConnection) {
      this.interactionState.hoveredConnection = null;
      this.onRender();
    }
  }

  private copySelectedNode(): void {
    if (this.interactionState.selectedNode) {
      // Create a deep copy of the selected node
      this.interactionState.clipboard = this.cloneNode(this.interactionState.selectedNode);
      console.log(`Copied node: ${this.interactionState.selectedNode.title}`);
    }
  }

  private pasteNode(): void {
    if (this.interactionState.clipboard) {
      // Clone the clipboard node and position it offset from original
      const pastedNode = this.cloneNode(this.interactionState.clipboard);
      pastedNode.position = {
        x: this.interactionState.clipboard.position.x + 50,
        y: this.interactionState.clipboard.position.y + 50
      };
      
      const command = new AddNodeCommand(pastedNode);
      commandHistory.execute(command);
      console.log(`Pasted node: ${pastedNode.title}`);
    }
  }

  private deleteSelectedNode(): void {
    if (this.interactionState.selectedNode && 
        this.interactionState.selectedNode.type !== 'Start' && 
        this.interactionState.selectedNode.type !== 'End') {
      const command = new RemoveNodeCommand(this.interactionState.selectedNode);
      commandHistory.execute(command);
      this.interactionState.selectedNode = null;
      console.log('Deleted selected node');
    }
  }

  private deleteSelectedConnection(): void {
    if (this.interactionState.selectedConnection) {
      const command = new RemoveConnectionCommand(this.interactionState.selectedConnection);
      commandHistory.execute(command);
      this.interactionState.selectedConnection = null;
      console.log('Deleted selected connection');
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