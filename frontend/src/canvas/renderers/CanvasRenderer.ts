/**
 * Canvas Renderer - 画布渲染功能
 * 职责：网格绘制、连接线绘制、临时连接绘制
 */
import { BaseNode } from '../../nodes/BaseNode';
import { NodeRenderer } from '../NodeRenderer';
import { Connection, InteractionState } from '../types/CanvasTypes';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodeRenderer: NodeRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.nodeRenderer = new NodeRenderer();
  }

  public render(
    nodes: BaseNode[], 
    connections: Connection[], 
    interactionState: InteractionState
  ): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.drawConnections(connections, interactionState);
    this.drawNodes(nodes, interactionState.selectedNode);
    this.drawTempConnection(interactionState);
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

  private drawConnections(connections: Connection[], interactionState: InteractionState): void {
    connections.forEach(conn => {
      const isHovered = interactionState.hoveredConnection === conn;
      const isSelected = interactionState.selectedConnection === conn;
      
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

  private drawNodes(nodes: BaseNode[], selectedNode: BaseNode | null): void {
    nodes.forEach(node => 
      this.nodeRenderer.draw(this.ctx, node, node === selectedNode)
    );
  }

  private drawTempConnection(interactionState: InteractionState): void {
    if (interactionState.isDrawingConnection && interactionState.connectionStartPort) {
      this.ctx.strokeStyle = '#999';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(
        interactionState.connectionStartPort.position.x, 
        interactionState.connectionStartPort.position.y
      );
      this.ctx.lineTo(
        interactionState.tempConnectionEnd.x, 
        interactionState.tempConnectionEnd.y
      );
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  public resizeCanvas(): void {
    this.canvas.width = this.canvas.parentElement!.clientWidth;
    this.canvas.height = this.canvas.parentElement!.clientHeight;
  }
}