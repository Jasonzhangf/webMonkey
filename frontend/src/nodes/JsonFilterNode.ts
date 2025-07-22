/**
 * JSON Filter Node - JSON过滤节点
 * 根据指定规则过滤JSON数据的字段
 */

import { BaseNode, NodePosition } from './BaseNode';

export type FilterMode = 'include' | 'exclude' | 'transform' | 'validate';
export type FilterRule = {
  path: string;
  condition?: string;
  value?: any;
  transform?: string;
};

export class JsonFilterNode extends BaseNode {
  constructor(position: NodePosition) {
    super(position, 'JsonFilter');
    this.title = 'JSON Filter';
    
    // 添加输入和输出端口
    this.inputs.push({ id: 'input', nodeId: this.id, position: { x: 0, y: 0 }, isInput: true });
    this.outputs.push({ id: 'output', nodeId: this.id, position: { x: 0, y: 0 }, isInput: false });
    
    // 设置默认属性
    this.properties = {
      filterMode: 'include',
      filterPaths: ['user.name', 'user.email'], // 默认过滤路径
      excludePaths: [],
      transformRules: {},
      conditions: {},
      preserveStructure: true,
      allowEmptyResults: true,
      defaultValue: null,
      ...this.properties
    };
    
    this.updatePortPositions();
  }

  public async execute(input: any): Promise<{ [portId: string]: any }> {
    console.log('JsonFilterNode executing with input:', input);
    
    const inputData = input.payload || {};
    let filteredData: any;
    const errors: string[] = [];
    
    try {
      switch (this.properties.filterMode) {
        case 'include':
          filteredData = this.includeFields(inputData);
          break;
        case 'exclude':
          filteredData = this.excludeFields(inputData);
          break;
        case 'transform':
          filteredData = this.transformFields(inputData);
          break;
        case 'validate':
          filteredData = this.validateAndFilter(inputData, errors);
          break;
        default:
          filteredData = this.includeFields(inputData);
      }

      // 添加过滤信息
      if (this.properties.includeMetadata !== false) {
        filteredData = {
          ...filteredData,
          _filterInfo: {
            mode: this.properties.filterMode,
            timestamp: new Date().toISOString(),
            originalSize: this.getObjectSize(inputData),
            filteredSize: this.getObjectSize(filteredData),
            appliedPaths: this.properties.filterPaths || []
          }
        };
      }

    } catch (error) {
      errors.push(`Filter failed: ${error.message}`);
      filteredData = this.properties.allowEmptyResults ? {} : inputData;
    }

    return {
      'output': {
        payload: filteredData,
        errors
      }
    };
  }

  private includeFields(data: any): any {
    const result = {};
    const paths = this.properties.filterPaths || [];
    
    paths.forEach(path => {
      const value = this.getValueByPath(data, path);
      if (value !== undefined || this.properties.allowEmptyResults) {
        this.setValueByPath(result, path, value ?? this.properties.defaultValue);
      }
    });

    return this.properties.preserveStructure ? result : this.flattenIfNeeded(result);
  }

  private excludeFields(data: any): any {
    const result = this.deepClone(data);
    const paths = this.properties.excludePaths || this.properties.filterPaths || [];
    
    paths.forEach(path => {
      this.deleteValueByPath(result, path);
    });

    return result;
  }

  private transformFields(data: any): any {
    let result = this.deepClone(data);
    const transformRules = this.properties.transformRules || {};
    
    Object.entries(transformRules).forEach(([path, transform]) => {
      const value = this.getValueByPath(result, path);
      if (value !== undefined) {
        const transformedValue = this.applyTransform(value, transform as string);
        this.setValueByPath(result, path, transformedValue);
      }
    });

    return result;
  }

  private validateAndFilter(data: any, errors: string[]): any {
    const result = {};
    const paths = this.properties.filterPaths || [];
    const conditions = this.properties.conditions || {};
    
    paths.forEach(path => {
      const value = this.getValueByPath(data, path);
      const condition = conditions[path];
      
      if (condition) {
        if (this.validateCondition(value, condition)) {
          this.setValueByPath(result, path, value);
        } else {
          errors.push(`Validation failed for path '${path}': ${condition}`);
        }
      } else {
        // 没有条件时直接包含
        if (value !== undefined) {
          this.setValueByPath(result, path, value);
        }
      }
    });

    return result;
  }

