/**
 * ActionNodeV2 - 执行序列架构的Action节点
 * 职责：支持多步骤执行序列、Worker/Page绑定、输出容器管理
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */
import { BaseNode, NodePosition, WorkflowData } from './BaseNode';
import { 
  ActionNodeConfig, 
  ExecutionSequence, 
  OutputContainer, 
  ActionExecutionResult,
  SequenceExecutionResult,
  StepExecutionResult,
  ActionStep,
  SelectorFactory,
  OperationFactory
} from './types/ExecutionTypes';

export class ActionNodeV2 extends BaseNode {
  private config: ActionNodeConfig;

  constructor(position: NodePosition) {
    super(position, 'Action');
    
    // 设置绑定要求
    this.requiresWorkerBinding = true;
    this.requiresPageBinding = true;
    
    // 初始化默认配置
    this.config = {
      workerId: '',
      pageId: '',
      sequences: [this.createDefaultSequence()],
      outputContainers: [],
      globalTimeout: 30000,
      parallel: false,
      onErrorStop: true
    };

    this.setupPorts();
    this.setupProperties();
    this.updatePortPositions();
  }

  private setupPorts(): void {
    this.inputs = [{
      id: 'in',
      nodeId: this.id,
      position: { x: 0, y: 0 },
      isInput: true,
      portNumber: 1
    }];

    this.outputs = [{
      id: 'out',
      nodeId: this.id,
      position: { x: 0, y: 0 },
      isInput: false,
      portNumber: 1
    }];
  }

  private setupProperties(): void {
    this.properties = {
      // Worker/Page绑定
      workerId: this.config.workerId,
      pageId: this.config.pageId,
      
      // 执行配置
      globalTimeout: this.config.globalTimeout,
      parallel: this.config.parallel,
      onErrorStop: this.config.onErrorStop,
      
      // 序列配置（JSON字符串）
      sequencesJson: JSON.stringify(this.config.sequences, null, 2),
      
      // 输出容器配置（JSON字符串）
      outputContainersJson: JSON.stringify(this.config.outputContainers, null, 2),
      
      // 简化属性（用于快速配置）
      simpleSelector: '.button',
      simpleAction: 'click',
      simpleText: '',
      simpleWaitTime: 1000
    };
  }

  private createDefaultSequence(): ExecutionSequence {
    return {
      id: crypto.randomUUID(),
      name: '默认操作序列',
      description: '点击指定元素',
      steps: [
        OperationFactory.waitForElement(SelectorFactory.css('.button')),
        OperationFactory.click(SelectorFactory.css('.button')),
        OperationFactory.wait(1000)
      ],
      continueOnError: false
    };
  }

  public async execute(input: WorkflowData): Promise<{ [portId: string]: WorkflowData }> {
    try {
      this.executionState = 'running';
      this.updateConfigFromProperties();

      // 验证绑定
      const bindingValidation = this.validateBindings();
      if (!bindingValidation.isValid) {
        throw new Error(`绑定验证失败: ${bindingValidation.errors.join(', ')}`);
      }

      // 验证配置
      const configValidation = this.validateConfig();
      if (!configValidation.isValid) {
        throw new Error(`配置验证失败: ${configValidation.errors.join(', ')}`);
      }

      const startTime = Date.now();
      const executionResult: ActionExecutionResult = {
        actionId: this.id,
        workerId: this.config.workerId,
        pageId: this.config.pageId,
        success: true,
        sequences: [],
        outputs: {},
        globalData: {},
        duration: 0,
        timestamp: new Date().toISOString()
      };

      // 执行序列
      if (this.config.parallel) {
        // 并行执行所有序列
        const sequencePromises = this.config.sequences.map(seq => 
          this.executeSequence(seq, input.payload)
        );
        executionResult.sequences = await Promise.all(sequencePromises);
      } else {
        // 顺序执行序列
        for (const sequence of this.config.sequences) {
          const seqResult = await this.executeSequence(sequence, input.payload);
          executionResult.sequences.push(seqResult);
          
          if (!seqResult.success && this.config.onErrorStop) {
            executionResult.success = false;
            executionResult.error = `序列执行失败: ${seqResult.error}`;
            break;
          }
        }
      }

      // 收集输出数据
      executionResult.outputs = this.collectOutputs(executionResult.sequences);
      executionResult.duration = Date.now() - startTime;

      this.executionState = executionResult.success ? 'completed' : 'failed';

      return {
        'out': {
          payload: {
            ...input.payload,
            actionResult: executionResult,
            outputs: executionResult.outputs
          },
          errors: executionResult.success ? [] : [executionResult.error || '执行失败']
        }
      };

    } catch (error) {
      this.executionState = 'failed';
      return {
        'out': {
          payload: null,
          errors: [`Action执行异常: ${error instanceof Error ? error.message : String(error)}`]
        }
      };
    }
  }

