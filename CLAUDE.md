# 网页自动化编排系统 - 开发指南

## 🎯 项目概述
这是一个自适应的网页自动化系统，采用**前端定义流程，后端执行**的架构模式：
1. **前端编排器** - 可视化节点编辑器，定义工作流和浏览器操作序列
2. **后端执行器** - 负责浏览器控制、流程执行、数据管理和结果传递

## 🏗️ 架构原则
### 原子化设计
- **所有代码编写都尽量原子化、自包含、可移植**
- **最小功能最小依赖** - 每个模块只依赖必要的组件
- **文件尽量小，结构清晰** - 单个文件不超过500行
- **禁止大文件存在** - 超过限制时必须拆分重构

### 模块化架构
```
project/
├── backend/           # Python后端服务
│   ├── src/
│   │   ├── api/      # FastAPI路由
│   │   ├── services/ # 业务逻辑服务
│   │   ├── models/   # 数据模型
│   │   └── utils/    # 工具函数
├── frontend/         # 前端编排界面
├── plugin/           # 浏览器插件
│   ├── src/
│   │   ├── content/  # 页面内容脚本
│   │   ├── popup/    # 插件弹窗
│   │   └── background/ # 后台脚本
└── shared/           # 共享类型定义
```

## 🔧 开发规范

### 浏览器自动化
- **默认浏览器**: **Camoufox** (基于Firefox)，以提供更强的浏览器指纹隐匿性。
- **自动化库**: **Playwright**，用于驱动浏览器执行操作。
- **虚拟环境**: 所有Python依赖（包括Playwright）都必须安装在项目根目录的`./venv`虚拟环境中。

### 细菌式编程规范 (500行限制)
- **🚨 硬性限制**: 每个文件最多500行代码 - 违反则立即重构拆分
- **原子化模块**: 每个模块只负责一个清晰的功能职责
- **自包含设计**: 最小化外部依赖，模块间低耦合
- **可移植性**: 代码应该易于提取和重用
- **按功能职责组织模块** - 单一职责原则
- **使用清晰的导入语句** - 优先使用相对导入
- **所有函数必须有类型注解** - TypeScript和Python都要求

### 文件拆分策略
当文件接近或超过500行时，按以下原则拆分：
1. **功能分离**: 不同功能拆分到独立文件
2. **层级分离**: UI层、业务逻辑层、数据层分离
3. **工具提取**: 通用工具函数提取到utils
4. **类型定义**: 复杂类型定义提取到types文件
5. **常量配置**: 配置和常量提取到config文件

### Python后端规范
```python
# 使用FastAPI + Pydantic + SQLAlchemy
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# 每个函数都要有docstring
def process_workflow(workflow_data: dict) -> dict:
    """
    处理工作流数据
    
    Args:
        workflow_data: 工作流配置数据
        
    Returns:
        dict: 处理结果
    """
    pass
```

### TypeScript前端规范
```typescript
// 使用严格类型定义
interface ElementData {
    selectors: {
        css: string;
        xpath: string;
        attributes: Record<string, string>;
    };
    operations: Operation[];
    metadata: ElementMetadata;
}

// 小函数，单一职责
function generateElementSelector(element: HTMLElement): string {
    // 实现逻辑
}
```

## 🎨 用户交互设计

### 前端操作流程
1. **元素捕获** - 用户点击页面元素，系统捕获选择器
2. **操作选择** - 用户选择要执行的操作类型
3. **流程编排** - 用户可以编辑操作序列，形成操作子
4. **操作库管理** - 操作子可以被保存、导出、动态生成

### 操作子体系
```typescript
interface OperationUnit {
    id: string;
    observation: ObservationStep;  // 观察步骤
    action: ActionStep;           // 动作步骤
    condition?: ConditionCheck;   // 条件判断
    loop?: LoopConfig;           // 循环控制
}
```

## 🔄 系统通信

### 前后端通信
- **WebSocket实时通信** - 插件与后端服务器
- **REST API** - 工作流管理和状态查询
- **消息路由** - 支持多节点并发连接

### 浏览器句柄传递
```typescript
interface BrowserHandle {
    instance_id: string;
    session_id: string;
    current_url: string;
    cookies: Record<string, any>;
    page_state: PageState;
}
```

## 📋 任务管理

