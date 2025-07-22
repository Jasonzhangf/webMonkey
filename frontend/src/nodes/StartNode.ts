/**
 * Start Node
 */
import { BaseNode, NodePosition, WorkflowData } from './BaseNode';

export class StartNode extends BaseNode {
  constructor(position: NodePosition) {
    super(position, 'Start');
    this.outputs.push({ id: 'out', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false, portNumber: 1 });
    this.updatePortPositions();
  }

  public async execute(_input: WorkflowData): Promise<{ [portId: string]: WorkflowData; }> {
    console.log('Workflow started.');
    
    // 如果没有设置初始数据，提供一些测试JSON数据
    let initialPayload = this.properties.initialPayload;
    if (!initialPayload || Object.keys(initialPayload).length === 0) {
      initialPayload = {
        user: {
          id: 12345,
          name: "张三",
          email: "zhangsan@example.com",
          profile: {
            age: 28,
            location: "北京",
            preferences: {
              theme: "dark",
              language: "zh-CN",
              notifications: true
            }
          }
        },
        data: [
          { id: 1, title: "任务1", completed: false, tags: ["重要", "紧急"] },
          { id: 2, title: "任务2", completed: true, tags: ["日常"] },
          { id: 3, title: "任务3", completed: false, tags: ["项目", "开发"] }
        ],
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          source: "web-automation-orchestrator",
          stats: {
            totalTasks: 3,
            completedTasks: 1,
            successRate: 0.33
          }
        }
      };
    }
    
    const initialData: WorkflowData = {
      payload: initialPayload,
      errors: []
    };
    return { 'out': initialData };
  }
}
