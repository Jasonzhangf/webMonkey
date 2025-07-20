#!/usr/bin/env python3
"""
后端服务器启动脚本
监控端口占用，自动杀掉占用进程并重启服务器
"""

import os
import sys
import time
import signal
import subprocess
import psutil
from pathlib import Path

# 配置
SERVER_PORT = 18888
SERVER_SCRIPT = "src/main.py"
CHECK_INTERVAL = 5  # 检查间隔（秒）

def find_process_by_port(port):
    """查找占用指定端口的进程"""
    for conn in psutil.net_connections():
        if conn.laddr.port == port and conn.status == psutil.CONN_LISTEN:
            try:
                process = psutil.Process(conn.pid)
                return process
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
    return None

def kill_process_by_port(port):
    """杀掉占用指定端口的进程"""
    process = find_process_by_port(port)
    if process:
        try:
            print(f"发现进程 {process.pid} ({process.name()}) 占用端口 {port}")
            print(f"正在终止进程...")
            
            # 尝试优雅关闭
            process.terminate()
            
            # 等待进程结束
            try:
                process.wait(timeout=5)
                print(f"进程 {process.pid} 已成功终止")
                return True
            except psutil.TimeoutExpired:
                # 强制杀掉
                print(f"进程 {process.pid} 未响应，强制杀掉...")
                process.kill()
                process.wait()
                print(f"进程 {process.pid} 已被强制终止")
                return True
                
        except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
            print(f"无法终止进程: {e}")
            return False
    return True

def start_server():
    """启动服务器"""
    print(f"启动服务器在端口 {SERVER_PORT}...")
    
    # 确保在backend目录中运行
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    try:
        # 启动服务器进程
        process = subprocess.Popen([
            sys.executable, SERVER_SCRIPT
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print(f"服务器已启动，PID: {process.pid}")
        return process
        
    except Exception as e:
        print(f"启动服务器失败: {e}")
        return None

def monitor_server():
    """监控服务器状态"""
    print(f"开始监控端口 {SERVER_PORT}...")
    server_process = None
    
    try:
        while True:
            # 检查端口是否被占用
            port_process = find_process_by_port(SERVER_PORT)
            
            if port_process:
                # 如果是我们的服务器进程，检查是否还在运行
                if server_process and server_process.pid == port_process.pid:
                    if server_process.poll() is None:
                        print(f"服务器运行正常 (PID: {server_process.pid})")
                    else:
                        print("服务器进程已退出，重新启动...")
                        server_process = start_server()
                else:
                    # 端口被其他进程占用，杀掉它
                    print(f"端口 {SERVER_PORT} 被其他进程占用")
                    if kill_process_by_port(SERVER_PORT):
                        time.sleep(2)  # 等待端口释放
                        server_process = start_server()
            else:
                # 端口未被占用，启动服务器
                if not server_process or server_process.poll() is not None:
                    print(f"端口 {SERVER_PORT} 空闲，启动服务器...")
                    server_process = start_server()
            
            time.sleep(CHECK_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n收到中断信号，正在关闭...")
        if server_process and server_process.poll() is None:
            print("正在关闭服务器...")
            server_process.terminate()
            try:
                server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server_process.kill()
        print("监控已停止")

def main():
    """主函数"""
    print("=" * 50)
    print("后端服务器监控启动脚本")
    print(f"监控端口: {SERVER_PORT}")
    print(f"服务器脚本: {SERVER_SCRIPT}")
    print("=" * 50)
    
    # 检查服务器脚本是否存在
    if not os.path.exists(SERVER_SCRIPT):
        print(f"错误: 找不到服务器脚本 {SERVER_SCRIPT}")
        sys.exit(1)
    
    # 首次清理端口
    print("初始化: 检查端口占用...")
    if kill_process_by_port(SERVER_PORT):
        time.sleep(2)
    
    # 开始监控
    monitor_server()

if __name__ == "__main__":
    main()