#!/usr/bin/env python3
"""
完整的设置和启动脚本
自动创建虚拟环境、安装依赖、清理端口、启动服务器
"""

import os
import sys
import subprocess
import time
import shutil
from pathlib import Path

PORT = 18888
SERVER_SCRIPT = "src/main.py"
REQUIREMENTS_FILE = "requirements.txt"
VENV_DIR = "venv"

def run_command(cmd, cwd=None, check=True):
    """运行命令并返回结果"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, 
                              capture_output=True, text=True, check=check)
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stdout, e.stderr

def setup_virtual_environment():
    """设置虚拟环境"""
    backend_dir = Path(__file__).parent
    venv_path = backend_dir / VENV_DIR
    
    print("设置Python虚拟环境...")
    
    # 如果虚拟环境已存在，询问是否重新创建
    if venv_path.exists():
        print("虚拟环境已存在，使用现有环境")
        return str(venv_path)
    
    # 创建虚拟环境
    print("创建虚拟环境...")
    success, stdout, stderr = run_command(f"python3 -m venv {VENV_DIR}", cwd=backend_dir)
    
    if not success:
        print(f"创建虚拟环境失败: {stderr}")
        return None
    
    print("虚拟环境创建成功")
    return str(venv_path)

def install_dependencies(venv_path):
    """在虚拟环境中安装依赖"""
    backend_dir = Path(__file__).parent
    pip_path = Path(venv_path) / "bin" / "pip"
    
    print("安装依赖...")
    
    # 升级pip
    success, _, stderr = run_command(f"{pip_path} install --upgrade pip", cwd=backend_dir)
    if not success:
        print(f"升级pip失败: {stderr}")
    
    # 安装依赖
    success, stdout, stderr = run_command(
        f"{pip_path} install -r {REQUIREMENTS_FILE}", 
        cwd=backend_dir
    )
    
    if not success:
        print(f"安装依赖失败: {stderr}")
        return False
    
    print("依赖安装完成")
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

def start_server(venv_path):
    """启动服务器"""
    backend_dir = Path(__file__).parent
    python_path = Path(venv_path) / "bin" / "python"
    server_path = backend_dir / SERVER_SCRIPT
    
    print(f"启动服务器在端口 {PORT}...")
    
    # 检查服务器脚本是否存在
    if not server_path.exists():
        print(f"错误: 找不到服务器脚本 {server_path}")
        return False
    
    try:
        # 启动服务器
        os.chdir(backend_dir)
        subprocess.run([str(python_path), str(SERVER_SCRIPT)])
        return True
    except KeyboardInterrupt:
        print("\n服务器已停止")
        return True
    except Exception as e:
        print(f"启动服务器失败: {e}")
        return False

def main():
    print("=" * 60)
    print("Web Automation Orchestrator 后端启动脚本")
    print(f"端口: {PORT}")
    print("=" * 60)
    
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # 1. 设置虚拟环境
    venv_path = setup_virtual_environment()
    if not venv_path:
        print("虚拟环境设置失败，退出")
        sys.exit(1)
    
    # 2. 安装依赖
    if not install_dependencies(venv_path):
        print("依赖安装失败，退出")
        sys.exit(1)
    
    # 3. 清理端口
    kill_port_process(PORT)
    
    # 4. 启动服务器
    print("\n" + "=" * 40)
    print("准备启动服务器...")
    print("按 Ctrl+C 停止服务器")
    print("=" * 40)
    
    if not start_server(venv_path):
        sys.exit(1)

if __name__ == "__main__":
    main()