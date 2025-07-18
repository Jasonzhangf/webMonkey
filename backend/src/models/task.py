"""
Task data models
任务数据模型
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TaskState(str, Enum):
    """Task execution states"""
    WAITING = "waiting"
    EXECUTING = "executing"
    ERROR = "error"
    COMPLETED = "completed"


class TriggerType(str, Enum):
    """Task trigger types"""
    MANUAL = "manual"
    SCHEDULED = "scheduled"
    LOOP = "loop"


class TriggerConfig(BaseModel):
    """Task trigger configuration"""
    type: TriggerType = Field(..., description="Trigger type")
    cron_expression: Optional[str] = Field(None, description="Cron expression for scheduled triggers")
    loop_interval: Optional[int] = Field(None, description="Loop interval in seconds")
    max_executions: Optional[int] = Field(None, description="Maximum number of executions")


class TaskBase(BaseModel):
    """Base task model"""
    workflow_id: str = Field(..., description="Associated workflow ID")
    trigger_config: TriggerConfig = Field(..., description="Trigger configuration")


class TaskCreate(TaskBase):
    """Task creation model"""
    pass


class TaskUpdate(BaseModel):
    """Task update model"""
    trigger_config: Optional[TriggerConfig] = Field(None, description="Trigger configuration")
    state: Optional[TaskState] = Field(None, description="Task state")


class TaskResponse(TaskBase):
    """Task response model"""
    id: str = Field(..., description="Task ID")
    state: TaskState = Field(..., description="Current task state")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    execution_log: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list, 
        description="Execution log entries"
    )
    
    class Config:
        from_attributes = True


class TaskExecution(BaseModel):
    """Task execution details"""
    task_id: str = Field(..., description="Task ID")
    execution_id: str = Field(..., description="Execution ID")
    started_at: datetime = Field(..., description="Execution start time")
    completed_at: Optional[datetime] = Field(None, description="Execution completion time")
    status: TaskState = Field(..., description="Execution status")
    result: Optional[Dict[str, Any]] = Field(None, description="Execution result")
    error: Optional[str] = Field(None, description="Error message if failed")
    browser_handles: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description="Browser handles used during execution"
    )