# 网页自动化编排系统

## 功能特性 (FEATURE)

### 核心目标
构建一个自适应的网页自动化系统，包含两个核心部分：

1. **后端大脑** - 负责流程控制、数据管理和大模型交互
2. **前端浏览器** - 通过插件访问网页并与后端通信交互

### 主要功能

#### 1. 浏览器插件系统
- **元素捕获** - 用户点击页面元素，系统自动捕获多种选择器
- **操作定义** - 支持点击、输入、提取等多种操作类型
- **实时交互** - 与后端服务器实时通信，支持操作预览和验证

#### 2. 可视化编排界面
- **Canvas节点编辑器** - 拖拽式工作流编排
- **万能操作节点** - 支持复杂的操作子定义
- **浏览器句柄传递** - 节点间状态和数据传递

#### 3. 操作子体系
- **观察+动作模式** - 每个操作包含观察步骤和动作步骤
- **条件判断和循环** - 支持复杂的逻辑控制
- **原子化操作** - 可组合、可复用的操作单元

#### 4. 后端执行引擎
- **任务状态机** - 完整的任务生命周期管理
- **Camoufox实例池** - 多浏览器实例并发执行
- **Cookie自动化管理** - 按域名+时间戳自动管理登录状态

#### 5. 独立执行器
- **无头模式运行** - 支持后台自动化执行
- **REST API控制** - 完整的API接口
- **MCP协议支持** - 可作为MCP服务使用

## 示例场景 (EXAMPLES)

### 示例1: 电商数据采集
```typescript
// 操作序列示例
const workflow = {
  nodes: [
    {
      type: "universal_action",
      operations: [
        {
          observation: { type: "element_exists", target: ".product-list" },
          action: { type: "scroll", parameters: { direction: "down" } }
        },
        {
          observation: { type: "element_exists", target: ".product-item" },
          action: { type: "extract", parameters: { fields: ["title", "price"] } }
        }
      ]
    }
  ]
};
```

### 示例2: 表单自动填写
```typescript
const formWorkflow = {
  operations: [
    {
      observation: { type: "element_exists", target: "#username" },
      action: { type: "input", parameters: { value: "user@example.com" } }
    },
    {
      observation: { type: "element_exists", target: "#password" },
      action: { type: "input", parameters: { value: "password123" } }
    },
    {
      observation: { type: "element_exists", target: "#login-btn" },
      action: { type: "click", parameters: {} }
    }
  ]
};
```

### 示例3: 条件判断流程
```typescript
const conditionalWorkflow = {
  operations: [
    {
      observation: { type: "text_contains", target: ".status", expected_value: "success" },
      action: { type: "click", target: ".continue-btn" },
      condition: {
        type: "if",
        true_branch: [/* 成功分支操作 */],
        false_branch: [/* 失败分支操作 */]
      }
    }
  ]
};
```

## 技术文档 (DOCUMENTATION)

### 核心技术栈
- **后端**: Python + FastAPI + SQLAlchemy + WebSocket
- **前端**: TypeScript + Canvas API + WebSocket
- **插件**: Chrome Extension API + TypeScript
- **浏览器**: Camoufox (Firefox-based automation browser)

### 关键接口文档
- `shared/types.ts` - 核心数据类型定义
- `shared/communication.ts` - 通信协议定义
- `backend/src/api/routes.py` - REST API接口
- `plugin/src/content/content.ts` - 插件核心功能

### 架构设计文档
- `.kiro/specs/web-automation-orchestrator/design.md` - 详细架构设计
- `.kiro/specs/web-automation-orchestrator/requirements.md` - 需求规格说明

## 其他考虑事项 (OTHER CONSIDERATIONS)

### 开发约束
1. **文件大小限制** - 单个文件不超过500行代码
2. **原子化设计** - 所有模块自包含、可移植
3. **最小依赖** - 每个组件只依赖必要的外部库
4. **类型安全** - 所有函数必须有完整的类型注解

### 性能要求
- 支持大量元素的页面操作
- 多浏览器实例并发执行
- 实时通信延迟控制在100ms以内
- 内存使用优化，避免内存泄漏

### 安全考虑
- 输入验证和XSS防护
- Cookie和敏感数据加密存储
- 局域网访问的权限控制
- 浏览器实例隔离

### 用户体验
- 直观的可视化编排界面
- 实时的操作预览和反馈
- 详细的错误提示和恢复建议
- 支持操作的撤销和重做

### 部署和集成
- 支持独立部署和局域网访问
- 提供完整的REST API接口
- 支持MCP协议集成
- 配置文件和环境变量管理

### 常见陷阱
- **元素定位失效** - 需要多重备用选择器策略
- **页面加载时序** - 需要智能等待和重试机制
- **内存泄漏** - 浏览器实例和WebSocket连接需要正确清理
- **跨域通信** - 插件与后端通信的安全策略
- **并发控制** - 多实例执行时的资源竞争问题

### 测试策略
- 单元测试覆盖核心逻辑
- 集成测试验证组件协作
- 端到端测试模拟真实用户场景
- 性能测试确保系统稳定性