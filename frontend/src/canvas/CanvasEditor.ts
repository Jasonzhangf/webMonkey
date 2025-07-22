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
  private nodeCounter: number = 0; // 节点计数器，用于分配连续编号

  // Interaction state
  private isDragging: boolean = false;
  private draggedNode: BaseNode | null = null;
  private dragOffset: { x: number, y: number } = { x: 0, y: 0 };
  private isDrawingConnection: boolean = false;
  private connectionStartPort: Port | null = null;
  private tempConnectionEnd: { x: number, y: number } = { x: 0, y: 0 };
  private hoveredConnection: Connection | null = null;
  private selectedNode: BaseNode | null = null;
  private selectedConnection: Connection | null = null; // 选中的连线
  private clipboard: BaseNode | null = null;
  private nodeVariables: Map<string, any> = new Map(); // 全局节点变量存储

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
      this.runWorkflow.bind(this),
      this // 传递CanvasEditor实例给UIPanel
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
    
    // 启动动画循环
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

  public addNode(nodeType: string, position?: NodePosition): BaseNode | null {
    const pos = position || this.findAvailablePosition(this.canvas.width / 2, this.canvas.height / 2);
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

  private addInitialNodes(): void {
    const currentState = editorState.getState();
    
    // 如果已经有节点了，只确保有Start和End节点
    if (currentState.nodes.length > 0) {
      this.ensureStartEndNodes();
      return;
    }

    console.log('Creating default test workflow...');

    // 创建默认测试工作流
    this.createDefaultTestWorkflow();
  }

  private ensureStartEndNodes(): void {
    const currentState = editorState.getState();
    
    // 检查是否有Start节点
    const hasStart = currentState.nodes.some(node => node.type === 'Start');
    if (!hasStart) {
      const startPosition = this.findAvailablePosition(300, 250);
      this.addNode('Start', startPosition);
    }
    
    // 检查是否有End节点
    const hasEnd = currentState.nodes.some(node => node.type === 'End');
    if (!hasEnd) {
      const endPosition = this.findAvailablePosition(1100, 200);
      this.addNode('End', endPosition);
    }
  }

  private createDefaultTestWorkflow(): void {
    // 节点位置配置 - 初始位置，稍后会自动排版
    const baseX = 320;
    const baseY = 150;
    const spacing = 220;
    
    const positions = {
      start: { x: baseX, y: baseY },                              // 开始节点
      startDisplay: { x: baseX, y: baseY + 80 },                 // Start数据显示
      contentGen1: { x: baseX + spacing, y: baseY - 80 },       // 第一个生成器 - 用户数据  
      gen1Display: { x: baseX + spacing, y: baseY - 10 },       // Generator1数据显示
      contentGen2: { x: baseX + spacing, y: baseY + 50 },       // 第二个生成器 - 产品数据
      gen2Display: { x: baseX + spacing, y: baseY + 120 },      // Generator2数据显示
      merger: { x: baseX + spacing * 2, y: baseY },             // 合并节点
      mergerDisplay: { x: baseX + spacing * 2, y: baseY + 80 }, // Merger数据显示
      filter: { x: baseX + spacing * 3, y: baseY },             // 过滤节点
      filterDisplay: { x: baseX + spacing * 3, y: baseY + 80 }, // Filter数据显示
      finalDisplay: { x: baseX + spacing * 4, y: baseY },       // 最终显示节点
      end: { x: baseX + spacing * 5, y: baseY }                 // 结束节点
    };

    // 1. Start节点 (包含基础配置数据)
    const startNode = this.addNode('Start', positions.start);
    console.log('Created Start node:', startNode);
    
    // 1.1 Start数据显示节点
    const startDisplayNode = this.addNode('Display', positions.startDisplay);
    if (startDisplayNode) {
      startDisplayNode.properties = {
        displayFormat: 'json',
        maxDepth: 2,
        showTypes: true,
        collapseMode: 'first-level'
      };
      startDisplayNode.title = 'Start Data';
    }
    
    // 2. 第一个ContentGenerator节点 - 生成用户数据
    const contentGen1Node = this.addNode('ContentGenerator', positions.contentGen1);
    if (contentGen1Node) {
      contentGen1Node.properties = {
        templateName: 'user-profile',
        customCount: 1,
        includeTimestamp: true,
        mergeMode: 'extend'
      };
      contentGen1Node.title = 'User Data';
    }
    
    // 2.1 Generator1数据显示节点
    const gen1DisplayNode = this.addNode('Display', positions.gen1Display);
    if (gen1DisplayNode) {
      gen1DisplayNode.properties = {
        displayFormat: 'json',
        maxDepth: 3,
        showTypes: false,
        collapseMode: 'first-level'
      };
      gen1DisplayNode.title = 'User Generated';
    }
    
    // 3. 第二个ContentGenerator节点 - 生成产品数据
    const contentGen2Node = this.addNode('ContentGenerator', positions.contentGen2);
    if (contentGen2Node) {
      contentGen2Node.properties = {
        templateName: 'product-catalog',
        customCount: 3,
        includeTimestamp: true,
        mergeMode: 'extend'
      };
      contentGen2Node.title = 'Product Data';
    }
    
    // 3.1 Generator2数据显示节点
    const gen2DisplayNode = this.addNode('Display', positions.gen2Display);
    if (gen2DisplayNode) {
      gen2DisplayNode.properties = {
        displayFormat: 'json',
        maxDepth: 3,
        showTypes: false,
        collapseMode: 'first-level'
      };
      gen2DisplayNode.title = 'Product Generated';
    }

    // 4. JsonMerger节点 - 合并两个Generator的数据
    const mergerNode = this.addNode('JsonMerger', positions.merger);
    if (mergerNode) {
      mergerNode.properties = {
        mergeStrategy: 'merge',
        mergeKey: 'root', // 合并到根级别
        conflictResolution: 'combine',
        deepMerge: true,
        preserveArrays: true
      };
      mergerNode.title = 'Data Merger';
    }
    
    // 4.1 Merger数据显示节点
    const mergerDisplayNode = this.addNode('Display', positions.mergerDisplay);
    if (mergerDisplayNode) {
      mergerDisplayNode.properties = {
        displayFormat: 'json',
        maxDepth: 4,
        showTypes: false,
        collapseMode: 'first-level'
      };
      mergerDisplayNode.title = 'Merged Data';
    }

    // 5. JsonFilter节点 - 过滤关键字段
    const filterNode = this.addNode('JsonFilter', positions.filter);
    if (filterNode) {
      filterNode.properties = {
        filterMode: 'include',
        filterPaths: [
          'user.name',
          'user.email', 
          'products',
          'generatedAt'
        ],
        preserveStructure: true,
        allowEmptyResults: true,
        includeMetadata: true
      };
      filterNode.title = 'Key Fields Filter';
    }
    
    // 5.1 Filter数据显示节点
    const filterDisplayNode = this.addNode('Display', positions.filterDisplay);
    if (filterDisplayNode) {
      filterDisplayNode.properties = {
        displayFormat: 'json',
        maxDepth: 4,
        showTypes: false,
        collapseMode: 'first-level'
      };
      filterDisplayNode.title = 'Filtered Data';
    }

    // 6. 最终Display节点 - 显示处理结果
    const finalDisplayNode = this.addNode('Display', positions.finalDisplay);
    if (finalDisplayNode) {
      finalDisplayNode.properties = {
        displayFormat: 'json',
        maxDepth: 5,
        showTypes: true,
        collapseMode: 'expanded'
      };
      finalDisplayNode.title = 'Final Result';
    }

    // 7. End节点
    const endNode = this.addNode('End', positions.end);
    console.log('Created End node:', endNode);

    // 验证所有节点都创建成功
    console.log('All nodes created:', { 
      startNode, startDisplayNode, 
      contentGen1Node, gen1DisplayNode,
      contentGen2Node, gen2DisplayNode, 
      mergerNode, mergerDisplayNode,
      filterNode, filterDisplayNode,
      finalDisplayNode, endNode 
    });

    // 等待节点创建完成，然后创建连接和应用排版
    setTimeout(() => {
      this.createDefaultConnections();
      // 在连接创建后应用智能排版
      setTimeout(() => {
        this.autoLayoutNodes();
      }, 200);
    }, 100);
  }

  private createDefaultConnections(): void {
    const currentState = editorState.getState();
    const nodes = currentState.nodes;

    // 查找主要处理节点
    const startNode = nodes.find(n => n.type === 'Start');
    const contentGenNodes = nodes.filter(n => n.type === 'ContentGenerator');
    const mergerNode = nodes.find(n => n.type === 'JsonMerger');  
    const filterNode = nodes.find(n => n.type === 'JsonFilter');
    const endNode = nodes.find(n => n.type === 'End');

    // 查找所有Display节点（按title区分）
    const displayNodes = nodes.filter(n => n.type === 'Display');
    const startDisplayNode = displayNodes.find(n => n.title === 'Start Data');
    const gen1DisplayNode = displayNodes.find(n => n.title === 'User Generated');
    const gen2DisplayNode = displayNodes.find(n => n.title === 'Product Generated');
    const mergerDisplayNode = displayNodes.find(n => n.title === 'Merged Data');
    const filterDisplayNode = displayNodes.find(n => n.title === 'Filtered Data');
    const finalDisplayNode = displayNodes.find(n => n.title === 'Final Result');

    console.log('Found display nodes:', {
      startDisplay: !!startDisplayNode,
      gen1Display: !!gen1DisplayNode,
      gen2Display: !!gen2DisplayNode,
      mergerDisplay: !!mergerDisplayNode,
      filterDisplay: !!filterDisplayNode,
      finalDisplay: !!finalDisplayNode
    });

    if (!startNode || contentGenNodes.length < 2 || !mergerNode || !filterNode || !endNode) {
      console.error('Not all main nodes found for creating connections. Found:', {
        startNode: !!startNode,
        contentGenNodes: contentGenNodes.length,
        mergerNode: !!mergerNode,
        filterNode: !!filterNode,
        endNode: !!endNode
      });
      return;
    }

    // 区分两个ContentGenerator（按title区分）
    const userDataGen = contentGenNodes.find(n => n.title === 'User Data');
    const productDataGen = contentGenNodes.find(n => n.title === 'Product Data');

    if (!userDataGen || !productDataGen) {
      console.error('Could not distinguish ContentGenerator nodes');
      return;
    }

    const connections = [];
    let connectionId = Date.now();

    try {
      // 主要数据流连接
      
      // Start -> User Data Generator
      const startOutPort = startNode.outputs[0];
      const userGenInPort = userDataGen.inputs[0];
      if (startOutPort && userGenInPort) {
        connections.push({
          id: `conn_${connectionId++}`,
          from: startOutPort,
          to: userGenInPort
        });
      }

      // Start -> Product Data Generator  
      const productGenInPort = productDataGen.inputs[0];
      if (startOutPort && productGenInPort) {
        connections.push({
          id: `conn_${connectionId++}`,
          from: startOutPort,
          to: productGenInPort
        });
      }

      // User Data Generator -> JsonMerger (input1)
      const userGenOutPort = userDataGen.outputs[0];
      const mergerIn1Port = mergerNode.inputs[0];
      if (userGenOutPort && mergerIn1Port) {
        connections.push({
          id: `conn_${connectionId++}`,
          from: userGenOutPort,
          to: mergerIn1Port
        });
      }

      // Product Data Generator -> JsonMerger (input2)
      const productGenOutPort = productDataGen.outputs[0];
      const mergerIn2Port = mergerNode.inputs[1];
      if (productGenOutPort && mergerIn2Port) {
        connections.push({
          id: `conn_${connectionId++}`,
          from: productGenOutPort,
          to: mergerIn2Port
        });
      }

      // JsonMerger -> JsonFilter
      const mergerOutPort = mergerNode.outputs[0];
      const filterInPort = filterNode.inputs[0];
      if (mergerOutPort && filterInPort) {
        connections.push({
          id: `conn_${connectionId++}`,
          from: mergerOutPort,
          to: filterInPort
        });
      }

      // JsonFilter -> Final Display
      const filterOutPort = filterNode.outputs[0];
      if (filterOutPort && finalDisplayNode) {
        const finalDisplayInPort = finalDisplayNode.inputs[0];
        if (finalDisplayInPort) {
          connections.push({
            id: `conn_${connectionId++}`,
            from: filterOutPort,
            to: finalDisplayInPort
          });
        }
      }

      // Final Display -> End
      if (finalDisplayNode && endNode) {
        const finalDisplayOutPort = finalDisplayNode.outputs[0];
        const endInPort = endNode.inputs[0];
        if (finalDisplayOutPort && endInPort) {
          connections.push({
            id: `conn_${connectionId++}`,
            from: finalDisplayOutPort,
            to: endInPort
          });
        }
      }

      // 数据监控连接 - 为每个处理节点添加Display节点
      
      // Start -> Start Display
      if (startOutPort && startDisplayNode) {
        const startDisplayInPort = startDisplayNode.inputs[0];
        if (startDisplayInPort) {
          connections.push({
            id: `conn_${connectionId++}`,
            from: startOutPort,
            to: startDisplayInPort
          });
        }
      }

      // User Data Generator -> User Generated Display
      if (userGenOutPort && gen1DisplayNode) {
        const gen1DisplayInPort = gen1DisplayNode.inputs[0];
        if (gen1DisplayInPort) {
          connections.push({
            id: `conn_${connectionId++}`,
            from: userGenOutPort,
            to: gen1DisplayInPort
          });
        }
      }

      // Product Data Generator -> Product Generated Display
      if (productGenOutPort && gen2DisplayNode) {
        const gen2DisplayInPort = gen2DisplayNode.inputs[0];
        if (gen2DisplayInPort) {
          connections.push({
            id: `conn_${connectionId++}`,
            from: productGenOutPort,
            to: gen2DisplayInPort
          });
        }
      }

      // JsonMerger -> Merged Data Display
      if (mergerOutPort && mergerDisplayNode) {
        const mergerDisplayInPort = mergerDisplayNode.inputs[0];
        if (mergerDisplayInPort) {
          connections.push({
            id: `conn_${connectionId++}`,
            from: mergerOutPort,
            to: mergerDisplayInPort
          });
        }
      }

      // JsonFilter -> Filtered Data Display
      if (filterOutPort && filterDisplayNode) {
        const filterDisplayInPort = filterDisplayNode.inputs[0];
        if (filterDisplayInPort) {
          connections.push({
            id: `conn_${connectionId++}`,
            from: filterOutPort,
            to: filterDisplayInPort
          });
        }
      }

      // 更新状态
      const newState = {
        ...currentState,
        connections: connections
      };
      
      editorState.setState(newState);
      console.log('Default test workflow created successfully!');
      console.log(`Created ${connections.length} connections`);
      console.log('Enhanced workflow with data visualization at each step:');
      console.log('Main flow: Start → UserGen → Merge ← ProductGen ← Start → Filter → Final Display → End');
      console.log('Monitor flows: Each data node → corresponding Display node');
      
    } catch (error) {
      console.error('Error creating default connections:', error);
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
        const isSelected = this.selectedConnection === conn;
        
        // 选中状态优先级最高，然后是悬停状态
        if (isSelected) {
          this.ctx.strokeStyle = '#FF4081'; // 粉红色表示选中
          this.ctx.lineWidth = 5;
        } else if (isHovered) {
          this.ctx.strokeStyle = '#FFC107'; // 黄色表示悬停
          this.ctx.lineWidth = 4;
        } else {
          this.ctx.strokeStyle = '#888'; // 默认灰色
          this.ctx.lineWidth = 3;
        }
        
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
    let selectedConnection: Connection | null = null;

    // 检查是否点击了端口
    for (const node of this.nodes) {
      const port = node.getPortAt(x, y);
      if (port) {
        this.isDrawingConnection = true;
        this.connectionStartPort = port;
        this.selectedNode = null;
        this.selectedConnection = null;
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
        this.isDragging = true;
        this.draggedNode = selectedNode;
        this.selectedNode = selectedNode;
        this.selectedConnection = null;
        this.sidebar.show(selectedNode);
        this.dragOffset = { x: x - selectedNode.position.x, y: y - selectedNode.position.y };
    } else if (selectedConnection) {
        this.selectedConnection = selectedConnection;
        this.selectedNode = null;
        this.sidebar.hide();
        console.log('Selected connection:', selectedConnection.id);
    } else {
        this.selectedNode = null;
        this.selectedConnection = null;
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
        
        // 优先删除选中的连线，如果没有连线选中则删除选中的节点
        if (this.selectedConnection) {
            this.deleteSelectedConnection();
        } else if (this.selectedNode) {
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
      
      // 收集所有输出连接，按端口编号排序
      const allOutgoingConnections: { connection: Connection; outputData: any; portNumber: number }[] = [];
      
      for (const outputPortId in outputs) {
        const outputData = outputs[outputPortId];
        const outputPort = node.outputs.find(p => p.id === outputPortId);
        
        if (outputPort) {
          // Find connections from this output port
          const outgoingConnections = this.connections.filter(conn => 
            conn.from.nodeId === node.id && conn.from.id === outputPortId
          );
          
          // 为每个连接添加端口编号信息
          outgoingConnections.forEach(conn => {
            allOutgoingConnections.push({
              connection: conn,
              outputData: outputData,
              portNumber: outputPort.portNumber || 0
            });
          });
        }
      }
      
      // 按照端口编号排序（端口编号相同的并行执行）
      allOutgoingConnections.sort((a, b) => a.portNumber - b.portNumber);
      
      // 按端口编号分组执行
      const portGroups = new Map<number, typeof allOutgoingConnections>();
      allOutgoingConnections.forEach(item => {
        const portNum = item.portNumber;
        if (!portGroups.has(portNum)) {
          portGroups.set(portNum, []);
        }
        portGroups.get(portNum)!.push(item);
      });
      
      // 按编号顺序执行每组端口的连接（组内并行，组间串行）
      const sortedPortNumbers = Array.from(portGroups.keys()).sort((a, b) => a - b);
      
      for (const portNumber of sortedPortNumbers) {
        const group = portGroups.get(portNumber)!;
        console.log(`Executing port group ${portNumber} with ${group.length} connections`);
        
        // 组内并行执行
        const promises = group.map(async ({ connection, outputData }) => {
          const nextNode = this.nodes.find(n => n.id === connection.to.nodeId);
          if (nextNode) {
            // Add a delay for visualization
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.executeNodeAndFollowConnections(nextNode, outputData);
          }
        });
        
        // 等待当前组的所有连接执行完成后，再执行下一组
        await Promise.all(promises);
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

  private deleteSelectedConnection(): void {
    if (this.selectedConnection) {
      const command = new RemoveConnectionCommand(this.selectedConnection);
      commandHistory.execute(command);
      this.selectedConnection = null;
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

  // 节点变量访问系统
  public setNodeVariable(nodeName: string, key: string, value: any): void {
    const nodeVarKey = `${nodeName}.${key}`;
    this.nodeVariables.set(nodeVarKey, value);
    console.log(`Set variable: ${nodeVarKey} = ${JSON.stringify(value)}`);
  }

  public getNodeVariable(nodeName: string, key: string): any {
    const nodeVarKey = `${nodeName}.${key}`;
    return this.nodeVariables.get(nodeVarKey);
  }

  public resolveVariableExpression(expression: string): any {
    // 解析形如 "nodeName.variableName" 的表达式
    if (expression.includes('.')) {
      const [nodeName, ...pathParts] = expression.split('.');
      const variablePath = pathParts.join('.');
      
      // 查找节点
      const node = this.nodes.find(n => n.nodeName === nodeName);
      if (!node) {
        console.warn(`Node not found: ${nodeName}`);
        return undefined;
      }

      // 从节点变量中获取值
      let value = node.variables[variablePath] || this.getNodeVariable(nodeName, variablePath);
      
      // 支持深层访问，如 "user.name.first"
      if (value && pathParts.length > 1) {
        let current = value;
        for (let i = 1; i < pathParts.length; i++) {
          if (current && typeof current === 'object' && pathParts[i] in current) {
            current = current[pathParts[i]];
          } else {
            return undefined;
          }
        }
        value = current;
      }

      console.log(`Resolved variable: ${expression} = ${JSON.stringify(value)}`);
      return value;
    }
    
    return expression; // 不是变量表达式，直接返回
  }

  public getAllNodeVariables(): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    
    // 从nodeVariables Map中获取所有变量
    this.nodeVariables.forEach((value, key) => {
      result[key] = value;
    });
    
    // 从各个节点的variables中获取变量
    this.nodes.forEach(node => {
      if (node.nodeName && Object.keys(node.variables).length > 0) {
        Object.entries(node.variables).forEach(([key, value]) => {
          result[`${node.nodeName}.${key}`] = value;
        });
      }
    });
    
    return result;
  }

  // 自动排版功能：按层级布局，处理并列元素
  public autoLayoutNodes(): void {
    console.log('Starting auto layout...');
    
    if (this.nodes.length === 0) {
      console.log('No nodes to layout');
      return;
    }
    
    // 获取层级化的节点布局
    const layers = this.getLayeredLayout();
    
    console.log('Layered layout:', layers.map((layer, i) => 
      `Layer ${i}: [${layer.map(n => n.title).join(', ')}]`
    ));
    
    // 布局参数
    const startX = 320; // 避开左侧工具栏（240px + 80px边距）
    const baseY = 150; // 基础垂直位置
    const horizontalSpacing = 220; // 层级间水平间距
    const verticalSpacing = 100; // 并列节点间垂直间距
    const layerPadding = 50; // 层级内部的额外间距
    
    console.log(`Layout params: startX=${startX}, horizontalSpacing=${horizontalSpacing}, verticalSpacing=${verticalSpacing}`);
    
    // 按层级布局节点
    layers.forEach((layer, layerIndex) => {
      const layerX = startX + layerIndex * horizontalSpacing;
      const nodesInLayer = layer.length;
      
      // 计算层级内节点的垂直分布
      if (nodesInLayer === 1) {
        // 单个节点：居中放置
        layer[0].position = { x: layerX, y: baseY };
        console.log(`Layer ${layerIndex} - Single node: ${layer[0].title} at (${layerX}, ${baseY})`);
      } else {
        // 多个节点：垂直分布
        const totalHeight = (nodesInLayer - 1) * verticalSpacing;
        const startY = baseY - totalHeight / 2;
        
        layer.forEach((node, nodeIndex) => {
          const nodeY = startY + nodeIndex * verticalSpacing;
          node.position = { x: layerX, y: nodeY };
          console.log(`Layer ${layerIndex} - Node ${nodeIndex}: ${node.title} at (${layerX}, ${nodeY})`);
        });
      }
    });
    
    // 刷新显示
    this.render();
    
    // 更新状态（触发保存）
    const currentState = editorState.getState();
    editorState.setState({
      ...currentState,
      nodes: this.nodes
    });
    
    console.log('Auto layout completed!');
  }

  private getLayeredLayout(): BaseNode[][] {
    // 寻找起始节点
    const startNode = this.nodes.find(node => node.type === 'Start');
    if (!startNode) {
      console.log('No start node found, using fallback layering');
      return this.getFallbackLayering();
    }
    
    console.log('Creating layered layout from Start node');
    return this.createWorkflowLayers(startNode);
  }

  private createWorkflowLayers(startNode: BaseNode): BaseNode[][] {
    const layers: BaseNode[][] = [];
    const visited = new Set<string>();
    const nodeToLayer = new Map<string, number>();
    
    // BFS to assign layers
    const queue: Array<{ node: BaseNode, layer: number }> = [{ node: startNode, layer: 0 }];
    
    while (queue.length > 0) {
      const { node, layer } = queue.shift()!;
      
      if (visited.has(node.id)) {
        continue;
      }
      
      visited.add(node.id);
      nodeToLayer.set(node.id, layer);
      
      // 确保层级数组足够长
      while (layers.length <= layer) {
        layers.push([]);
      }
      
      layers[layer].push(node);
      console.log(`Added ${node.title} to layer ${layer}`);
      
      // 找到所有连接的下级节点
      const outgoingConnections = this.connections.filter(conn => conn.from.nodeId === node.id);
      const nextNodes = outgoingConnections
        .map(conn => this.nodes.find(n => n.id === conn.to.nodeId))
        .filter(n => n && !visited.has(n.id)) as BaseNode[];
      
      // 将下级节点加入队列（下一层）
      nextNodes.forEach(nextNode => {
        queue.push({ node: nextNode, layer: layer + 1 });
      });
    }
    
    // 处理任何未访问的孤立节点
    const unvisited = this.nodes.filter(node => !visited.has(node.id));
    if (unvisited.length > 0) {
      console.log(`Adding ${unvisited.length} unvisited nodes to final layer`);
      layers.push(unvisited.sort((a, b) => {
        const numberA = (a as any).nodeNumber || 0;
        const numberB = (b as any).nodeNumber || 0;
        return numberA - numberB;
      }));
    }
    
    // 在每层内部按节点编号排序，确保一致性
    layers.forEach((layer, layerIndex) => {
      layer.sort((a, b) => {
        const numberA = (a as any).nodeNumber || 0;
        const numberB = (b as any).nodeNumber || 0;
        return numberA - numberB;
      });
      console.log(`Layer ${layerIndex} sorted: [${layer.map(n => `${(n as any).nodeNumber}:${n.title}`).join(', ')}]`);
    });
    
    return layers;
  }

  private getFallbackLayering(): BaseNode[][] {
    // 备选方案：按节点编号分层
    const sortedNodes = [...this.nodes].sort((a, b) => {
      const numberA = (a as any).nodeNumber || 0;
      const numberB = (b as any).nodeNumber || 0;
      return numberA - numberB;
    });
    
    // 简单分层：每3个节点一层
    const layers: BaseNode[][] = [];
    const nodesPerLayer = 3;
    
    for (let i = 0; i < sortedNodes.length; i += nodesPerLayer) {
      layers.push(sortedNodes.slice(i, i + nodesPerLayer));
    }
    
    console.log('Using fallback layering:', layers.map((layer, i) => 
      `Layer ${i}: [${layer.map(n => n.title).join(', ')}]`
    ));
    
    return layers;
  }

  private getWorkflowBasedLayout(): BaseNode[] {
    // 优先尝试基于工作流逻辑的排序
    const startNode = this.nodes.find(node => node.type === 'Start');
    if (startNode) {
      console.log('Using workflow-based layout');
      return this.getTopologicalSort(startNode);
    }
    
    // 备选方案：按节点编号排序
    console.log('Fallback to number-based layout');
    return [...this.nodes].sort((a, b) => {
      const numberA = (a as any).nodeNumber || 0;
      const numberB = (b as any).nodeNumber || 0;
      return numberA - numberB;
    });
  }

  private getTopologicalSort(startNode: BaseNode): BaseNode[] {
    const visited = new Set<string>();
    const result: BaseNode[] = [];
    const visiting = new Set<string>(); // 用于检测环路
    
    const visit = (node: BaseNode) => {
      if (visiting.has(node.id)) {
        console.warn('Cycle detected in workflow, using fallback layout');
        return;
      }
      
      if (visited.has(node.id)) {
        return;
      }
      
      visiting.add(node.id);
      visited.add(node.id);
      result.push(node);
      
      // 找到所有从当前节点连出的节点
      const outgoingConnections = this.connections.filter(conn => conn.from.nodeId === node.id);
      const nextNodes = outgoingConnections
        .map(conn => this.nodes.find(n => n.id === conn.to.nodeId))
        .filter(n => n && !visited.has(n.id)) as BaseNode[];
      
      // 按端口编号排序（确保输出顺序一致）
      nextNodes.sort((a, b) => {
        const connA = outgoingConnections.find(c => c.to.nodeId === a.id);
        const connB = outgoingConnections.find(c => c.to.nodeId === b.id);
        const portA = connA?.from.portNumber || 0;
        const portB = connB?.from.portNumber || 0;
        return portA - portB;
      });
      
      // 递归访问后续节点
      nextNodes.forEach(visit);
      visiting.delete(node.id);
    };
    
    visit(startNode);
    
    // 添加任何未访问的节点（孤立节点）
    const unvisited = this.nodes.filter(node => !visited.has(node.id));
    unvisited.sort((a, b) => {
      const numberA = (a as any).nodeNumber || 0;
      const numberB = (b as any).nodeNumber || 0;
      return numberA - numberB;
    });
    result.push(...unvisited);
    
    console.log('Topological sort result:', result.map(n => n.title));
    return result;
  }

  // 测试函数：验证工作流执行
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
      
      this.connections.forEach((conn, index) => {
        const fromNode = this.nodes.find(n => n.id === conn.from.nodeId);
        const toNode = this.nodes.find(n => n.id === conn.to.nodeId);
        console.log(`Connection ${index + 1}: ${fromNode?.title || 'Unknown'} → ${toNode?.title || 'Unknown'}`);
      });
      
      if (this.connections.length < 6) {
        console.warn('Warning: Expected at least 6 connections for complete workflow');
      }
      
      // 3. 执行工作流测试
      console.log('3. Starting workflow execution...');
      await this.runTestWorkflow();
      
      console.log('=== Workflow Test Completed Successfully ===');
      
    } catch (error) {
      console.error('=== Workflow Test Failed ===');
      console.error('Error:', error);
      throw error;
    }
  }
  
  private async runTestWorkflow(): Promise<void> {
    // 重置所有节点状态
    this.nodes.forEach(node => {
      node.executionState = 'idle';
    });
    
    // 查找开始节点
    const startNode = this.nodes.find(node => node.type === 'Start');
    if (!startNode) {
      throw new Error('No start node found');
    }
    
    console.log('Starting execution from Start node...');
    
    // 创建测试数据收集器
    const executionLog: Array<{
      node: string;
      input: any;
      output: any;
      timestamp: string;
    }> = [];
    
    // 存储节点的输入数据（用于多输入节点）
    const nodeInputs: Map<string, { [portId: string]: any }> = new Map();
    
    const executeNode = async (node: BaseNode, portId: string, inputData: any): Promise<void> => {
      console.log(`\n--- Preparing: ${node.title} (${node.type}) ---`);
      
      // 为多输入节点收集所有输入
      if (!nodeInputs.has(node.id)) {
        nodeInputs.set(node.id, {});
      }
      
      const inputs = nodeInputs.get(node.id)!;
      inputs[portId] = inputData;
      
      console.log(`Received input for port ${portId}:`, JSON.stringify(inputData, null, 2));
      
      // 检查是否所有必需的输入都已到达
      const expectedInputs = node.inputs.length;
      const receivedInputs = Object.keys(inputs).length;
      
      console.log(`Node ${node.title}: ${receivedInputs}/${expectedInputs} inputs received`);
      
      if (receivedInputs < expectedInputs) {
        console.log(`Waiting for more inputs for ${node.title}...`);
        return; // 等待更多输入
      }
      
      // 所有输入都已到达，执行节点
      console.log(`\n--- Executing: ${node.title} (${node.type}) ---`);
      console.log('All inputs:', JSON.stringify(inputs, null, 2));
      
      try {
        node.executionState = 'running';
        this.render();
        
        // 对于单输入节点，直接传递数据；对于多输入节点，传递输入对象
        const nodeInput = expectedInputs === 1 ? Object.values(inputs)[0] : inputs;
        const outputs = await node.execute(nodeInput);
        
        node.executionState = 'completed';
        this.render();
        
        console.log('Output data:', JSON.stringify(outputs, null, 2));
        
        // 记录执行日志
        executionLog.push({
          node: `${node.title} (${node.type})`,
          input: nodeInput,
          output: outputs,
          timestamp: new Date().toISOString()
        });
        
        // 继续执行后续节点
        for (const outputPortId in outputs) {
          const outputData = outputs[outputPortId];
          const outgoingConnections = this.connections.filter(conn => 
            conn.from.nodeId === node.id && conn.from.id === outputPortId
          );
          
          for (const connection of outgoingConnections) {
            const nextNode = this.nodes.find(n => n.id === connection.to.nodeId);
            if (nextNode) {
              await new Promise(resolve => setTimeout(resolve, 500)); // 短暂延迟用于可视化
              await executeNode(nextNode, connection.to.id, outputData);
            }
          }
        }
        
      } catch (error) {
        console.error(`Error in ${node.title}:`, error);
        node.executionState = 'failed';
        this.render();
        throw error;
      }
    };
    
    // 开始执行 - 查找所有从Start节点连出的连接
    const startOutputs = await startNode.execute({ payload: {}, errors: [] });
    startNode.executionState = 'completed';
    
    executionLog.push({
      node: `${startNode.title} (${startNode.type})`,
      input: { payload: {}, errors: [] },
      output: startOutputs,
      timestamp: new Date().toISOString()
    });
    
    console.log('Start node output:', JSON.stringify(startOutputs, null, 2));
    
    // 触发所有从Start节点连出的连接
    for (const outputPortId in startOutputs) {
      const outputData = startOutputs[outputPortId];
      const outgoingConnections = this.connections.filter(conn => 
        conn.from.nodeId === startNode.id && conn.from.id === outputPortId
      );
      
      for (const connection of outgoingConnections) {
        const nextNode = this.nodes.find(n => n.id === connection.to.nodeId);
        if (nextNode) {
          await executeNode(nextNode, connection.to.id, outputData);
        }
      }
    }
    
    // 输出执行总结
    console.log('\n=== Execution Summary ===');
    executionLog.forEach((log, index) => {
      console.log(`${index + 1}. ${log.node} executed at ${log.timestamp}`);
    });
    
    // 验证最终结果
    const endNode = this.nodes.find(n => n.type === 'End');
    if (endNode && endNode.executionState === 'completed') {
      console.log('✅ Workflow completed successfully - End node reached');
    } else {
      console.warn('⚠️  Workflow may not have completed properly - End node not reached');
    }
    
    // 验证数据流
    this.validateDataFlow(executionLog);
  }
  
  private validateDataFlow(executionLog: Array<{node: string, input: any, output: any, timestamp: string}>): void {
    console.log('\n=== Data Flow Validation ===');
    
    try {
      // 检查Start节点输出
      const startExecution = executionLog.find(log => log.node.includes('Start'));
      if (startExecution && startExecution.output.out) {
        console.log('✅ Start node produced output');
        console.log('Start data sample:', JSON.stringify(startExecution.output.out.payload, null, 2).substring(0, 200) + '...');
      }
      
      // 检查ContentGenerator节点
      const generatorExecutions = executionLog.filter(log => log.node.includes('ContentGenerator'));
      if (generatorExecutions.length >= 2) {
        console.log(`✅ Found ${generatorExecutions.length} ContentGenerator executions`);
        
        generatorExecutions.forEach((gen, index) => {
          if (gen.output.output) {
            console.log(`Generator ${index + 1} output keys:`, Object.keys(gen.output.output.payload || {}));
          }
        });
      } else {
        console.warn('⚠️  Expected 2 ContentGenerator executions, found:', generatorExecutions.length);
      }
      
      // 检查JsonMerger节点
      const mergerExecution = executionLog.find(log => log.node.includes('JsonMerger'));
      if (mergerExecution && mergerExecution.output.output) {
        console.log('✅ JsonMerger produced merged output');
        const mergedKeys = Object.keys(mergerExecution.output.output.payload || {});
        console.log('Merged data keys:', mergedKeys);
      } else {
        console.warn('⚠️  JsonMerger did not produce expected output');
      }
      
      // 检查JsonFilter节点
      const filterExecution = executionLog.find(log => log.node.includes('JsonFilter'));
      if (filterExecution && filterExecution.output.output) {
        console.log('✅ JsonFilter produced filtered output');
        const filteredKeys = Object.keys(filterExecution.output.output.payload || {});
        console.log('Filtered data keys:', filteredKeys);
      } else {
        console.warn('⚠️  JsonFilter did not produce expected output');
      }
      
      // 检查Display节点
      const displayExecution = executionLog.find(log => log.node.includes('Display'));
      if (displayExecution) {
        console.log('✅ Display node executed');
      }
      
      console.log('=== Data Flow Validation Complete ===');
      
    } catch (error) {
      console.error('Data flow validation error:', error);
    }
  }
}
