#!/usr/bin/env python3
"""
服务器运行脚本
从backend目录运行，解决相对导入问题
"""

import os
import sys
import subprocess
import time
from pathlib import Path

PORT = 18888

def kill_port_process(port):
    """杀掉占用端口的进程"""
    print(f"检查端口 {port} 占用情况...")
    
    try:
        result = subprocess.run(['lsof', '-ti', f':{port}'], 
                              capture_output=True, text=True)
        
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                if pid:
                    print(f"杀掉进程 {pid} (占用端口 {port})")
                    subprocess.run(['kill', '-9', pid])
            time.sleep(1)
            print(f"端口 {port} 已清理")
        else:
            print(f"端口 {port} 未被占用")
            
    except Exception as e:
        print(f"清理端口时出错: {e}")

def start_server():
    """启动服务器"""
    print(f"启动服务器在端口 {PORT}...")
    
    # 确保在backend目录中
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # 添加src目录到Python路径
    src_path = backend_dir / "src"
    if str(src_path) not in sys.path:
        sys.path.insert(0, str(src_path))
    
    try:
        # 使用python -m 运行模块
        subprocess.run([sys.executable, '-m', 'uvicorn', 'src.main:app', 
                       '--host', '0.0.0.0', '--port', str(PORT), '--reload'])
        return True
    except KeyboardInterrupt:
        print("\n服务器已停止")
        return True
    except Exception as e:
        print(f"启动服务器失败: {e}")
        return False

def main():
    print("=" * 50)
    print("Web Automation Orchestrator 后端服务器")
    print(f"端口: {PORT}")
    print("=" * 50)
    
    # 清理端口
    kill_port_process(PORT)
    
    # 启动服务器
    print("\n" + "=" * 40)
    print("准备启动服务器...")
    print("按 Ctrl+C 停止服务器")
    print("=" * 40)
    
    if not start_server():
        sys.exit(1)

if __name__ == "__main__":
    main()