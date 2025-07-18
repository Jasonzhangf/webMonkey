"""
Configuration Management
配置管理
"""

import os
from functools import lru_cache
from typing import List

from pydantic import BaseSettings


class WebSocketSettings(BaseSettings):
    """WebSocket configuration"""
    port: int = 8765
    host: str = "localhost"
    path: str = "/ws"
    heartbeat_interval: int = 30
    reconnect_attempts: int = 5
    reconnect_delay: int = 5


class DatabaseSettings(BaseSettings):
    """Database configuration"""
    url: str = "sqlite:///./web_automation.db"
    echo: bool = False
    pool_size: int = 5
    max_overflow: int = 10


class SecuritySettings(BaseSettings):
    """Security configuration"""
    enable_auth: bool = False
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    api_key_header: str = "X-API-Key"


class Settings(BaseSettings):
    """Main application settings"""
    # Server settings
    host: str = "localhost"
    port: int = 8000
    debug: bool = True
    
    # CORS settings
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # Component settings
    websocket: WebSocketSettings = WebSocketSettings()
    database: DatabaseSettings = DatabaseSettings()
    security: SecuritySettings = SecuritySettings()
    
    # File storage
    storage_path: str = "./storage"
    workflow_storage_path: str = "./storage/workflows"
    cookie_storage_path: str = "./storage/cookies"
    log_storage_path: str = "./storage/logs"
    
    # Camoufox settings
    camoufox_binary_path: str = ""
    camoufox_profile_path: str = "./storage/profiles"
    max_browser_instances: int = 5
    browser_timeout: int = 30
    
    # Task execution settings
    max_concurrent_tasks: int = 3
    task_timeout: int = 300
    retry_attempts: int = 3
    retry_delay: int = 5
    
    class Config:
        env_file = ".env"
        env_nested_delimiter = "__"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


def create_directories(settings: Settings) -> None:
    """Create necessary directories"""
    directories = [
        settings.storage_path,
        settings.workflow_storage_path,
        settings.cookie_storage_path,
        settings.log_storage_path,
        settings.camoufox_profile_path
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)