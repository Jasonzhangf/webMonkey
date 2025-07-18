"""
Task Service
任务服务
"""

import logging
from typing import List, Optional
from datetime import datetime
import uuid

from ..models.task import TaskCreate, TaskResponse, TaskState, TaskUpdate

logger = logging.getLogger(__name__)


class TaskService:
    """Service for managing tasks"""
    
    def __init__(self):
        # In-memory storage for now (will be replaced with database in later stages)
        self.tasks: dict = {}
    
    async def create_task(self, task: TaskCreate) -> TaskResponse:
        """Create a new task"""
        task_id = str(uuid.uuid4())
        now = datetime.now()
        
        task_data = {
            'id': task_id,
            'workflow_id': task.workflow_id,
            'trigger_config': task.trigger_config,
            'state': TaskState.WAITING,
            'created_at': now,
            'updated_at': now,
            'execution_log': []
        }
        
        self.tasks[task_id] = task_data
        
        logger.info(f"Created task: {task_id}")
        return TaskResponse(**task_data)
    
    async def get_task(self, task_id: str) -> Optional[TaskResponse]:
        """Get task by ID"""
        task_data = self.tasks.get(task_id)
        if task_data:
            return TaskResponse(**task_data)
        return None
    
    async def list_tasks(
        self, 
        workflow_id: Optional[str] = None,
        state: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[TaskResponse]:
        """List tasks with optional filtering"""
        tasks = list(self.tasks.values())
        
        # Apply filters
        if workflow_id:
            tasks = [t for t in tasks if t['workflow_id'] == workflow_id]
        if state:
            tasks = [t for t in tasks if t['state'] == state]
        
        # Sort by creation time
        tasks.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Apply pagination
        paginated = tasks[skip:skip + limit]
        return [TaskResponse(**task) for task in paginated]
    
    async def update_task(self, task_id: str, task_update: TaskUpdate) -> Optional[TaskResponse]:
        """Update task"""
        if task_id not in self.tasks:
            return None
        
        task_data = self.tasks[task_id]
        
        # Update fields
        if task_update.trigger_config is not None:
            task_data['trigger_config'] = task_update.trigger_config
        if task_update.state is not None:
            task_data['state'] = task_update.state
        
        task_data['updated_at'] = datetime.now()
        
        logger.info(f"Updated task: {task_id}")
        return TaskResponse(**task_data)
    
    async def execute_task(self, task_id: str) -> bool:
        """Execute a task"""
        if task_id not in self.tasks:
            return False
        
        task_data = self.tasks[task_id]
        task_data['state'] = TaskState.EXECUTING
        task_data['updated_at'] = datetime.now()
        
        # Add execution log entry
        task_data['execution_log'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'execution_started',
            'message': 'Task execution initiated'
        })
        
        logger.info(f"Started execution of task: {task_id}")
        return True
    
    async def stop_task(self, task_id: str) -> bool:
        """Stop a running task"""
        if task_id not in self.tasks:
            return False
        
        task_data = self.tasks[task_id]
        if task_data['state'] != TaskState.EXECUTING:
            return False
        
        task_data['state'] = TaskState.WAITING
        task_data['updated_at'] = datetime.now()
        
        # Add execution log entry
        task_data['execution_log'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'execution_stopped',
            'message': 'Task execution stopped by user'
        })
        
        logger.info(f"Stopped execution of task: {task_id}")
        return True
    
    async def delete_task(self, task_id: str) -> bool:
        """Delete task"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            logger.info(f"Deleted task: {task_id}")
            return True
        return False