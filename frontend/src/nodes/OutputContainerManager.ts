/**
 * OutputContainerManager - 输出容器管理系统
 * 职责：管理节点的数据提取、转换、存储和传递
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */
import { OutputContainer, DataTransform } from './types/ExecutionTypes';

export interface ContainerData {
  id: string;
  containerId: string;
  name: string;
  value: any;
  type: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DataStorage {
  node: Map<string, ContainerData>; // 节点级存储
  global: Map<string, ContainerData>; // 全局存储
  worker: Map<string, ContainerData>; // Worker级存储
}

export class OutputContainerManager {
  private storage: DataStorage;
  private containers: Map<string, OutputContainer>;

  constructor() {
    this.storage = {
      node: new Map(),
      global: new Map(),
      worker: new Map()
    };
    this.containers = new Map();
  }

  // 注册输出容器
  public registerContainer(container: OutputContainer): void {
    this.containers.set(container.id, container);
  }

  // 注册多个容器
  public registerContainers(containers: OutputContainer[]): void {
    containers.forEach(container => this.registerContainer(container));
  }

  // 移除容器
  public removeContainer(containerId: string): void {
    this.containers.delete(containerId);
    // 清理相关数据
    this.clearContainerData(containerId);
  }

  // 存储数据到容器
  public storeData(containerId: string, value: any, metadata?: Record<string, any>): ContainerData | null {
    const container = this.containers.get(containerId);
    if (!container) {
      console.warn(`Container ${containerId} not found`);
      return null;
    }

    // 应用数据转换
    const transformedValue = this.applyDataTransform(value, container.transform);
    
    // 创建容器数据
    const containerData: ContainerData = {
      id: crypto.randomUUID(),
      containerId: container.id,
      name: container.name,
      value: transformedValue,
      type: container.type,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    // 根据存储作用域存储数据
    const targetStorage = this.getStorageByScope(container.storage);
    targetStorage.set(container.name, containerData);

    // 如果设置了持久化，也存储到全局
    if (container.persistent && container.storage !== 'global') {
      this.storage.global.set(`${container.name}_persistent`, containerData);
    }

    return containerData;
  }

  // 获取容器数据
  public getData(containerName: string, scope: 'node' | 'global' | 'worker' = 'node'): ContainerData | null {
    const targetStorage = this.getStorageByScope(scope);
    return targetStorage.get(containerName) || null;
  }

  // 获取所有容器数据
  public getAllData(scope: 'node' | 'global' | 'worker' = 'node'): ContainerData[] {
    const targetStorage = this.getStorageByScope(scope);
    return Array.from(targetStorage.values());
  }

  // 搜索数据
  public searchData(query: {
    name?: string;
    type?: string;
    scope?: 'node' | 'global' | 'worker';
    after?: string; // timestamp
    before?: string; // timestamp
  }): ContainerData[] {
    const targetStorage = query.scope ? this.getStorageByScope(query.scope) : null;
    const allData: ContainerData[] = [];

    if (targetStorage) {
      allData.push(...Array.from(targetStorage.values()));
    } else {
      // 搜索所有作用域
      allData.push(...Array.from(this.storage.node.values()));
      allData.push(...Array.from(this.storage.global.values()));
      allData.push(...Array.from(this.storage.worker.values()));
    }

    return allData.filter(data => {
      if (query.name && !data.name.includes(query.name)) return false;
      if (query.type && data.type !== query.type) return false;
      if (query.after && data.timestamp < query.after) return false;
      if (query.before && data.timestamp > query.before) return false;
      return true;
    });
  }

  // 清空指定作用域的数据
  public clearStorage(scope: 'node' | 'global' | 'worker'): void {
    const targetStorage = this.getStorageByScope(scope);
    targetStorage.clear();
  }

  // 清理容器相关数据
  private clearContainerData(containerId: string): void {
    const storages = [this.storage.node, this.storage.global, this.storage.worker];
    
    storages.forEach(storage => {
      for (const [key, data] of storage.entries()) {
        if (data.containerId === containerId) {
          storage.delete(key);
        }
      }
    });
  }

  // 应用数据转换
  private applyDataTransform(value: any, transform?: DataTransform): any {
    if (!transform) return value;

    let result = value;

    try {
      // 正则提取
      if (transform.regex && typeof result === 'string') {
        const regex = new RegExp(transform.regex);
        const match = result.match(regex);
        result = match ? (match[1] || match[0]) : result;
      }

      // 文本替换
      if (transform.replace && typeof result === 'string') {
        transform.replace.forEach(({ from, to }) => {
          result = result.replace(new RegExp(from, 'g'), to);
        });
      }

      // 格式化
      if (transform.format) {
        result = this.formatValue(result, transform.format);
      }

      // 验证
      if (transform.validator) {
        const isValid = this.validateValue(result, transform.validator);
        if (!isValid) {
          console.warn('Data validation failed for:', result);
        }
      }

    } catch (error) {
      console.warn('Data transform failed:', error);
      return value; // 返回原始值
    }

    return result;
  }

  // 格式化值
  private formatValue(value: any, format: 'url' | 'number' | 'date' | 'json'): any {
    switch (format) {
      case 'url':
        return this.formatAsUrl(value);
      case 'number':
        return this.formatAsNumber(value);
      case 'date':
        return this.formatAsDate(value);
      case 'json':
        return this.formatAsJson(value);
      default:
        return value;
    }
  }

  private formatAsUrl(value: any): string | null {
    try {
      const str = String(value);
      if (str.startsWith('http://') || str.startsWith('https://')) {
        return str;
      }
      if (str.startsWith('//')) {
        return `https:${str}`;
      }
      if (str.startsWith('/')) {
        return `https://example.com${str}`; // 需要配置base URL
      }
      return str;
    } catch {
      return null;
    }
  }

  private formatAsNumber(value: any): number | null {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private formatAsDate(value: any): string | null {
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  private formatAsJson(value: any): any {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  }

  // 验证值
  private validateValue(value: any, validator: string): boolean {
    try {
      // 这里应该使用安全的表达式解析器
      // 暂时简单验证
      if (validator === 'required') {
        return value !== null && value !== undefined && value !== '';
      }
      if (validator === 'url') {
        try {
          new URL(String(value));
          return true;
        } catch {
          return false;
        }
      }
      if (validator === 'number') {
        return !isNaN(Number(value));
      }
      return true;
    } catch {
      return false;
    }
  }

  // 根据作用域获取存储
  private getStorageByScope(scope: 'node' | 'global' | 'worker'): Map<string, ContainerData> {
    switch (scope) {
      case 'node':
        return this.storage.node;
      case 'global':
        return this.storage.global;
      case 'worker':
        return this.storage.worker;
      default:
        return this.storage.node;
    }
  }

  // 导出数据
  public exportData(scope?: 'node' | 'global' | 'worker'): Record<string, any> {
    const data: Record<string, any> = {};

    if (scope) {
      const targetStorage = this.getStorageByScope(scope);
      for (const [key, containerData] of targetStorage.entries()) {
        data[key] = {
          value: containerData.value,
          type: containerData.type,
          timestamp: containerData.timestamp,
          metadata: containerData.metadata
        };
      }
    } else {
      data.node = this.exportData('node');
      data.global = this.exportData('global');
      data.worker = this.exportData('worker');
    }

    return data;
  }

  // 导入数据
  public importData(data: Record<string, any>, scope: 'node' | 'global' | 'worker'): void {
    const targetStorage = this.getStorageByScope(scope);
    
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.value !== undefined) {
        const containerData: ContainerData = {
          id: crypto.randomUUID(),
          containerId: value.containerId || '',
          name: key,
          value: value.value,
          type: value.type || 'unknown',
          timestamp: value.timestamp || new Date().toISOString(),
          metadata: value.metadata || {}
        };
        targetStorage.set(key, containerData);
      }
    });
  }

  // 获取统计信息
  public getStats(): {
    totalContainers: number;
    totalData: number;
    dataByScope: Record<'node' | 'global' | 'worker', number>;
    dataByType: Record<string, number>;
  } {
    const dataByScope = {
      node: this.storage.node.size,
      global: this.storage.global.size,
      worker: this.storage.worker.size
    };

    const dataByType: Record<string, number> = {};
    const allData = this.getAllData('node')
      .concat(this.getAllData('global'))
      .concat(this.getAllData('worker'));

    allData.forEach(data => {
      dataByType[data.type] = (dataByType[data.type] || 0) + 1;
    });

    return {
      totalContainers: this.containers.size,
      totalData: allData.length,
      dataByScope,
      dataByType
    };
  }
}