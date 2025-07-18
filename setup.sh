#!/bin/bash

# Web Automation Orchestrator Setup Script
# 项目初始化脚本

echo "🚀 Web Automation Orchestrator 项目初始化"
echo "=========================================="

# GitHub 仓库设置
echo "📋 GitHub 仓库设置说明"
echo "----------------------"
echo "请按照以下步骤创建 GitHub 仓库："
echo ""
echo "方法1: 使用 GitHub CLI (推荐)"
echo "1. 登录 GitHub CLI: gh auth login"
echo "2. 创建仓库: gh repo create web-automation-orchestrator --public --description '动态网页操作自动化工具 - 综合性浏览器自动化平台'"
echo "3. 推送代码: git push -u origin main"
echo ""
echo "方法2: 手动创建"
echo "1. 访问 https://github.com/new"
echo "2. 仓库名称: web-automation-orchestrator"
echo "3. 描述: 动态网页操作自动化工具 - 综合性浏览器自动化平台"
echo "4. 选择 Public"
echo "5. 不要初始化 README (我们已经有了)"
echo "6. 创建后，复制仓库 URL"
echo "7. 运行: git remote add origin <你的仓库URL>"
echo "8. 运行: git push -u origin main"
echo ""
read -p "是否继续项目环境设置? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "项目初始化已暂停。完成 GitHub 仓库设置后，请重新运行此脚本。"
    exit 0
fi
echo ""

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