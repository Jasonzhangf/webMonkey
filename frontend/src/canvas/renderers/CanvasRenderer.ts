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
  private zoomLevel: number = 1.0;
  private panX: number = 0;
  private panY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.nodeRenderer = new NodeRenderer();
  }

  public render(
    nodes: BaseNode[], 
    connections: Connection[], 
    interactionState: InteractionState,
    zoomLevel?: number,
    panX?: number,
    panY?: number
  ): void {
    // 更新缩放和平移参数
    if (zoomLevel !== undefined) this.zoomLevel = zoomLevel;
    if (panX !== undefined) this.panX = panX;
    if (panY !== undefined) this.panY = panY;
    
    // 保存当前的变换状态
    this.ctx.save();
    
    // 清除整个canvas（在变换之前）
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 应用缩放和平移变换
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);
    
    // 绘制内容
    this.drawGrid();
    this.drawConnections(connections, interactionState);
    this.drawNodes(nodes, interactionState.selectedNode);
    this.drawTempConnection(interactionState);
    
    // 恢复变换状态
    this.ctx.restore();
  }

  private drawGrid(): void {
    const gridSize = 20;
    const largeGridSize = gridSize * 5;
    
    // 计算可见区域的范围
    const visibleLeft = -this.panX / this.zoomLevel;
    const visibleTop = -this.panY / this.zoomLevel;
    const visibleRight = visibleLeft + this.canvas.width / this.zoomLevel;
    const visibleBottom = visibleTop + this.canvas.height / this.zoomLevel;
    
    // 计算网格线的起始和结束位置
    const startX = Math.floor(visibleLeft / gridSize) * gridSize;
    const endX = Math.ceil(visibleRight / gridSize) * gridSize;
    const startY = Math.floor(visibleTop / gridSize) * gridSize;
    const endY = Math.ceil(visibleBottom / gridSize) * gridSize;

    // Draw small grid
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 0.5 / this.zoomLevel; // 调整线宽以适应缩放
    
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, visibleTop);
      this.ctx.lineTo(x, visibleBottom);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(visibleLeft, y);
      this.ctx.lineTo(visibleRight, y);
      this.ctx.stroke();
    }

    // Draw large grid
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 1 / this.zoomLevel; // 调整线宽以适应缩放
    
    const largeStartX = Math.floor(visibleLeft / largeGridSize) * largeGridSize;
    const largeEndX = Math.ceil(visibleRight / largeGridSize) * largeGridSize;
    const largeStartY = Math.floor(visibleTop / largeGridSize) * largeGridSize;
    const largeEndY = Math.ceil(visibleBottom / largeGridSize) * largeGridSize;
    
    for (let x = largeStartX; x <= largeEndX; x += largeGridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, visibleTop);
      this.ctx.lineTo(x, visibleBottom);
      this.ctx.stroke();
    }

    for (let y = largeStartY; y <= largeEndY; y += largeGridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(visibleLeft, y);
      this.ctx.lineTo(visibleRight, y);
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