### 开发任务跟踪
- **查看 `.kiro/specs/web-automation-orchestrator/tasks.md`** 了解当前进度
- **完成任务后立即标记** - 更新任务状态
- **发现新任务时添加到任务列表** - 保持任务跟踪完整

### 当前开发阶段
- ✅ 阶段1: 项目基础架构 (已完成)
- ✅ 阶段2: 浏览器插件核心功能 (已完成)
- 🔄 阶段3: Canvas节点编排系统 (进行中)
- ⏳ 阶段4: Python后端服务
- ⏳ 阶段5: 任务状态机和执行器

## 🧪 测试要求
- **每个新功能都要有单元测试** - 使用pytest (Python) 或 Jest (TypeScript)
- **集成测试覆盖关键流程** - 端到端用户场景
- **错误处理测试** - 边界条件和异常情况

## 🔒 安全和性能
- **输入验证** - 所有用户输入都要验证
- **错误处理** - 优雅的错误恢复机制
- **资源管理** - 浏览器实例池管理
- **Cookie自动化管理** - 按域名+时间戳存储

## 🌐 部署支持
- **独立执行器** - 支持无头模式运行
- **局域网访问** - 支持团队协作
- **MCP协议接口** - 可作为MCP服务使用
- **REST API控制** - 支持外部系统集成

## 🚫 禁止事项
- **🚨 不要创建超过500行的文件** - 发现即重构
- **不要在没有类型注解的情况下编写函数**
- **不要忽略错误处理**
- **不要创建紧耦合的模块**
- **不要在没有测试的情况下提交代码**
- **不要创建巨型类或函数** - 保持函数小而专一
- **不要在单个文件中混合多个职责** - 严格遵循单一职责原则

## 💡 开发提示
- **优先考虑用户体验** - 界面要直观易用
- **保持代码简洁** - 能用10行解决的不要写20行
- **文档和代码同步更新** - 修改功能时同步更新文档
- **性能优先** - 考虑大量元素和复杂工作流的性能

## 🌐 浏览器工作流系统架构

本系统采用**以浏览器为中心的工作流架构**，前端定义流程，后端执行操作。

### 🖥️ Worker（浏览器工作器）概念

#### Worker定义
每个**浏览器实例就是一个Worker**，是独立的执行环境：
- **一个Worker = 一个浏览器进程**
- **Worker具有全局作用域** - 整个工作流都可以访问同一个Worker
- **Worker包含初始化配置** - headless模式、viewport、cookie等属性
- **Worker可以管理多个Page** - 同一浏览器中的不同标签页

#### Worker初始化节点
每个工作流必须包含一个**Worker初始化节点**，用于配置：

```typescript
interface WorkerConfig {
  // 浏览器基础配置
  headless: boolean;           // 无头模式
  viewport: {                  // 视口大小
    width: number;
    height: number;
  };
  userAgent: string;          // 用户代理
  
  // 会话配置
  cookies: Cookie[];          // 预设Cookie
  localStorage: Record<string, string>; // 本地存储
  sessionStorage: Record<string, string>; // 会话存储
  
  // 目标网页
  initialUrl: string;         // 初始访问页面
  
  // 性能配置
  timeout: number;            // 默认超时时间
  waitForLoadState: 'load' | 'domcontentloaded' | 'networkidle';
}
```

#### Worker全局变量
Worker初始化后，以下变量成为**全局变量**，整个流水线都可以访问：
- `browserHandle` - 浏览器句柄
- `context` - 浏览器上下文
- `currentPage` - 当前活动页面
- `pages` - 页面管理器
- `workerConfig` - Worker配置
- `globalStorage` - Worker级别的数据存储

### 📄 Page（页面）管理

#### Page概念
- **一个Worker可以包含多个Page**（类似浏览器的多标签页）
- **每个Page都有独立的DOM环境**
- **Page之间可以传递数据**
- **Action操作必须绑定到具体的Page**

#### Page操作
```typescript
interface PageOperation {
  workerId: string;    // 绑定的Worker ID
  pageId: string;      // 目标Page ID
  operation: Operation; // 具体操作
}
```

### ⚡ Action节点架构

#### 执行序列设计
每个Action节点可以包含**一个或多个执行序列**：

