# Web Automation Orchestrator Architecture

## 项目架构概述

Web Automation Orchestrator 采用微服务架构，分为编排阶段和执行阶段，通过模块化设计实现复杂的网页自动化任务。

## 核心模块

### 1. Frontend (前端编排器)
- **位置**: `frontend/`
- **技术栈**: TypeScript + Canvas API
- **功能**: 
  - Canvas节点编排界面
  - 万能节点和基础功能节点
  - 工作流可视化编辑
  - 与插件的实时通信

### 2. Backend (后端服务)
- **位置**: `backend/`
- **技术栈**: Python + FastAPI
- **功能**:
  - RESTful API服务
  - WebSocket通信协调
  - 工作流存储管理
  - 任务状态管理

### 3. Plugin (浏览器插件)
- **位置**: `plugin/`
- **技术栈**: TypeScript + Web Extensions API
- **功能**:
  - 元素选择和高亮
  - 操作定义界面
  - 与编排器通信

### 4. Shared (共享模块)
- **位置**: `shared/`
- **技术栈**: TypeScript
- **功能**:
  - 核心数据类型定义
  - 通信协议接口
  - 系统常量定义

## 通信架构

```
Plugin <--WebSocket--> Backend <--WebSocket--> Frontend
   |                      |                       |
   |                   REST API                   |
   |                      |                       |
   +------ Chrome Extension API --------+        |
                                        |        |
                                    Executor <----+
```

## 数据流

1. **编排阶段**: Plugin → Backend → Frontend
2. **执行阶段**: Frontend → Backend → Executor → Camoufox

## 核心接口

### 通信协议
- `BaseMessage`: 基础消息接口
- `ElementData`: 元素数据结构
- `OperationUnit`: 操作单元定义
- `BrowserHandle`: 浏览器句柄管理

### 节点系统
- `NodeDefinition`: 节点定义接口
- `CanvasWorkflowJSON`: 工作流数据结构
- `NodeExecutionData`: 节点执行数据

### 任务管理
- `Task`: 任务数据模型
- `TaskState`: 任务状态枚举
- `ExecutionResult`: 执行结果接口

## 设计原则

1. **模块化**: 每个组件独立开发和部署
2. **可扩展**: 支持自定义节点和操作类型
3. **容错性**: 多层错误处理和恢复机制
4. **性能**: 异步处理和连接池管理
5. **安全性**: 权限控制和数据验证