#!/bin/bash

# 安装依赖
echo "安装依赖..."
npm install

# 创建符号链接，使测试页面可以通过HTTP访问
echo "创建符号链接..."
mkdir -p public
ln -sf ../test-page.html public/index.html

# 启动测试服务器
echo "启动测试服务器..."
echo "测试控制台: http://localhost:8765"
echo "测试页面: http://localhost:8765/test-page"
echo "按Ctrl+C停止服务器"
node test-server.js