```typescript
interface ActionNode {
  workerId: string;              // 绑定的Worker
  pageId: string;               // 绑定的Page
  sequences: ExecutionSequence[]; // 执行序列列表
  outputContainers: OutputContainer[]; // 输出容器
}

interface ExecutionSequence {
  id: string;
  name: string;
  steps: ActionStep[];          // 操作步骤
  condition?: string;           // 执行条件
  loop?: LoopConfig;           // 循环配置
}

interface ActionStep {
  type: 'select' | 'operation' | 'wait' | 'extract';
  selector?: ElementSelector;   // 元素选择器
  operation?: Operation;        // 具体操作
  waitConfig?: WaitConfig;     // 等待配置
  extractConfig?: ExtractConfig; // 提取配置
}
```

#### 基本操作序列
```typescript
// 基本等待操作
interface WaitStep {
  type: 'wait';
  waitType: 'time' | 'element' | 'network' | 'custom';
  duration?: number;           // 等待时间(ms)
  selector?: string;          // 等待元素出现
  condition?: string;         // 自定义条件
}

// 元素选择操作
interface SelectStep {
  type: 'select';
  selector: {
    css?: string;
    xpath?: string;
    text?: string;
    attributes?: Record<string, string>;
  };
  multiple?: boolean;         // 是否选择多个元素
}

// 基础操作
interface OperationStep {
  type: 'operation';
  operation: {
    action: 'click' | 'input' | 'hover' | 'scroll' | 'extract';
    target: ElementSelector;
    parameters?: {
      text?: string;          // 输入文本
      offset?: {x: number, y: number}; // 点击偏移
      scrollBy?: {x: number, y: number}; // 滚动距离
    };
  };
}
```

#### 数据提取与输出容器
Action节点如果执行内容提取，需要配置**输出容器**：

```typescript
interface OutputContainer {
  id: string;
  name: string;                // 变量名称
  type: 'text' | 'html' | 'attribute' | 'image' | 'link' | 'json';
  selector: ElementSelector;   // 提取源选择器
  transform?: DataTransform;   // 数据转换规则
  storage: 'node' | 'global' | 'worker'; // 存储作用域
}

interface DataTransform {
  regex?: string;              // 正则提取
  replace?: {from: string, to: string}[]; // 文本替换
  format?: 'url' | 'number' | 'date' | 'json'; // 格式化
  validator?: string;          // 数据验证规则
}
```

### 🔄 数据传递机制

#### 前后端数据流
数据在前后端之间以以下格式传递：

```typescript
interface DataPayload {
  type: 'variable' | 'data' | 'image' | 'link' | 'file';
  content: any;                // 数据内容
  metadata: {
    source: string;            // 数据来源
    timestamp: string;         // 时间戳
    format: string;           // 数据格式
    size?: number;            // 数据大小
  };
}

// 变量传递
interface VariablePayload extends DataPayload {
  type: 'variable';
  content: {
    name: string;
    value: any;
    dataType: string;
  };
}

// 图片传递
interface ImagePayload extends DataPayload {
  type: 'image';
  content: {
    base64: string;           // Base64编码图片
    url?: string;            // 图片URL
    alt?: string;           // 替代文本
  };
}

// 链接传递
interface LinkPayload extends DataPayload {
  type: 'link';
  content: {
    href: string;
    text: string;
    target?: string;
  };
}
```

### 🎯 执行流程

#### 工作流执行顺序
1. **Worker初始化** - 创建浏览器实例，配置基础参数
2. **Page创建** - 根据需要创建页面，导航到目标URL
3. **节点执行** - 按DAG顺序执行Action节点
4. **数据收集** - 提取的数据存储在输出容器中
5. **结果传递** - 通过WebSocket将结果传回前端
6. **资源清理** - 执行完成后清理浏览器资源

#### Worker与Page的绑定关系
```typescript
// 操作绑定示例
const actionConfig = {
  workerId: "worker_001",      // 必须绑定到特定Worker
  pageId: "page_main",         // 必须绑定到特定Page
  sequences: [
    {
      steps: [
        {type: 'select', selector: {css: '.login-btn'}},
        {type: 'operation', operation: {action: 'click'}},
        {type: 'wait', waitType: 'time', duration: 2000},
        {type: 'extract', extractConfig: {target: '.result'}}
      ]
    }
  ]
};
```

### 📋 关键概念总结

