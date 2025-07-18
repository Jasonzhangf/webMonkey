"""
Workflow Service
工作流服务
"""

import logging
from typing import List, Optional
from datetime import datetime
import uuid

from ..models.workflow import WorkflowCreate, WorkflowResponse, WorkflowUpdate

logger = logging.getLogger(__name__)


class WorkflowService:
    """Service for managing workflows"""
    
    def __init__(self):
        # In-memory storage for now (will be replaced with database in later stages)
        self.workflows: dict = {}
    
    async def create_workflow(self, workflow: WorkflowCreate) -> WorkflowResponse:
        """Create a new workflow"""
        workflow_id = str(uuid.uuid4())
        now = datetime.now()
        
        workflow_data = {
            'id': workflow_id,
            'name': workflow.name,
            'description': workflow.description,
            'tags': workflow.tags,
            'workflow_data': workflow.workflow_data,
            'created_at': now,
            'updated_at': now
        }
        
        self.workflows[workflow_id] = workflow_data
        
        logger.info(f"Created workflow: {workflow_id}")
        return WorkflowResponse(**workflow_data)
    
    async def get_workflow(self, workflow_id: str) -> Optional[WorkflowResponse]:
        """Get workflow by ID"""
        workflow_data = self.workflows.get(workflow_id)
        if workflow_data:
            return WorkflowResponse(**workflow_data)
        return None
    
    async def list_workflows(self, skip: int = 0, limit: int = 100) -> List[WorkflowResponse]:
        """List workflows with pagination"""
        workflows = list(self.workflows.values())
        workflows.sort(key=lambda x: x['created_at'], reverse=True)
        
        paginated = workflows[skip:skip + limit]
        return [WorkflowResponse(**workflow) for workflow in paginated]
    
    async def update_workflow(self, workflow_id: str, workflow_update: WorkflowUpdate) -> Optional[WorkflowResponse]:
        """Update workflow"""
        if workflow_id not in self.workflows:
            return None
        
        workflow_data = self.workflows[workflow_id]
        
        # Update fields
        if workflow_update.name is not None:
            workflow_data['name'] = workflow_update.name
        if workflow_update.description is not None:
            workflow_data['description'] = workflow_update.description
        if workflow_update.tags is not None:
            workflow_data['tags'] = workflow_update.tags
        if workflow_update.workflow_data is not None:
            workflow_data['workflow_data'] = workflow_update.workflow_data
        
        workflow_data['updated_at'] = datetime.now()
        
        logger.info(f"Updated workflow: {workflow_id}")
        return WorkflowResponse(**workflow_data)
    
    async def delete_workflow(self, workflow_id: str) -> bool:
        """Delete workflow"""
        if workflow_id in self.workflows:
            del self.workflows[workflow_id]
            logger.info(f"Deleted workflow: {workflow_id}")
            return True
        return False