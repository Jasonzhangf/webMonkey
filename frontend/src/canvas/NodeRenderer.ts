import { BaseNode } from '../nodes/BaseNode';

export class NodeRenderer {
  private readonly BORDER_RADIUS = 8;
  private readonly PORT_SIZE = 6;
  private readonly PORT_LABEL_OFFSET = 15;

  public draw(ctx: CanvasRenderingContext2D, node: BaseNode, isSelected: boolean = false): void {
    this.drawNodeBox(ctx, node, isSelected);
    this.drawNodeTitle(ctx, node);
    this.drawPorts(ctx, node);
    this.drawPortLabels(ctx, node);
    
    // 调用节点的自定义渲染方法（如果有的话）
    if (typeof (node as any).renderCustomContent === 'function') {
      (node as any).renderCustomContent(ctx, node.position.x, node.position.y, node.width, node.height);
    }
  }

  private getNodeColor(node: BaseNode): { bg: string, border: string, text: string } {
    const colors = {
      running: { bg: '#4a4a4a', border: '#ffd700', text: '#ffffff' },
      completed: { bg: '#2d4a2d', border: '#4CAF50', text: '#ffffff' },
      failed: { bg: '#4a2d2d', border: '#f44336', text: '#ffffff' }
    };

    if (node.executionState !== 'idle') {
      return colors[node.executionState] || colors.running;
    }

    switch (node.type) {
      case 'Start':
        return { bg: '#2d4a2d', border: '#4CAF50', text: '#ffffff' };
      case 'End':
        return { bg: '#4a2d2d', border: '#f44336', text: '#ffffff' };
      case 'Action':
        return { bg: '#2d3a4a', border: '#2196F3', text: '#ffffff' };
      case 'Conditional':
        return { bg: '#4a3d2d', border: '#FFC107', text: '#ffffff' };
      case 'Loop':
        return { bg: '#3d2d4a', border: '#9C27B0', text: '#ffffff' };
      case 'Display':
        return { bg: '#3d2a4a', border: '#9C27B0', text: '#ffffff' };
      case 'ContentGenerator':
        return { bg: '#2d4a3d', border: '#4CAF50', text: '#ffffff' };
      case 'JsonMerger':
        return { bg: '#4a3d2d', border: '#FF9800', text: '#ffffff' };
      case 'JsonFilter':
        return { bg: '#2d3d4a', border: '#03A9F4', text: '#ffffff' };
      default:
        return { bg: '#3a3a3a', border: '#666666', text: '#ffffff' };
    }
  }

  private drawNodeBox(ctx: CanvasRenderingContext2D, node: BaseNode, isSelected: boolean = false): void {
    const colors = this.getNodeColor(node);
    const x = node.position.x;
    const y = node.position.y;
    const w = node.width;
    const h = node.height;
    const r = this.BORDER_RADIUS;

    // Draw rounded rectangle background
    ctx.fillStyle = colors.bg;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = isSelected ? '#FFC107' : colors.border;
    ctx.lineWidth = isSelected ? 4 : (node.executionState === 'running' ? 3 : 2);
    ctx.stroke();

    // Draw selection highlight
    if (isSelected) {
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const highlightOffset = 4;
      ctx.beginPath();
      ctx.moveTo(x + r - highlightOffset, y - highlightOffset);
      ctx.arcTo(x + w + highlightOffset, y - highlightOffset, x + w + highlightOffset, y + h + highlightOffset, r);
      ctx.arcTo(x + w + highlightOffset, y + h + highlightOffset, x - highlightOffset, y + h + highlightOffset, r);
      ctx.arcTo(x - highlightOffset, y + h + highlightOffset, x - highlightOffset, y - highlightOffset, r);
      ctx.arcTo(x - highlightOffset, y - highlightOffset, x + w + highlightOffset, y - highlightOffset, r);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw header background (darker)
    const headerHeight = 25;
    ctx.fillStyle = this.darkenColor(colors.bg, 0.2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + headerHeight, r);
    ctx.lineTo(x + w, y + headerHeight);
    ctx.lineTo(x, y + headerHeight);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  private drawNodeTitle(ctx: CanvasRenderingContext2D, node: BaseNode): void {
    const colors = this.getNodeColor(node);
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.title, node.position.x + node.width / 2, node.position.y + 15);
  }

  private darkenColor(color: string, factor: number): string {
    // Simple color darkening - convert hex to rgb, darken, and convert back
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor)));
    const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor)));
    const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  public drawPorts(ctx: CanvasRenderingContext2D, node: BaseNode): void {
    // Draw input ports (left side, circles)
    node.inputs.forEach(port => {
      ctx.fillStyle = '#4CAF50';
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(port.position.x, port.position.y, this.PORT_SIZE, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

    // Draw output ports (right side, squares)  
    node.outputs.forEach(port => {
      const size = this.PORT_SIZE;
      ctx.fillStyle = '#2196F3';
      ctx.strokeStyle = '#1565C0';
      ctx.lineWidth = 2;
      ctx.fillRect(port.position.x - size, port.position.y - size, size * 2, size * 2);
      ctx.strokeRect(port.position.x - size, port.position.y - size, size * 2, size * 2);
    });
  }
  
  private drawPortLabels(ctx: CanvasRenderingContext2D, node: BaseNode): void {
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.textBaseline = 'middle';

    // Draw input labels (left side)
    node.inputs.forEach(port => {
      ctx.textAlign = 'left';
      ctx.fillText(port.id, port.position.x + this.PORT_LABEL_OFFSET, port.position.y);
    });

    // Draw output labels (right side)
    node.outputs.forEach(port => {
      ctx.textAlign = 'right';
      ctx.fillText(port.id, port.position.x - this.PORT_LABEL_OFFSET, port.position.y);
    });
  }
}
