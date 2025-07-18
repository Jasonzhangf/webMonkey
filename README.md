# Web Automation Orchestrator

动态网页操作自动化工具 - 一个综合性的浏览器自动化平台

## 项目概述

Web Automation Orchestrator 是一个创新的浏览器自动化平台，采用"编排阶段"和"执行阶段"分离的设计理念。用户可以通过可视化界面编排复杂的网页操作任务，支持多浏览器实例、智能状态管理、Cookie自动化管理，以及灵活的任务流程控制。

## 核心特性

- 🎨 **可视化编排**: 基于Canvas的拖拽式节点编排界面
- 🔌 **浏览器插件**: 直观的元素选择和操作定义
- 🤖 **智能执行**: 支持Camoufox的无头自动化执行
- 🔄 **状态管理**: 完整的任务状态机和生命周期管理
- 🍪 **Cookie管理**: 自动化的登录状态保持
- 🌐 **局域网支持**: 支持团队协作和远程访问
- 📡 **MCP协议**: 支持Model Context Protocol集成

## 项目结构

```
web-automation-orchestrator/
├── frontend/           # 前端模块 - Canvas编排器
│   ├── src/
│   │   ├── canvas/     # Canvas编辑器核心
│   │   ├── components/ # UI组件
│   │   ├── nodes/      # 节点定义和管理
│   │   └── utils/      # 工具函数
│   ├── package.json
│   └── tsconfig.json
├── backend/            # 后端模块 - Python服务
│   ├── src/
│   │   ├── api/        # REST API路由
│   │   ├── models/     # 数据模型
│   │   ├── services/   # 业务服务
│   │   └── utils/      # 工具函数
│   ├── requirements.txt
│   └── main.py
├── plugin/             # 浏览器插件模块
│   ├── src/
│   │   ├── background/ # 后台脚本
│   │   ├── content/    # 内容脚本
│   │   ├── popup/      # 弹窗界面
│   │   └── utils/      # 工具函数
│   ├── manifest.json
│   ├── package.json
│   └── tsconfig.json
├── shared/             # 共享类型定义和接口
│   ├── types.ts        # 核心数据类型
│   ├── communication.ts # 通信协议
│   └── constants.ts    # 系统常量
├── docs/               # 文档
│   └── architecture.md # 架构文档
└── README.md
```

## 核心组件

### 1. 前端编排器 (Frontend Orchestrator)
- **技术栈**: TypeScript + Canvas API
- **功能**: 
  - Canvas节点编排界面
  - 万能节点和基础功能节点
  - 工作流可视化编辑
  - 与插件的实时通信

### 2. 后端服务 (Backend Service)
- **技术栈**: Python 3.8+ + FastAPI
- **功能**:
  - RESTful API服务
  - WebSocket通信协调
  - 工作流存储管理
  - 任务状态管理

### 3. 浏览器插件 (Browser Extension)
- **技术栈**: TypeScript + Web Extensions API
- **功能**:
  - 元素选择和高亮
  - 操作定义界面
  - 与编排器实时通信

### 4. 执行器 (Executor)
- **技术栈**: Python + Camoufox
- **功能**:
  - 动态任务执行
  - 浏览器实例池管理
  - 无头模式执行

## 开发环境要求

- **Node.js**: 18.0+ (用于前端和插件开发)
- **Python**: 3.8+ (用于后端服务)
- **Camoufox**: 最新版本 (用于自动化执行)
- **Git**: 用于版本控制

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/web-automation-orchestrator.git
cd web-automation-orchestrator
```

### 2. 安装依赖

#### 前端依赖
```bash
cd frontend
npm install
```

#### 后端依赖
```bash
cd backend
pip install -r requirements.txt
```

#### 插件依赖
```bash
cd plugin
npm install
```

### 3. 启动开发环境

#### 启动后端服务
```bash
cd backend
python -m src.main
```

#### 启动前端开发服务器
```bash
cd frontend
npm run dev
```

#### 构建浏览器插件
```bash
cd plugin
npm run build:dev
```

## 架构设计

系统采用微服务架构，分为编排阶段和执行阶段：

- **编排阶段**: 使用用户现有浏览器进行任务设计和配置
- **执行阶段**: 使用独立的Camoufox实例进行无头自动化执行

详细架构信息请参考 [架构文档](docs/architecture.md)

## 开发进度

项目采用阶段性开发方式，当前进度：

- [x] 阶段1: 项目基础架构和核心接口 ✅
- [ ] 阶段2: 浏览器插件核心功能
- [ ] 阶段3: Canvas节点编排系统
- [ ] 阶段4: Python后端服务
- [ ] 阶段5: 任务状态机和执行器

详细任务列表请参考 [实现计划](.kiro/specs/web-automation-orchestrator/tasks.md)

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参考 [LICENSE](LICENSE) 文件

## 联系方式

- 项目链接: [https://github.com/your-username/web-automation-orchestrator](https://github.com/your-username/web-automation-orchestrator)
- 问题反馈: [Issues](https://github.com/your-username/web-automation-orchestrator/issues)