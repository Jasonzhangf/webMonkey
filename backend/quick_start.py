#!/usr/bin/env python3
"""
快速启动脚本 - 简单版本
检查端口占用，杀掉进程，启动服务器
"""

import os
import sys
import subprocess
import time

PORT = 18888

def kill_port_process(port):
    """杀掉占用端口的进程"""
    try:
        # 查找占用端口的进程
        result = subprocess.run(['lsof', '-ti', f':{port}'], 
                              capture_output=True, text=True)
        
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                if pid:
                    print(f"杀掉进程 {pid} (占用端口 {port})")
                    subprocess.run(['kill', '-9', pid])
            time.sleep(1)
            return True
    except Exception as e:
        print(f"清理端口时出错: {e}")
    return False

def start_server():
    """启动服务器"""
    print(f"启动服务器在端口 {PORT}...")
    
    # 切换到backend目录
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # 启动服务器
    subprocess.run([sys.executable, 'src/main.py'])

def main():
    print("=" * 40)
    print("快速启动后端服务器")
    print(f"端口: {PORT}")
    print("=" * 40)
    
    # 清理端口
    print("清理端口占用...")
    kill_port_process(PORT)
    
    # 启动服务器
    start_server()

if __name__ == "__main__":
    main()