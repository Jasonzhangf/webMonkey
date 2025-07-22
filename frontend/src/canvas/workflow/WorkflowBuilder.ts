/**
 * Workflow Builder - 默认工作流构建器
 * 职责：创建默认测试工作流、设置节点连接
 */
import { BaseNode } from '../../nodes/BaseNode';
import { Connection } from '../types/CanvasTypes';
import { editorState } from '../../state/EditorState';

export interface NodeAdditionCallback {
  (nodeType: string, position?: { x: number, y: number }): BaseNode | null;
}

export class WorkflowBuilder {
  private addNodeCallback: NodeAdditionCallback;

  constructor(addNodeCallback: NodeAdditionCallback) {
    this.addNodeCallback = addNodeCallback;
  }

  public async createDefaultTestWorkflow(): Promise<void> {
    console.log('Creating default test workflow...');
    
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

    const createdNodes = this.createAllNodes(positions);
    
    // 验证所有节点都创建成功
    console.log('All nodes created:', Object.keys(createdNodes).map(key => 
      createdNodes[key] ? `${key}: ✅` : `${key}: ❌`
    ));

    // 等待所有节点完全初始化
    await this.waitForNodesReady(createdNodes);
    
    // 创建连接
    this.createDefaultConnections();
  }

  private async waitForNodesReady(nodeRefs: any): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 40; // 最多等待2秒 (40 * 50ms)
      
      const checkReady = () => {
        attempts++;
        const currentState = editorState.getState();
        
        console.log(`Node readiness check attempt ${attempts}/${maxAttempts}`);
        console.log(`Current nodes in state: ${currentState.nodes.length}`);
        
        const allNodesReady = Object.values(nodeRefs).every(node => {
          if (!node) return false;
          
          const stateNode = currentState.nodes.find(n => n.id === node.id);
          if (!stateNode) {
            console.log(`Node ${node.title} not found in state`);
            return false;
          }
          
          // 检查端口是否已正确初始化
          const inputsReady = stateNode.inputs.every(port => port.nodeId === node.id);
          const outputsReady = stateNode.outputs.every(port => port.nodeId === node.id);
          
          if (!inputsReady || !outputsReady) {
            console.log(`Node ${node.title} ports not ready: inputs=${inputsReady}, outputs=${outputsReady}`);
            return false;
          }
          
          return true;
        });
        
        if (allNodesReady) {
          console.log('✅ All nodes are ready for connection creation');
          resolve();
        } else if (attempts >= maxAttempts) {
          console.warn('⚠️ Timeout waiting for nodes to be ready, proceeding anyway');
          resolve();
        } else {
          setTimeout(checkReady, 50);
        }
      };
      
