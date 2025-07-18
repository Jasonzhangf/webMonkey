"""
Workflow data models
工作流数据模型
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class WorkflowBase(BaseModel):
    """Base workflow model"""
    name: str = Field(..., description="Workflow name")
    description: Optional[str] = Field(None, description="Workflow description")
    tags: List[str] = Field(default_factory=list, description="Workflow tags")


class WorkflowCreate(WorkflowBase):
    """Workflow creation model"""
    workflow_data: Dict[str, Any] = Field(..., description="Canvas workflow JSON data")


class WorkflowUpdate(BaseModel):
    """Workflow update model"""
    name: Optional[str] = Field(None, description="Workflow name")
    description: Optional[str] = Field(None, description="Workflow description")
    tags: Optional[List[str]] = Field(None, description="Workflow tags")
    workflow_data: Optional[Dict[str, Any]] = Field(None, description="Canvas workflow JSON data")


class WorkflowResponse(WorkflowBase):
    """Workflow response model"""
    id: str = Field(..., description="Workflow ID")
    workflow_data: Dict[str, Any] = Field(..., description="Canvas workflow JSON data")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True


class WorkflowExecution(BaseModel):
    """Workflow execution data"""
    workflow_id: str = Field(..., description="Workflow ID")
    execution_config: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Execution configuration"
    )
    headless: bool = Field(default=True, description="Run in headless mode")
    timeout_seconds: int = Field(default=300, description="Execution timeout")
    error_handling: str = Field(
        default="stop", 
        description="Error handling strategy",
        regex="^(stop|continue|retry)$"
    )