  private async executeSequence(sequence: ExecutionSequence, inputData: any): Promise<SequenceExecutionResult> {
    const startTime = Date.now();
    const result: SequenceExecutionResult = {
      sequenceId: sequence.id,
      success: true,
      steps: [],
      outputData: {},
      duration: 0,
      timestamp: new Date().toISOString()
    };

    try {
      // 检查执行条件
      if (sequence.condition) {
        const shouldExecute = this.evaluateCondition(sequence.condition, inputData);
        if (!shouldExecute) {
          result.success = true;
          result.duration = Date.now() - startTime;
          return result;
        }
      }

      // 执行步骤（这里是模拟执行，实际应该调用后端API）
      for (const step of sequence.steps) {
        const stepResult = await this.executeStep(step, inputData);
        result.steps.push(stepResult);

        if (!stepResult.success && !sequence.continueOnError) {
          result.success = false;
          result.error = `步骤执行失败: ${stepResult.error}`;
          break;
        }

        // 收集步骤输出数据
        if (stepResult.data) {
          result.outputData[step.id] = stepResult.data;
        }
      }

      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  private async executeStep(step: ActionStep, inputData: any): Promise<StepExecutionResult> {
    const startTime = Date.now();
    const result: StepExecutionResult = {
      stepId: step.id,
      success: true,
      duration: 0,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    try {
      // 模拟步骤执行（实际应该通过WebSocket调用后端）
      console.log('EXECUTE_STEP command:', {
        type: 'EXECUTE_STEP',
        workerId: this.config.workerId,
        pageId: this.config.pageId,
        step: step,
        inputData: inputData
      });

      console.log('Executing step:', step.type, step.name);
      
      // 模拟执行结果
      switch (step.type) {
        case 'wait':
          result.data = { waited: step.waitConfig?.duration || 0 };
          break;
        case 'operation':
          result.data = { 
            action: step.operation?.action,
            target: step.operation?.target,
            completed: true
          };
          break;
        case 'extract':
          result.data = {
            extractType: step.extractConfig?.extractType,
            value: `extracted_${Date.now()}`
          };
          break;
        default:
          result.data = { type: step.type, completed: true };
      }

      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  private updateConfigFromProperties(): void {
    this.config.workerId = this.workerId || '';
    this.config.pageId = this.pageId || '';
    this.config.globalTimeout = this.properties.globalTimeout || 30000;
    this.config.parallel = this.properties.parallel || false;
    this.config.onErrorStop = this.properties.onErrorStop !== false;

    // 从JSON属性更新序列和输出容器
    try {
      if (this.properties.sequencesJson) {
        this.config.sequences = JSON.parse(this.properties.sequencesJson);
      }
    } catch (error) {
      console.warn('Invalid sequences JSON, using defaults');
    }

    try {
      if (this.properties.outputContainersJson) {
        this.config.outputContainers = JSON.parse(this.properties.outputContainersJson);
      }
    } catch (error) {
      console.warn('Invalid output containers JSON, using defaults');
    }
  }

  private validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.sequences.length === 0) {
      errors.push('至少需要一个执行序列');
    }

    if ((this.config.globalTimeout || 0) <= 0) {
      errors.push('全局超时时间必须大于0');
    }

    // 验证序列
    this.config.sequences.forEach((seq, index) => {
      if (!seq.name.trim()) {
        errors.push(`序列${index + 1}需要名称`);
      }
      if (seq.steps.length === 0) {
        errors.push(`序列"${seq.name}"至少需要一个步骤`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private evaluateCondition(condition: string, data?: any): boolean {
    // 简单的条件评估（实际应该使用安全的表达式解析器）
    try {
      // 这里应该使用安全的表达式解析，暂时返回true
      console.log('Evaluating condition:', condition, 'with data:', data);
      return true;
    } catch (error) {
      console.warn('Condition evaluation failed:', condition, error);
      return false;
    }
  }

  private collectOutputs(sequenceResults: SequenceExecutionResult[]): Record<string, any> {
    const outputs: Record<string, any> = {};

    // 从输出容器配置收集数据
    this.config.outputContainers.forEach(container => {
      try {
        if (container.source === 'sequence') {
          const seqResult = sequenceResults.find(seq => seq.sequenceId === container.sourceId);
          if (seqResult) {
            outputs[container.name] = seqResult.outputData;
          }
        } else if (container.source === 'step') {
          // 查找特定步骤的输出
          for (const seqResult of sequenceResults) {
            const stepResult = seqResult.steps.find(step => step.stepId === container.sourceId);
            if (stepResult) {
              outputs[container.name] = stepResult.data;
              break;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to collect output for ${container.name}:`, error);
      }
    });

    return outputs;
  }

  // 公共方法：获取配置
  public getConfig(): ActionNodeConfig {
    this.updateConfigFromProperties();
    return { ...this.config };
  }

  // 公共方法：更新序列
  public updateSequences(sequences: ExecutionSequence[]): void {
    this.config.sequences = sequences;
    this.properties.sequencesJson = JSON.stringify(sequences, null, 2);
  }

  // 公共方法：更新输出容器
  public updateOutputContainers(containers: OutputContainer[]): void {
    this.config.outputContainers = containers;
    this.properties.outputContainersJson = JSON.stringify(containers, null, 2);
  }
}