#### 🎯 核心理念
- **前端定义流程，后端执行** - 前端编排界面设计工作流，后端负责浏览器控制和执行
- **以浏览器为中心** - 整个系统围绕浏览器Worker的生命周期设计
- **全局变量共享** - Worker初始化后，浏览器句柄等关键变量全局可访问

#### 🏗️ 三层架构
1. **Worker层** - 浏览器进程管理，配置初始化，资源清理
2. **Page层** - 页面管理，DOM操作，页面间数据传递
3. **Action层** - 具体操作执行，数据提取，结果输出

#### 🔗 绑定关系
- **每个Action必须绑定Worker和Page**
- **同一Worker内的所有操作共享浏览器上下文**
- **不同Page间可以独立操作，也可以数据交互**

#### 📊 数据流向
```
前端节点编辑器 → 工作流JSON → 后端执行引擎 → 浏览器Worker → 页面操作 → 数据提取 → 结果回传 → 前端显示
```

#### 🔧 扩展机制
- **输出容器** - 灵活的数据提取和转换
- **执行序列** - 支持复杂的操作组合
- **条件执行** - 基于运行时状态的动态流程
- **多媒体支持** - 文本、图片、链接、文件等多种数据类型

这套架构确保了系统的**可扩展性**、**可维护性**和**性能优化**。

## 核心架构：数据流与执行模型

本系统在浏览器工作流基础上，采用基于有向无环图 (DAG) 的数据流架构。

### 1. 数据流转机制
- **核心载体**: 数据以 `WorkflowData` 对象的形式在节点间流转。此对象包含 `payload` (业务数据) 和 `errors` (错误信息)。
- **流转路径**: 数据从一个节点的**输出端口 (Output Port)**，通过**连接线 (Connection)**，定向流入下一个节点的**输入端口 (Input Port)**。
- **执行引擎**: 后端执行引擎根据图的拓扑结构，从 `StartNode` 开始，按顺序触发每个节点的执行。

### 2. 变量（数据）的生命周期
- **无显式声明**: 系统中没有全局变量。数据在流程中动态生成和转换。
- **生成**: `StartNode` 提供初始数据，而后续节点（如“提取文本”节点）根据自身逻辑处理输入并生成新的输出数据。
- **配置**: 节点的静态参数（如要输入的文本内容）通过属性面板由用户配置。

### 3. 变量传递过程
变量的传递由每个节点的 `execute` 方法定义：
```typescript
public abstract execute(input: WorkflowData): Promise<{ [portId: string]: WorkflowData }>;
```
- **输入**: 节点接收上游节点的 `WorkflowData` 作为输入。
- **执行**: 节点内部逻辑对 `input` 数据进行处理。
- **输出**: `execute` 方法返回一个映射 (Map)，`key` 为输出端口ID，`value` 为该端口对应的 `WorkflowData`。
- **路由**: 执行引擎根据此映射和图的连接，将数据精确传递到下游节点。

### 4. 动态端口定义
节点的输入输出端口（数量、类型、名称）不是固定的，而是在每个节点类的构造函数 (`constructor`) 中动态定义的。通过向 `this.inputs` 和 `this.outputs` 数组中添加端口对象，可以实现节点的个性化和灵活性。

例如，`ConditionalNode` (条件节点) 有1个输入和2个输出 (`true` / `false`)，而 `ActionNode` (动作节点) 通常只有1个输入和1个输出。这种设计保证了系统的可扩展性。

### 5. 与 ComfyUI 的比较
- **相似性**: 共享相同的核心理念，如DAG图结构、节点化功能、数据驱动执行，以及强大的模块化和扩展性。
- **差异性**:
    - **应用领域**: 本系统专注于**网页自动化**，核心数据是浏览器句柄、元素选择器等，而非AI模型或图像数据。
    - **执行模式**: 需要与一个**有状态的、实时的**浏览器实例进行双向通信和状态管理，这是与批处理式AI计算的主要区别。

## 卡片化UI系统设计规范

### 核心原则
本系统采用完全**卡片化的UI架构**，每个界面元素都封装在独立的卡片组件中，确保数据隔离、界面自包含、以及一致的视觉体验。

