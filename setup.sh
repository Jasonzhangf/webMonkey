#!/bin/bash

# Web Automation Orchestrator Setup Script
# 项目初始化脚本

echo "🚀 Web Automation Orchestrator 项目初始化"
echo "=========================================="

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18.0+"
    exit 1
fi

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装 Python 3.8+"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ 环境检查通过"

# 创建存储目录
echo "📁 创建存储目录..."
mkdir -p storage/{workflows,cookies,logs,profiles}

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ 前端依赖安装失败"
    exit 1
fi
cd ..

# 安装插件依赖
echo "📦 安装插件依赖..."
cd plugin
npm install
if [ $? -ne 0 ]; then
    echo "❌ 插件依赖安装失败"
    exit 1
fi
cd ..

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
python3 -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败"
    exit 1
fi
cd ..

# 创建环境配置文件
echo "⚙️  创建环境配置..."
if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
# Web Automation Orchestrator Environment Configuration

# Server Settings
HOST=localhost
PORT=8000
DEBUG=true

# Database Settings
DATABASE_URL=sqlite:///./storage/web_automation.db

# WebSocket Settings
WEBSOCKET__HOST=localhost
WEBSOCKET__PORT=8765

# Security Settings
JWT_SECRET=your-secret-key-change-in-production
ENABLE_AUTH=false

# Storage Paths
STORAGE_PATH=./storage
WORKFLOW_STORAGE_PATH=./storage/workflows
COOKIE_STORAGE_PATH=./storage/cookies
LOG_STORAGE_PATH=./storage/logs

# Camoufox Settings
CAMOUFOX_BINARY_PATH=
CAMOUFOX_PROFILE_PATH=./storage/profiles
MAX_BROWSER_INSTANCES=5
BROWSER_TIMEOUT=30

# Task Execution Settings
MAX_CONCURRENT_TASKS=3
TASK_TIMEOUT=300
RETRY_ATTEMPTS=3
RETRY_DELAY=5
EOF
    echo "✅ 创建了 backend/.env 配置文件"
else
    echo "ℹ️  backend/.env 配置文件已存在"
fi

echo ""
echo "🎉 项目初始化完成！"
echo ""
echo "📋 下一步操作："
echo "1. 启动后端服务: cd backend && python -m src.main"
echo "2. 启动前端开发: cd frontend && npm run dev"
echo "3. 构建浏览器插件: cd plugin && npm run build:dev"
echo ""
echo "📚 更多信息请查看 README.md"