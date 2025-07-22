/**
 * JSON Merger Node - JSON合并节点
 * 将多个JSON输入合并为一个JSON输出
 */

import { BaseNode, NodePosition } from './BaseNode';

export type MergeStrategy = 'merge' | 'replace' | 'append' | 'custom';

export class JsonMergerNode extends BaseNode {
  constructor(position: NodePosition) {
    super(position, 'JsonMerger');
    this.title = 'JSON Merger';
    
    // 添加多个输入端口
    this.inputs.push(
      { id: 'input1', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true },
      { id: 'input2', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true }
    );
    
    // 添加输出端口
    this.outputs.push({ id: 'output', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false });
    
    // 设置默认属性
    this.properties = {
      mergeStrategy: 'merge',
      mergeKey: 'merged',
      preserveArrays: true,
      deepMerge: true,
      conflictResolution: 'input2-wins', // input1-wins, input2-wins, combine
      customMergeRules: {},
      ...this.properties
    };
    
    this.updatePortPositions();
  }

  public async execute(inputs: { [portId: string]: any }): Promise<{ [portId: string]: any }> {
    console.log('JsonMergerNode executing with inputs:', inputs);
    
    const input1 = inputs['input1']?.payload || {};
    const input2 = inputs['input2']?.payload || {};
    
    let mergedData: any;
    
    try {
      switch (this.properties.mergeStrategy) {
        case 'merge':
          mergedData = this.deepMergeObjects(input1, input2);
          break;
        case 'replace':
          mergedData = { ...input1, ...input2 };
          break;
        case 'append':
          mergedData = this.appendData(input1, input2);
          break;
        case 'custom':
          mergedData = this.customMerge(input1, input2);
          break;
        default:
          mergedData = this.deepMergeObjects(input1, input2);
      }

      // 如果设置了合并键，将结果包装在该键下
      if (this.properties.mergeKey && this.properties.mergeKey !== 'root') {
        mergedData = {
          [this.properties.mergeKey]: mergedData,
          mergeInfo: {
            strategy: this.properties.mergeStrategy,
            timestamp: new Date().toISOString(),
            inputSizes: {
              input1: this.getObjectSize(input1),
              input2: this.getObjectSize(input2)
            }
          }
        };
      }

    } catch (error) {
      return {
        'output': {
          payload: {},
          errors: [`Merge failed: ${error.message}`]
        }
      };
    }

    return {
      'output': {
        payload: mergedData,
        errors: []
      }
    };
  }

  private deepMergeObjects(obj1: any, obj2: any): any {
    if (!this.properties.deepMerge) {
      return { ...obj1, ...obj2 };
    }

    const result = { ...obj1 };

    for (const key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        if (key in result) {
          // 处理冲突
          result[key] = this.resolveConflict(key, result[key], obj2[key]);
        } else {
          result[key] = obj2[key];
        }
      }
    }

    return result;
  }

  private resolveConflict(key: string, value1: any, value2: any): any {
    // 检查是否有自定义规则
    if (this.properties.customMergeRules && this.properties.customMergeRules[key]) {
      const rule = this.properties.customMergeRules[key];
      switch (rule) {
        case 'concat':
          if (Array.isArray(value1) && Array.isArray(value2)) {
            return [...value1, ...value2];
          }
          return String(value1) + String(value2);
        case 'sum':
          return Number(value1) + Number(value2);
        case 'max':
          return Math.max(Number(value1), Number(value2));
        case 'min':
          return Math.min(Number(value1), Number(value2));
      }
    }

    // 应用全局冲突解决策略
    switch (this.properties.conflictResolution) {
      case 'input1-wins':
        return value1;
      case 'input2-wins':
        return value2;
      case 'combine':
        if (Array.isArray(value1) && Array.isArray(value2)) {
          return this.properties.preserveArrays ? [...value1, ...value2] : value2;
        }
        if (this.isObject(value1) && this.isObject(value2)) {
          return this.deepMergeObjects(value1, value2);
        }
        return [value1, value2];
      default:
        return value2; // 默认input2获胜
    }
  }

  private appendData(obj1: any, obj2: any): any {
    // 如果都是数组，连接它们
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return [...obj1, ...obj2];
    }

    // 如果都是对象，合并它们
    if (this.isObject(obj1) && this.isObject(obj2)) {
      return { ...obj1, ...obj2 };
    }

    // 否则创建包含两者的数组
    return [obj1, obj2];
  }

  private customMerge(obj1: any, obj2: any): any {
    // 这里可以实现更复杂的自定义合并逻辑
    // 当前实现一个简单的示例：根据数据类型进行智能合并
    
    if (this.isObject(obj1) && this.isObject(obj2)) {
      const result = { ...obj1 };
      
      // 智能合并对象
      Object.keys(obj2).forEach(key => {
        if (key in result) {
          const val1 = result[key];
          const val2 = obj2[key];
          
          // 数字相加
          if (typeof val1 === 'number' && typeof val2 === 'number') {
            result[key] = val1 + val2;
          }
          // 字符串连接
          else if (typeof val1 === 'string' && typeof val2 === 'string') {
            result[key] = `${val1} ${val2}`;
          }
          // 数组合并
          else if (Array.isArray(val1) && Array.isArray(val2)) {
            result[key] = [...val1, ...val2];
          }
          // 对象递归合并
          else if (this.isObject(val1) && this.isObject(val2)) {
            result[key] = this.customMerge(val1, val2);
          }
          // 其他情况使用input2的值
          else {
            result[key] = val2;
          }
        } else {
          result[key] = obj2[key];
        }
      });
      
      return result;
    }

    return this.appendData(obj1, obj2);
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  private getObjectSize(obj: any): number {
    if (Array.isArray(obj)) {
      return obj.length;
    }
    if (this.isObject(obj)) {
      return Object.keys(obj).length;
    }
    return 1;
  }

  // 添加输入端口的动态管理
  public addInputPort(): void {
    const newPortId = `input${this.inputs.length + 1}`;
    this.inputs.push({
      id: newPortId,
      nodeId: this.id,
      position: { x: 0, y: 0 },
      isInput: true
    });
    this.updatePortPositions();
  }

  public removeInputPort(): void {
    if (this.inputs.length > 2) { // 保持至少2个输入端口
      this.inputs.pop();
      this.updatePortPositions();
    }
  }

  public getMergeStrategies(): string[] {
    return ['merge', 'replace', 'append', 'custom'];
  }

  public getConflictResolutions(): string[] {
    return ['input1-wins', 'input2-wins', 'combine'];
  }
}