  private getValueByPath(obj: any, path: string): any {
    if (!path || !obj) return undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      // 处理数组索引
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.substring(0, key.indexOf('['));
        const index = parseInt(key.substring(key.indexOf('[') + 1, key.indexOf(']')));
        
        current = current[arrayKey];
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        current = current[key];
      }
    }
    
    return current;
  }

  private setValueByPath(obj: any, path: string, value: any): void {
    if (!path) return;
    
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private deleteValueByPath(obj: any, path: string): void {
    if (!path || !obj) return;
    
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        return; // 路径不存在
      }
      current = current[key];
    }
    
    delete current[keys[keys.length - 1]];
  }

  private applyTransform(value: any, transform: string): any {
    switch (transform) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value).toISOString();
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'first':
        return Array.isArray(value) ? value[0] : value;
      case 'last':
        return Array.isArray(value) ? value[value.length - 1] : value;
      case 'count':
        if (Array.isArray(value)) return value.length;
        if (typeof value === 'object' && value !== null) return Object.keys(value).length;
        return 1;
      case 'keys':
        return typeof value === 'object' && value !== null ? Object.keys(value) : [];
      case 'values':
        return typeof value === 'object' && value !== null ? Object.values(value) : [value];
      default:
        // 支持简单的数学运算
        if (transform.startsWith('multiply:')) {
          const factor = parseFloat(transform.split(':')[1]);
          return Number(value) * factor;
        }
        if (transform.startsWith('add:')) {
          const addend = parseFloat(transform.split(':')[1]);
          return Number(value) + addend;
        }
        if (transform.startsWith('substring:')) {
          const [start, end] = transform.split(':')[1].split(',').map(Number);
          return typeof value === 'string' ? value.substring(start, end) : value;
        }
        return value;
    }
  }

  private validateCondition(value: any, condition: string): boolean {
    try {
      // 简单的条件验证
      if (condition.includes('!=')) {
        const [, expectedValue] = condition.split('!=').map(s => s.trim());
        return value != expectedValue;
      }
      if (condition.includes('==')) {
        const [, expectedValue] = condition.split('==').map(s => s.trim());
        return value == expectedValue;
      }
      if (condition.includes('>=')) {
        const [, expectedValue] = condition.split('>=').map(s => s.trim());
        return Number(value) >= Number(expectedValue);
      }
      if (condition.includes('<=')) {
        const [, expectedValue] = condition.split('<=').map(s => s.trim());
        return Number(value) <= Number(expectedValue);
      }
      if (condition.includes('>')) {
        const [, expectedValue] = condition.split('>').map(s => s.trim());
        return Number(value) > Number(expectedValue);
      }
      if (condition.includes('<')) {
        const [, expectedValue] = condition.split('<').map(s => s.trim());
        return Number(value) < Number(expectedValue);
      }
      if (condition === 'exists') {
        return value !== undefined && value !== null;
      }
      if (condition === 'not-empty') {
        return value !== undefined && value !== null && value !== '';
      }
      if (condition.startsWith('type:')) {
        const expectedType = condition.split(':')[1];
        return typeof value === expectedType;
      }
      if (condition.startsWith('length:')) {
        const expectedLength = parseInt(condition.split(':')[1]);
        const length = Array.isArray(value) ? value.length : String(value).length;
        return length === expectedLength;
      }
      if (condition.startsWith('contains:')) {
        const searchValue = condition.split(':')[1];
        return String(value).includes(searchValue);
      }
      
      return true; // 默认通过验证
    } catch (error) {
      return false;
    }
  }

  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }
    
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = this.deepClone(obj[key]);
    });
    
    return cloned;
  }

  private flattenIfNeeded(obj: any): any {
    if (!this.properties.preserveStructure) {
      // 简单的扁平化实现
      const result = {};
      const flatten = (current: any, prefix = '') => {
        Object.keys(current).forEach(key => {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key])) {
            flatten(current[key], newKey);
          } else {
            result[newKey] = current[key];
          }
        });
      };
      flatten(obj);
      return result;
    }
    return obj;
  }

  private getObjectSize(obj: any): number {
    if (Array.isArray(obj)) {
      return obj.length;
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj).length;
    }
    return 1;
  }

  // 获取可用的过滤模式
  public getFilterModes(): string[] {
    return ['include', 'exclude', 'transform', 'validate'];
  }

  // 获取可用的转换操作
  public getTransformOperations(): string[] {
    return [
      'uppercase', 'lowercase', 'trim', 'number', 'string', 'boolean',
      'date', 'array', 'first', 'last', 'count', 'keys', 'values',
      'multiply:2', 'add:10', 'substring:0,5'
    ];
  }

  // 获取可用的条件操作
  public getConditionOperations(): string[] {
    return [
      'exists', 'not-empty', 'type:string', 'type:number', 'type:boolean',
      'length:5', 'contains:test', '==value', '!=value', '>10', '<100'
    ];
  }
}