### 1. 卡片组件特性
- **独立自包含**: 每个卡片都是独立的UI组件，包含自己的数据管理通道
- **唯一存在**: 同类型卡片在同一容器中保持唯一性，避免重复和冲突
- **数据隔离**: 卡片内部数据通过独立的dataStore管理，不直接污染全局状态
- **可嵌套**: 支持卡片嵌套，子卡片继承父卡片的样式规则

### 2. 布局排版规则
#### 基础对齐规则
- **居中对齐**: 所有卡片内容默认水平和垂直居中
- **对称布局**: 元素在卡片内保持视觉对称
- **边界约束**: 子元素不超出父卡片容器范围，不发生覆盖
- **一致性原则**: 同一容器下的同级卡片必须保持一致的宽度和外观

#### 容器充填规则
- **内部充满**: 卡片内部的元素（按钮、输入框等）充满其直接父容器
- **卡片自适应**: 卡片本身根据内容自动调整大小，不强制充满外层容器
- **合理间距**: 保留少量容器间歇（4-8px），确保视觉层次清晰
- **响应式适配**: 根据容器大小自动调整内容布局
- **内容一致**: 同一卡片内的同类元素保持一致的宽度和样式
- **高度自适应**: 卡片高度根据内容自动调整，但同类型内容应保持一致的高度

#### 嵌套层级规则
- **继承样式**: 子卡片继承父卡片的排版风格和对齐方式
- **层级区分**: 通过边框颜色深浅区分嵌套层级
  - 第1层: `#404040`
  - 第2层: `#505050` 
  - 第3层: `#606060`
- **背景渐变**: 嵌套层级越深，背景色越浅，增强视觉层次

### 3. 视觉设计规范
#### 边框系统
- **默认边框**: 所有卡片都有1px实线边框
- **圆角统一**: 8px圆角半径，保持现代化外观
- **颜色层次**: 根据嵌套深度使用不同边框颜色

#### 间距系统
- **内边距**: 12px统一内边距
- **外边距**: 4px统一外边距
- **元素间距**: 8px内部元素间距
- **容器间歇**: 最小4px，最大8px容器边缘留白

#### 色彩系统
- **主背景**: `#2d2d2d` (深灰主色调)
- **嵌套背景**: `#333333` → `#3a3a3a` (渐层加深)
- **文本颜色**: `#ffffff` (主文本) / `#cccccc` (次要文本)
- **强调色**: `#FFC107` (选中/焦点状态)

### 4. 组件类型规范
#### 根级卡片
- **工具面板卡片**: UI操作控制区域
- **属性面板卡片**: 节点属性编辑区域
- **状态显示卡片**: 系统状态信息展示

#### 子级卡片
- **按钮卡片**: 包装所有按钮元素
- **输入卡片**: 包装表单输入元素  
- **信息卡片**: 包装显示信息元素

#### 统一外观要求
- **按钮一致性**: 同一卡片内的所有按钮必须具有相同的宽度、高度和样式
- **卡片一致性**: 同级卡片（如nodes卡片和workflow卡片）内容宽度应保持一致
- **间距统一**: 所有同类型元素使用相同的内边距和外边距
- **字体一致**: 同类型元素使用相同的字体大小和颜色
- **尺寸适中**: 卡片大小应根据内容自适应，避免过度撑大外层容器

### 5. 数据管理规范
#### 卡片数据存储
```typescript
private dataStore: Map<string, any> = new Map();

// 数据操作方法
public setData(key: string, value: any): void
public getData<T = any>(key: string): T | undefined  
public getAllData(): Record<string, any>
```

#### 数据事件系统
- **数据变更事件**: 卡片数据修改时触发`cardDataChange`事件
- **事件隔离**: 卡片间通过事件系统通信，避免直接数据依赖
- **生命周期管理**: 卡片销毁时自动清理数据和事件监听器

### 6. 实现示例
```typescript
// 创建卡片
const propertyCard = new Card({
  id: 'node-properties',
  title: 'Node Properties', 
  className: 'property-panel',
  centered: true,
  bordered: true
});

// 添加子卡片
const titleCard = new Card({
  id: 'title-input',
  title: 'Title',
  className: 'input-card'
});

propertyCard.addChild(titleCard);

// 数据管理
propertyCard.setData('nodeId', 'action-001');
propertyCard.setData('nodeType', 'Action');
```

这种卡片化设计确保了UI的**一致性**、**可维护性**和**可扩展性**，同时提供了优雅的用户体验。
