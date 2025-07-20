#!/usr/bin/env python3
"""
最小化启动脚本
只安装核心依赖，快速启动服务器
"""

import os
import sys
import subprocess
import time
from pathlib import Path

PORT = 18888
SERVER_SCRIPT = "src/main.py"
REQUIREMENTS_FILE = "requirements_minimal.txt"

def run_command(cmd, cwd=None, check=True):
    """运行命令并返回结果"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, 
                              capture_output=True, text=True, check=check)
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stdout, e.stderr

def install_minimal_dependencies():
    """安装最小化依赖"""
    print("安装核心依赖...")
    
    # 使用--user安装，避免虚拟环境问题
    success, stdout, stderr = run_command(
        f"pip3 install --user -r {REQUIREMENTS_FILE}"
    )
    
    if not success:
        print(f"依赖安装失败: {stderr}")
        print("尝试使用--break-system-packages...")
        
        # 尝试使用--break-system-packages
        success, stdout, stderr = run_command(
            f"pip3 install --break-system-packages -r {REQUIREMENTS_FILE}"
        )
        
        if not success:
            print(f"依赖安装仍然失败: {stderr}")
            return False
    
    print("核心依赖安装完成")
    return True

def kill_port_process(port):
    """杀掉占用端口的进程"""
    print(f"检查端口 {port} 占用情况...")
    
    try:
        success, stdout, stderr = run_command(f"lsof -ti:{port}", check=False)
        
        if success and stdout.strip():
            pids = stdout.strip().split('\n')
            for pid in pids:
                if pid:
                    print(f"杀掉进程 {pid} (占用端口 {port})")
                    run_command(f"kill -9 {pid}", check=False)
            time.sleep(1)
            print(f"端口 {port} 已清理")
        else:
            print(f"端口 {port} 未被占用")
            
    except Exception as e:
        print(f"清理端口时出错: {e}")

def start_server():
    """启动服务器"""
    backend_dir = Path(__file__).parent
    server_path = backend_dir / SERVER_SCRIPT
    
    print(f"启动服务器在端口 {PORT}...")
    
    # 检查服务器脚本是否存在
    if not server_path.exists():
        print(f"错误: 找不到服务器脚本 {server_path}")
        return False
    
    try:
        # 启动服务器
        os.chdir(backend_dir)
        subprocess.run([sys.executable, str(SERVER_SCRIPT)])
        return True
    except KeyboardInterrupt:
        print("\n服务器已停止")
        return True
    except Exception as e:
        print(f"启动服务器失败: {e}")
        return False

def main():
    print("=" * 50)
    print("最小化后端启动脚本")
    print(f"端口: {PORT}")
    print("=" * 50)
    
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # 1. 安装最小依赖
    if not install_minimal_dependencies():
        print("依赖安装失败，尝试直接启动...")
    
    # 2. 清理端口
    kill_port_process(PORT)
    
    # 3. 启动服务器
    print("\n" + "=" * 40)
    print("准备启动服务器...")
    print("按 Ctrl+C 停止服务器")
    print("=" * 40)
    
    if not start_server():
        sys.exit(1)

if __name__ == "__main__":
    main()