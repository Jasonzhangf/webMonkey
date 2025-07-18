"""
State Manager Service
状态管理服务
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class StateManager:
    """Manages application state and persistence"""
    
    def __init__(self):
        self.state: Dict[str, Any] = {}
        self.initialized = False
        self.ready = False
    
    async def initialize(self) -> None:
        """Initialize state manager"""
        if self.initialized:
            return
            
        logger.info("Initializing State Manager...")
        
        try:
            # Initialize state storage
            self.state = {
                'workflows': {},
                'tasks': {},
                'browser_handles': {},
                'connections': {},
                'system_status': {
                    'started_at': datetime.now().isoformat(),
                    'version': '1.0.0',
                    'status': 'initializing'
                }
            }
            
            self.initialized = True
            self.ready = True
            
            # Update system status
            self.state['system_status']['status'] = 'running'
            
            logger.info("State Manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize State Manager: {e}")
            raise
    
    async def cleanup(self) -> None:
        """Cleanup state manager"""
        if not self.initialized:
            return
            
        logger.info("Cleaning up State Manager...")
        
        try:
            # Update system status
            if 'system_status' in self.state:
                self.state['system_status']['status'] = 'shutting_down'
            
            # Clear state
            self.state.clear()
            self.ready = False
            self.initialized = False
            
            logger.info("State Manager cleaned up successfully")
            
        except Exception as e:
            logger.error(f"Error during State Manager cleanup: {e}")
    
    def is_ready(self) -> bool:
        """Check if state manager is ready"""
        return self.ready
    
    def get_state(self, key: str) -> Optional[Any]:
        """Get state value by key"""
        return self.state.get(key)
    
    def set_state(self, key: str, value: Any) -> None:
        """Set state value by key"""
        self.state[key] = value
    
    def update_state(self, key: str, updates: Dict[str, Any]) -> None:
        """Update state with partial data"""
        if key not in self.state:
            self.state[key] = {}
        
        if isinstance(self.state[key], dict):
            self.state[key].update(updates)
        else:
            self.state[key] = updates
    
    def delete_state(self, key: str) -> bool:
        """Delete state by key"""
        if key in self.state:
            del self.state[key]
            return True
        return False
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get system status"""
        return self.state.get('system_status', {})
    
    def get_all_state(self) -> Dict[str, Any]:
        """Get all state data"""
        return self.state.copy()