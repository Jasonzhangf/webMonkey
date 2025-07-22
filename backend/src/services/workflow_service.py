"""
Workflow Service
工作流服务
"""

import logging
import asyncio
from typing import List, Optional
from datetime import datetime
import uuid
from ..models.workflow import WorkflowCreate, WorkflowResponse, WorkflowUpdate
from .browser_service import BrowserService
from .communication_service import CommunicationService

logger = logging.getLogger(__name__)

class WorkflowService:
    """Service for managing workflows"""
    
    def __init__(self, browser_service: BrowserService, communication_service: CommunicationService):
        self.browser_service = browser_service
        self.communication_service = communication_service
        # In-memory storage for now
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

    async def execute_workflow(self, workflow_data: dict) -> str:
        """
        Execute a workflow based on the provided data.
        This is the main entry point for running a workflow.
        """
        execution_id = str(uuid.uuid4())
        logger.info(f"Executing workflow with execution ID: {execution_id}")

        page = await self.browser_service.get_page()
        
        nodes = workflow_data.get('nodes', [])
        connections = workflow_data.get('connections', [])
        
        sorted_nodes = self.sort_nodes_for_execution(nodes, connections)
        
        start_node = next((n for n in sorted_nodes if n['type'] == 'Start'), None)
        if start_node and 'url' in start_node.get('properties', {}):
            await page.goto(start_node['properties']['url'])
        else:
            logger.warning("No StartNode with URL found. Starting on a blank page.")

        for node_data in sorted_nodes:
            node_id = node_data['id']
            try:
                await self.communication_service.send_message_to_all({
                    'type': 'NODE_EXECUTION_UPDATE',
                    'payload': {'nodeId': node_id, 'state': 'running'}
                })

                if node_data['type'] == 'Action':
                    await self.execute_action_node(page, node_data)
                
                await self.communication_service.send_message_to_all({
                    'type': 'NODE_EXECUTION_UPDATE',
                    'payload': {'nodeId': node_id, 'state': 'completed'}
                })
            except Exception as e:
                logger.error(f"Error executing node {node_id}: {e}", exc_info=True)
                await self.communication_service.send_message_to_all({
                    'type': 'NODE_EXECUTION_UPDATE',
                    'payload': {'nodeId': node_id, 'state': 'failed', 'error': str(e)}
                })
                # Stop execution on failure
                break
        
        logger.info(f"Workflow execution {execution_id} completed.")
        await self.communication_service.send_message_to_all({
            'type': 'WORKFLOW_EXECUTION_COMPLETED',
            'payload': {'execution_id': execution_id, 'status': 'completed'}
        })

        await page.close()
        return execution_id

    async def execute_action_node(self, page, node_data):
        """Executes a single action node."""
        operation = node_data.get('properties', {}).get('operationUnit', {}).get('action', {})
        op_type = operation.get('type')
        selector_info = node_data.get('properties', {}).get('operationUnit', {}).get('observation', {}).get('target', {}).get('primary', {})
        selector = selector_info.get('value')
        
        if not op_type or not selector:
            logger.warning(f"Skipping action node {node_data['id']} due to missing operation type or selector.")
            return

        if op_type == 'click':
            await page.locator(selector).click()
        elif op_type == 'input':
            value = operation.get('target', {}).get('value', '')
            await page.locator(selector).fill(value)
        elif op_type == 'extract':
            # This would be more complex, involving data extraction and passing
            text_content = await page.locator(selector).text_content()
            logger.info(f"Extracted text from {selector}: {text_content}")
        else:
            logger.warning(f"Unsupported operation type: {op_type}")

    def sort_nodes_for_execution(self, nodes: list, connections: list) -> list:
        """
        Topologically sort the nodes for execution based on connections.
        Returns a list of nodes in execution order.
        """
        node_map = {node['id']: node for node in nodes}
        in_degree = {node_id: 0 for node_id in node_map}
        adj = {node_id: [] for node_id in node_map}

        for conn in connections:
            source_id = conn['fromNode']
            target_id = conn['toNode']
            if source_id in adj and target_id in node_map:
                adj[source_id].append(target_id)
                in_degree[target_id] += 1
        
        # Find start node (in-degree of 0)
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        
        sorted_order = []
        while queue:
            u = queue.pop(0)
            sorted_order.append(node_map[u])
            
            for v in adj.get(u, []):
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    queue.append(v)
        
        # Check for cycles
        if len(sorted_order) != len(nodes):
            logger.error("Cycle detected in workflow graph, execution aborted.")
            return []

        return sorted_order
