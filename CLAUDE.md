# 网页自动化编排系统 - 开发指南

## 🎯 项目概述
这是一个自适应的网页自动化系统，包含两个核心部分：
1. **后端大脑** - 负责流程控制、数据管理和大模型交互
2. **前端浏览器** - 通过插件访问网页并与后端通信交互

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

### 代码结构
- **每个文件最多500行代码** - 超过时立即重构拆分
- **按功能职责组织模块** - 单一职责原则
- **使用清晰的导入语句** - 优先使用相对导入
- **所有函数必须有类型注解** - TypeScript和Python都要求

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
- **不要创建超过500行的文件**
- **不要在没有类型注解的情况下编写函数**
- **不要忽略错误处理**
- **不要创建紧耦合的模块**
- **不要在没有测试的情况下提交代码**

## 💡 开发提示
- **优先考虑用户体验** - 界面要直观易用
- **保持代码简洁** - 能用10行解决的不要写20行
- **文档和代码同步更新** - 修改功能时同步更新文档
- **性能优先** - 考虑大量元素和复杂工作流的性能