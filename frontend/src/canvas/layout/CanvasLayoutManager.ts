/**
 * Canvas Layout Manager - 画布自动布局管理器
 * 职责：自动排版、节点位置计算、层级布局
 */
import { BaseNode } from '../../nodes/BaseNode';
import { Connection, LayoutConfig } from '../types/CanvasTypes';

export class CanvasLayoutManager {
  private canvas: HTMLCanvasElement;
  private layoutConfig: LayoutConfig = {
    startX: 320, // 避开左侧工具栏（240px + 80px边距）
    baseY: 150, // 基础垂直位置
    horizontalSpacing: 220, // 层级间水平间距
    verticalSpacing: 100, // 并列节点间垂直间距
    layerPadding: 50 // 层级内部的额外间距
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public autoLayoutNodes(nodes: BaseNode[], connections: Connection[]): void {
    console.log('Starting auto layout...');
    
    if (nodes.length === 0) {
      console.log('No nodes to layout');
      return;
    }
    
    // 获取层级化的节点布局
    const layers = this.getLayeredLayout(nodes, connections);
    
    console.log('Layered layout:', layers.map((layer, i) => 
      `Layer ${i}: [${layer.map(n => n.title).join(', ')}]`
    ));
    
    // 按层级布局节点
    layers.forEach((layer, layerIndex) => {
      const layerX = this.layoutConfig.startX + layerIndex * this.layoutConfig.horizontalSpacing;
      const nodesInLayer = layer.length;
      
      // 计算层级内节点的垂直分布
      if (nodesInLayer === 1) {
        // 单个节点：居中放置
        layer[0].position = { x: layerX, y: this.layoutConfig.baseY };
        console.log(`Layer ${layerIndex} - Single node: ${layer[0].title} at (${layerX}, ${this.layoutConfig.baseY})`);
      } else {
        // 多个节点：垂直分布
        const totalHeight = (nodesInLayer - 1) * this.layoutConfig.verticalSpacing;
        const startY = this.layoutConfig.baseY - totalHeight / 2;
        
        layer.forEach((node, nodeIndex) => {
          const nodeY = startY + nodeIndex * this.layoutConfig.verticalSpacing;
          node.position = { x: layerX, y: nodeY };
          console.log(`Layer ${layerIndex} - Node ${nodeIndex}: ${node.title} at (${layerX}, ${nodeY})`);
        });
      }
    });
    
    console.log('Auto layout completed!');
  }

  public findAvailablePosition(
    preferredX: number, 
    preferredY: number, 
    existingNodes: BaseNode[]
  ): { x: number, y: number } {
    const nodeWidth = 180;
    const nodeHeight = 80;
    const spacing = 20;
    
    let testX = preferredX;
    let testY = preferredY;
    
    // Check if position overlaps with existing nodes
    while (this.positionOverlapsWithNodes(testX, testY, nodeWidth, nodeHeight, existingNodes)) {
      testX += nodeWidth + spacing;
      // If we've moved too far right, wrap to next row
      if (testX > this.canvas.width - nodeWidth) {
        testX = 100;
        testY += nodeHeight + spacing;
      }
    }
    
    return { x: testX, y: testY };
  }

  private positionOverlapsWithNodes(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    existingNodes: BaseNode[]
  ): boolean {
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

  private getLayeredLayout(nodes: BaseNode[], connections: Connection[]): BaseNode[][] {
    // 寻找起始节点
    const startNode = nodes.find(node => node.type === 'Start');
    if (!startNode) {
      console.log('No start node found, using fallback layering');
      return this.getFallbackLayering(nodes);
    }
    
    console.log('Creating layered layout from Start node');
    return this.createWorkflowLayers(startNode, nodes, connections);
  }

  private createWorkflowLayers(
    startNode: BaseNode, 
    nodes: BaseNode[], 
    connections: Connection[]
  ): BaseNode[][] {
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
      const outgoingConnections = connections.filter(conn => conn.from.nodeId === node.id);
      const nextNodes = outgoingConnections
        .map(conn => nodes.find(n => n.id === conn.to.nodeId))
        .filter(n => n && !visited.has(n.id)) as BaseNode[];
      
      // 将下级节点加入队列（下一层）
      nextNodes.forEach(nextNode => {
        queue.push({ node: nextNode, layer: layer + 1 });
      });
    }
    
    // 处理任何未访问的孤立节点
    const unvisited = nodes.filter(node => !visited.has(node.id));
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

  private getFallbackLayering(nodes: BaseNode[]): BaseNode[][] {
    // 备选方案：按节点编号分层
    const sortedNodes = [...nodes].sort((a, b) => {
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
}