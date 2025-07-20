#!/usr/bin/env python3
"""
智能启动脚本
自动检查依赖、清理端口、启动服务器
"""

import os
import sys
import subprocess
import time
import importlib.util

PORT = 18888
SERVER_SCRIPT = "src/main.py"
REQUIREMENTS_FILE = "requirements.txt"

def check_dependency(package_name):
    """检查Python包是否已安装"""
    spec = importlib.util.find_spec(package_name)
    return spec is not None

def install_dependencies():
    """安装依赖"""
    print("检查并安装依赖...")
    
    # 检查关键依赖
    key_deps = ['fastapi', 'uvicorn', 'sqlalchemy', 'websockets']
    missing_deps = [dep for dep in key_deps if not check_dependency(dep)]
    
    if missing_deps:
        print(f"缺少依赖: {', '.join(missing_deps)}")
        print("正在安装依赖...")
        
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', REQUIREMENTS_FILE], 
                         check=True)
            print("依赖安装完成")
            return True
        except subprocess.CalledProcessError as e:
            print(f"依赖安装失败: {e}")
            return False
    else:
        print("所有关键依赖已安装")
        return True

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
    
    # 检查服务器脚本是否存在
    if not os.path.exists(SERVER_SCRIPT):
        print(f"错误: 找不到服务器脚本 {SERVER_SCRIPT}")
        return False
    
    try:
        # 启动服务器
        subprocess.run([sys.executable, SERVER_SCRIPT])
        return True
    except KeyboardInterrupt:
        print("\n服务器已停止")
        return True
    except Exception as e:
        print(f"启动服务器失败: {e}")
        return False

def main():
    print("=" * 50)
    print("智能后端服务器启动脚本")
    print(f"端口: {PORT}")
    print("=" * 50)
    
    # 1. 安装依赖
    if not install_dependencies():
        print("依赖安装失败，退出")
        sys.exit(1)
    
    # 2. 清理端口
    print("清理端口占用...")
    kill_port_process(PORT)
    
    # 3. 启动服务器
    if not start_server():
        sys.exit(1)

if __name__ == "__main__":
    main()