      checkReady();
    });
  }

  private createAllNodes(positions: any): any {
    // 1. Start节点 (包含基础配置数据)
    const startNode = this.addNodeCallback('Start', positions.start);
    console.log('Created Start node:', startNode);
    
    // 1.1 Start数据显示节点
    const startDisplayNode = this.addNodeCallback('Display', positions.startDisplay);
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
    const contentGen1Node = this.addNodeCallback('ContentGenerator', positions.contentGen1);
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
    const gen1DisplayNode = this.addNodeCallback('Display', positions.gen1Display);
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
    const contentGen2Node = this.addNodeCallback('ContentGenerator', positions.contentGen2);
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
    const gen2DisplayNode = this.addNodeCallback('Display', positions.gen2Display);
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
    const mergerNode = this.addNodeCallback('JsonMerger', positions.merger);
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
    const mergerDisplayNode = this.addNodeCallback('Display', positions.mergerDisplay);
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
    const filterNode = this.addNodeCallback('JsonFilter', positions.filter);
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
    const filterDisplayNode = this.addNodeCallback('Display', positions.filterDisplay);
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
    const finalDisplayNode = this.addNodeCallback('Display', positions.finalDisplay);
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
    const endNode = this.addNodeCallback('End', positions.end);
    console.log('Created End node:', endNode);

    return {
      startNode, startDisplayNode, 
      contentGen1Node, gen1DisplayNode,
      contentGen2Node, gen2DisplayNode, 
      mergerNode, mergerDisplayNode,
      filterNode, filterDisplayNode,
      finalDisplayNode, endNode
    };
  }

  private createDefaultConnections(): void {
    const currentState = editorState.getState();
    const nodes = currentState.nodes;

    console.log('=== Connection Creation Debug ===');
    console.log(`Total nodes in state: ${nodes.length}`);
    
    // 详细节点诊断
    const diagnostics = {
      startNodes: nodes.filter(n => n.type === 'Start').length,
      contentGenNodes: nodes.filter(n => n.type === 'ContentGenerator').length,
      displayNodes: nodes.filter(n => n.type === 'Display').length,
      mergerNodes: nodes.filter(n => n.type === 'JsonMerger').length,
      filterNodes: nodes.filter(n => n.type === 'JsonFilter').length,
      endNodes: nodes.filter(n => n.type === 'End').length
    };
    
    console.table(diagnostics);

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

    // 检查Display节点的详细信息
    console.log('=== Display Node Diagnostics ===');
    displayNodes.forEach(node => {
      console.log(`Display Node: ${node.title}`);
      console.log(`  - ID: ${node.id}`);
      console.log(`  - Position: (${node.position.x}, ${node.position.y})`);
      console.log(`  - Inputs: ${node.inputs.length} (${node.inputs.map(p => `${p.id}:${p.nodeId === node.id ? '✅' : '❌'}`).join(', ')})`);
      console.log(`  - Outputs: ${node.outputs.length} (${node.outputs.map(p => `${p.id}:${p.nodeId === node.id ? '✅' : '❌'}`).join(', ')})`);
    });

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

    const connections = this.createAllConnections({
      startNode, userDataGen, productDataGen, mergerNode, filterNode, endNode,
      startDisplayNode, gen1DisplayNode, gen2DisplayNode, 
      mergerDisplayNode, filterDisplayNode, finalDisplayNode
    });

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
  }

  private createAllConnections(nodeRefs: any): Connection[] {
    const connections: Connection[] = [];
    let connectionId = Date.now();

    try {
      // 主要数据流连接
      this.addMainDataFlowConnections(nodeRefs, connections, connectionId);
      
      // 数据监控连接 - 为每个处理节点添加Display节点
      this.addDataMonitoringConnections(nodeRefs, connections, connectionId);
      
    } catch (error) {
      console.error('Error creating default connections:', error);
    }

    return connections;
  }

  private addMainDataFlowConnections(nodeRefs: any, connections: Connection[], connectionId: number): void {
    const { startNode, userDataGen, productDataGen, mergerNode, filterNode, finalDisplayNode, endNode } = nodeRefs;

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
  }

  private addDataMonitoringConnections(nodeRefs: any, connections: Connection[], connectionId: number): void {
    const { 
      startNode, userDataGen, productDataGen, mergerNode, filterNode,
      startDisplayNode, gen1DisplayNode, gen2DisplayNode, 
      mergerDisplayNode, filterDisplayNode
    } = nodeRefs;

    console.log('=== Data Monitoring Connections ===');

    const monitoringPairs = [
      { source: startNode, target: startDisplayNode, name: 'Start -> Start Display' },
      { source: userDataGen, target: gen1DisplayNode, name: 'UserGen -> UserGen Display' },
      { source: productDataGen, target: gen2DisplayNode, name: 'ProductGen -> ProductGen Display' },
      { source: mergerNode, target: mergerDisplayNode, name: 'Merger -> Merger Display' },
      { source: filterNode, target: filterDisplayNode, name: 'Filter -> Filter Display' }
    ];

    monitoringPairs.forEach(({ source, target, name }, index) => {
      console.log(`\n--- Creating ${name} ---`);
      
      if (this.validateNodeConnection(source, target)) {
        const connection = this.createSafeConnection(
          source.outputs[0], 
          target.inputs[0], 
          connectionId + index
        );
        if (connection) {
          connections.push(connection);
          console.log(`✅ Created monitoring connection: ${source.title} -> ${target.title}`);
        } else {
          console.error(`❌ Failed to create safe connection: ${source.title} -> ${target.title}`);
        }
      } else {
        console.error(`❌ Node validation failed: ${source?.title || 'undefined'} -> ${target?.title || 'undefined'}`);
      }
    });
  }

  private validateNodeConnection(sourceNode: any, targetNode: any): boolean {
    if (!sourceNode || !targetNode) {
      console.warn('Source or target node is missing:', {
        source: !!sourceNode,
        target: !!targetNode
      });
      return false;
    }
    
    if (!sourceNode.outputs || sourceNode.outputs.length === 0) {
      console.warn(`Source node ${sourceNode.title} has no outputs:`, sourceNode.outputs);
      return false;
    }
    
    if (!targetNode.inputs || targetNode.inputs.length === 0) {
      console.warn(`Target node ${targetNode.title} has no inputs:`, targetNode.inputs);
      return false;
    }
    
    // 验证端口nodeId一致性
    const sourcePort = sourceNode.outputs[0];
    const targetPort = targetNode.inputs[0];
    
    if (!sourcePort || !targetPort) {
      console.warn('Source or target port is missing:', {
        sourcePort: !!sourcePort,
        targetPort: !!targetPort
      });
      return false;
    }
    
    if (sourcePort.nodeId !== sourceNode.id) {
      console.warn(`Source port nodeId mismatch: ${sourcePort.nodeId} !== ${sourceNode.id}`);
      return false;
    }
    
    if (targetPort.nodeId !== targetNode.id) {
      console.warn(`Target port nodeId mismatch: ${targetPort.nodeId} !== ${targetNode.id}`);
      return false;
    }
    
    console.log(`✅ Node connection validation passed: ${sourceNode.title} -> ${targetNode.title}`);
    return true;
  }

  private createSafeConnection(fromPort: any, toPort: any, id: number): Connection | null {
    if (!fromPort || !toPort) {
      console.warn('Cannot create connection - missing ports:', {
        fromPort: !!fromPort,
        toPort: !!toPort
      });
      return null;
    }
    
    console.log(`Creating connection: ${fromPort.id} -> ${toPort.id}`);
    
    return {
      id: `conn_${id}`,
      from: fromPort,
      to: toPort
    };
  }
}