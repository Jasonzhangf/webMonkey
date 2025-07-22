/**
 * Base Node - 基础节点
 * The base class for all nodes in the canvas editor
 */

export interface NodePosition {
  x: number;
  y: number;
}

export interface Port {
  id: string;
  nodeId: string;
  position: NodePosition;
  isInput: boolean;
  portNumber?: number; // 端口编号，用于执行顺序控制
}

export interface NodeConfig {
  position: NodePosition;
  title: string;
}

export interface WorkflowData {
  payload: any;
  errors: string[];
}

export type NodeExecutionState = 'idle' | 'running' | 'completed' | 'failed';

export abstract class BaseNode {
  public id: string;
  public type: string;
  private _position: NodePosition;
  public width: number = 180;
  public height: number = 80;
  public title: string; // 显示名称
  public nodeName: string; // 节点唯一名称（用于变量访问）
  public description: string = ''; // 节点描述
  public inputs: Port[] = [];
  public outputs: Port[] = [];
  public executionState: NodeExecutionState = 'idle';
  public variables: { [key: string]: any } = {}; // 节点变量存储

  public get position(): NodePosition {
    return this._position;
  }

  public set position(newPosition: NodePosition) {
    this._position = newPosition;
    this.updatePortPositions();
  }

  public properties: Record<string, any> = {};

  constructor(position: NodePosition, title: string) {
    this.id = crypto.randomUUID();
    this.type = this.constructor.name.replace(/Node$/, '');
    this._position = position;
    this.title = title;
    this.nodeName = title.toLowerCase().replace(/\s+/g, '_'); // 默认节点名称
  }

  public abstract execute(input: WorkflowData): Promise<{ [portId: string]: WorkflowData }>;
  
  public isInside(x: number, y: number): boolean {
    return x >= this.position.x && x <= this.position.x + this.width &&
           y >= this.position.y && y <= this.position.y + this.height;
  }


  protected updatePortPositions(): void {
    this.inputs.forEach((port, index) => {
      port.position = {
        x: this.position.x,
        y: this.position.y + (this.height / (this.inputs.length + 1)) * (index + 1)
      };
      port.nodeId = this.id;
    });

    this.outputs.forEach((port, index) => {
      port.position = {
        x: this.position.x + this.width,
        y: this.position.y + (this.height / (this.outputs.length + 1)) * (index + 1)
      };
      port.nodeId = this.id;
    });
  }


  public getPortAt(x: number, y: number): Port | null {
    // 增大端口检测半径，使连接更容易
    const detectionRadius = 15; // 从5增加到15像素
    
    for (const port of [...this.inputs, ...this.outputs]) {
      const dist = Math.sqrt(Math.pow(x - port.position.x, 2) + Math.pow(y - port.position.y, 2));
      if (dist <= detectionRadius) {
        return port;
      }
    }
    return null;
  }
}

export type NodeClass = new (position: NodePosition) => BaseNode;
