#!/bin/bash

# 后端服务器启动脚本
# 监控端口占用，自动杀掉占用进程并重启服务器

PORT=18888
SERVER_SCRIPT="src/main.py"

echo "=================================="
echo "后端服务器监控启动脚本"
echo "监控端口: $PORT"
echo "=================================="

# 函数：杀掉占用端口的进程
kill_port_process() {
    local port=$1
    echo "检查端口 $port 占用情况..."
    
    # 查找占用端口的进程
    local pid=$(lsof -ti:$port)
    
    if [ ! -z "$pid" ]; then
        echo "发现进程 $pid 占用端口 $port，正在终止..."
        kill -TERM $pid 2>/dev/null
        
        # 等待进程结束
        sleep 2
        
        # 检查进程是否还在运行
        if kill -0 $pid 2>/dev/null; then
            echo "进程未响应，强制杀掉..."
            kill -KILL $pid 2>/dev/null
        fi
        
        echo "端口 $port 已释放"
        return 0
    else
        echo "端口 $port 未被占用"
        return 1
    fi
}

# 函数：启动服务器
start_server() {
    echo "启动服务器..."
    cd "$(dirname "$0")"
    
    if [ ! -f "$SERVER_SCRIPT" ]; then
        echo "错误: 找不到服务器脚本 $SERVER_SCRIPT"
        exit 1
    fi
    
    python3 $SERVER_SCRIPT &
    local server_pid=$!
    echo "服务器已启动，PID: $server_pid"
    return $server_pid
}

# 函数：检查服务器是否运行
check_server() {
    local port=$1
    curl -s "http://localhost:$port/health" > /dev/null 2>&1
    return $?
}

# 主循环
main() {
    # 初始清理
    kill_port_process $PORT
    sleep 1
    
    # 启动服务器
    start_server
    local server_pid=$!
    
    echo "开始监控服务器状态..."
    
    while true; do
        sleep 5
        
        # 检查服务器是否还在运行
        if ! kill -0 $server_pid 2>/dev/null; then
            echo "服务器进程已退出，重新启动..."
            kill_port_process $PORT
            sleep 1
            start_server
            server_pid=$!
        else
            # 检查端口是否正常响应
            if check_server $PORT; then
                echo "$(date): 服务器运行正常 (PID: $server_pid)"
            else
                echo "$(date): 服务器无响应，重启中..."
                kill $server_pid 2>/dev/null
                kill_port_process $PORT
                sleep 2
                start_server
                server_pid=$!
            fi
        fi
    done
}

# 捕获中断信号
trap 'echo "收到中断信号，正在关闭..."; kill_port_process $PORT; exit 0' INT TERM

# 运行主程序
main