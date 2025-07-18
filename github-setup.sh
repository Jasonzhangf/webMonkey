#!/bin/bash

# GitHub Repository Setup Script for Web Automation Orchestrator
# GitHub 仓库设置脚本

echo "🐙 GitHub 仓库设置"
echo "=================="

# 检查是否已经初始化 Git
if [ ! -d ".git" ]; then
    echo "❌ Git 仓库未初始化，请先运行 'git init'"
    exit 1
fi

# 检查是否有提交
if ! git log --oneline -n 1 &> /dev/null; then
    echo "❌ 没有找到 Git 提交，请先提交代码"
    echo "运行: git add . && git commit -m 'Initial commit'"
    exit 1
fi

# 检查 GitHub CLI
if command -v gh &> /dev/null; then
    echo "✅ 检测到 GitHub CLI"
    
    # 检查是否已登录
    if gh auth status &> /dev/null; then
        echo "✅ GitHub CLI 已登录"
        
        # 创建仓库
        echo "🚀 创建 GitHub 仓库..."
        gh repo create web-automation-orchestrator \
            --public \
            --description "动态网页操作自动化工具 - 综合性浏览器自动化平台" \
            --add-readme=false \
            --clone=false
        
        if [ $? -eq 0 ]; then
            echo "✅ GitHub 仓库创建成功"
            
            # 获取用户名
            USERNAME=$(gh api user --jq .login)
            REPO_URL="https://github.com/$USERNAME/web-automation-orchestrator.git"
            
            # 添加远程仓库
            echo "🔗 添加远程仓库..."
            git remote add origin "$REPO_URL"
            
            # 推送代码
            echo "📤 推送代码到 GitHub..."
            git push -u origin main
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "🎉 GitHub 仓库设置完成！"
                echo "📍 仓库地址: https://github.com/$USERNAME/web-automation-orchestrator"
                echo ""
            else
                echo "❌ 推送失败，请检查网络连接"
            fi
        else
            echo "❌ 仓库创建失败，可能仓库名已存在"
        fi
    else
        echo "❌ GitHub CLI 未登录"
        echo "请运行: gh auth login"
        exit 1
    fi
else
    echo "⚠️  未检测到 GitHub CLI"
    echo ""
    echo "请选择以下方式之一："
    echo ""
    echo "方法1: 安装 GitHub CLI (推荐)"
    echo "macOS: brew install gh"
    echo "然后运行: gh auth login"
    echo "最后重新运行此脚本"
    echo ""
    echo "方法2: 手动创建仓库"
    echo "1. 访问 https://github.com/new"
    echo "2. 仓库名称: web-automation-orchestrator"
    echo "3. 描述: 动态网页操作自动化工具 - 综合性浏览器自动化平台"
    echo "4. 选择 Public"
    echo "5. 不要初始化 README (我们已经有了)"
    echo "6. 创建后，复制仓库 URL"
    echo "7. 运行以下命令:"
    echo ""
    echo "   git remote add origin <你的仓库URL>"
    echo "   git push -u origin main"
    echo ""
fi