/**
 * Canvas Types - 画布编辑器相关类型定义
 */
import { BaseNode, Port } from '../../nodes/BaseNode';

export interface Connection {
  id: string;
  from: Port;
  to: Port;
}

export interface InteractionState {
  isDragging: boolean;
  draggedNode: BaseNode | null;
  dragOffset: { x: number, y: number };
  isDrawingConnection: boolean;
  connectionStartPort: Port | null;
  tempConnectionEnd: { x: number, y: number };
  hoveredConnection: Connection | null;
  selectedNode: BaseNode | null;
  selectedConnection: Connection | null;
  clipboard: BaseNode | null;
}

export interface WorkflowExecutionLog {
  node: string;
  input: any;
  output: any;
  timestamp: string;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface LayoutConfig {
  startX: number;
  baseY: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  layerPadding: number;
}