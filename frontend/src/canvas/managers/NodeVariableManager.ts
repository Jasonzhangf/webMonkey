/**
 * Node Variable Manager - 节点变量管理器
 * 职责：节点变量访问、存储、解析
 */
import { BaseNode } from '../../nodes/BaseNode';

export class NodeVariableManager {
  private nodeVariables: Map<string, any> = new Map(); // 全局节点变量存储
  private nodes: BaseNode[] = [];

  public setNodes(nodes: BaseNode[]): void {
    this.nodes = nodes;
  }

  public setNodeVariable(nodeName: string, key: string, value: any): void {
    const nodeVarKey = `${nodeName}.${key}`;
    this.nodeVariables.set(nodeVarKey, value);
    console.log(`Set variable: ${nodeVarKey} = ${JSON.stringify(value)}`);
  }

  public getNodeVariable(nodeName: string, key: string): any {
    const nodeVarKey = `${nodeName}.${key}`;
    return this.nodeVariables.get(nodeVarKey);
  }

  public resolveVariableExpression(expression: string): any {
    // 解析形如 "nodeName.variableName" 的表达式
    if (expression.includes('.')) {
      const [nodeName, ...pathParts] = expression.split('.');
      const variablePath = pathParts.join('.');
      
      // 查找节点
      const node = this.nodes.find(n => n.nodeName === nodeName);
      if (!node) {
        console.warn(`Node not found: ${nodeName}`);
        return undefined;
      }

      // 从节点变量中获取值
      let value = node.variables[variablePath] || this.getNodeVariable(nodeName, variablePath);
      
      // 支持深层访问，如 "user.name.first"
      if (value && pathParts.length > 1) {
        let current = value;
        for (let i = 1; i < pathParts.length; i++) {
          if (current && typeof current === 'object' && pathParts[i] in current) {
            current = current[pathParts[i]];
          } else {
            return undefined;
          }
        }
        value = current;
      }

      console.log(`Resolved variable: ${expression} = ${JSON.stringify(value)}`);
      return value;
    }
    
    return expression; // 不是变量表达式，直接返回
  }

  public getAllNodeVariables(): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    
    // 从nodeVariables Map中获取所有变量
    this.nodeVariables.forEach((value, key) => {
      result[key] = value;
    });
    
    // 从各个节点的variables中获取变量
    this.nodes.forEach(node => {
      if (node.nodeName && Object.keys(node.variables).length > 0) {
        Object.entries(node.variables).forEach(([key, value]) => {
          result[`${node.nodeName}.${key}`] = value;
        });
      }
    });
    
    return result;
  }
}