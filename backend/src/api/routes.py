"""
API Routes for Web Automation Orchestrator
API路由定义
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from ..models.workflow import WorkflowCreate, WorkflowResponse, WorkflowUpdate
from ..models.task import TaskCreate, TaskResponse
from ..services.workflow_service import WorkflowService
from ..services.task_service import TaskService

router = APIRouter()

# Dependency injection
def get_workflow_service() -> WorkflowService:
    return WorkflowService()

def get_task_service() -> TaskService:
    return TaskService()

# ============================================================================
# Workflow Management Routes
# ============================================================================

@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(
    workflow: WorkflowCreate,
    service: WorkflowService = Depends(get_workflow_service)
) -> WorkflowResponse:
    """Create a new workflow"""
    try:
        return await service.create_workflow(workflow)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/workflows", response_model=List[WorkflowResponse])
async def list_workflows(
    skip: int = 0,
    limit: int = 100,
    service: WorkflowService = Depends(get_workflow_service)
) -> List[WorkflowResponse]:
    """List all workflows"""
    try:
        return await service.list_workflows(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    service: WorkflowService = Depends(get_workflow_service)
) -> WorkflowResponse:
    """Get a specific workflow"""
    try:
        workflow = await service.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return workflow
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdate,
    service: WorkflowService = Depends(get_workflow_service)
) -> WorkflowResponse:
    """Update a workflow"""
    try:
        workflow = await service.update_workflow(workflow_id, workflow_update)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return workflow
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    service: WorkflowService = Depends(get_workflow_service)
) -> dict:
    """Delete a workflow"""
    try:
        success = await service.delete_workflow(workflow_id)
        if not success:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return {"message": "Workflow deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Task Management Routes
# ============================================================================

@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    service: TaskService = Depends(get_task_service)
) -> TaskResponse:
    """Create a new task"""
    try:
        return await service.create_task(task)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(
    workflow_id: Optional[str] = None,
    state: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    service: TaskService = Depends(get_task_service)
) -> List[TaskResponse]:
    """List tasks with optional filtering"""
    try:
        return await service.list_tasks(
            workflow_id=workflow_id,
            state=state,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    service: TaskService = Depends(get_task_service)
) -> TaskResponse:
    """Get a specific task"""
    try:
        task = await service.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/{task_id}/execute")
async def execute_task(
    task_id: str,
    service: TaskService = Depends(get_task_service)
) -> dict:
    """Execute a task"""
    try:
        success = await service.execute_task(task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"message": "Task execution started"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/{task_id}/stop")
async def stop_task(
    task_id: str,
    service: TaskService = Depends(get_task_service)
) -> dict:
    """Stop a running task"""
    try:
        success = await service.stop_task(task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found or not running")
        return {"message": "Task stopped successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    service: TaskService = Depends(get_task_service)
) -> dict:
    """Delete a task"""
    try:
        success = await service.delete_task(task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# System Status Routes
# ============================================================================

@router.get("/status")
async def get_system_status() -> dict:
    """Get system status"""
    return {
        "status": "running",
        "version": "1.0.0",
        "components": {
            "api": "healthy",
            "websocket": "healthy",
            "database": "healthy"
        }
    }


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint"""
    return {"status": "healthy"}