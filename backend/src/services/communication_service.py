"""
Communication Service
通信服务 - 处理WebSocket连接和消息路由
"""

import asyncio
import json
import logging
from typing import Dict, Set, Optional, Callable, Any
import websockets
from websockets.server import WebSocketServerProtocol

from ..utils.config import WebSocketSettings

logger = logging.getLogger(__name__)


class CommunicationService:
    """WebSocket communication service for handling plugin-orchestrator communication"""
    
    def __init__(self, config: WebSocketSettings):
        self.config = config
        self.server = None
        self.connections: Dict[str, WebSocketServerProtocol] = {}
        self.node_connections: Dict[str, str] = {}  # node_id -> connection_id
        self.message_handlers: Dict[str, Callable] = {}
        self.running = False
    
    async def start(self) -> None:
        """Start the WebSocket server"""
        if self.running:
            return
            
        logger.info(f"Starting WebSocket server on {self.config.host}:{self.config.port}")
        
        try:
            self.server = await websockets.serve(
                self.handle_connection,
                self.config.host,
                self.config.port,
                path=self.config.path
            )
            self.running = True
            logger.info("WebSocket server started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {e}")
            raise
    
    async def stop(self) -> None:
        """Stop the WebSocket server"""
        if not self.running:
            return
            
        logger.info("Stopping WebSocket server...")
        
        # Close all connections
        for connection in self.connections.values():
            await connection.close()
        
        self.connections.clear()
        self.node_connections.clear()
        
        # Stop server
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            self.server = None
        
        self.running = False
        logger.info("WebSocket server stopped")
    
    def is_running(self) -> bool:
        """Check if the service is running"""
        return self.running
    
    async def handle_connection(self, websocket: WebSocketServerProtocol, path: str) -> None:
        """Handle new WebSocket connection"""
        connection_id = f"conn_{id(websocket)}"
        self.connections[connection_id] = websocket
        
        logger.info(f"New WebSocket connection: {connection_id}")
        
        try:
            async for message in websocket:
                await self.handle_message(connection_id, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"WebSocket connection closed: {connection_id}")
        except Exception as e:
            logger.error(f"Error handling WebSocket connection {connection_id}: {e}")
        finally:
            # Cleanup connection
            if connection_id in self.connections:
                del self.connections[connection_id]
            
            # Remove node connections
            nodes_to_remove = [
                node_id for node_id, conn_id in self.node_connections.items() 
                if conn_id == connection_id
            ]
            for node_id in nodes_to_remove:
                del self.node_connections[node_id]
    
    async def handle_message(self, connection_id: str, message: str) -> None:
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            logger.debug(f"Received message type '{message_type}' from {connection_id}")
            
            # Handle node connection requests
            if message_type == 'node_connection_request':
                node_id = data.get('payload', {}).get('node_id')
                if node_id:
                    self.node_connections[node_id] = connection_id
                    logger.info(f"Node {node_id} connected via {connection_id}")
            
            # Route message to registered handlers
            handler = self.message_handlers.get(message_type)
            if handler:
                await handler(connection_id, data)
            else:
                logger.warning(f"No handler registered for message type: {message_type}")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON message from {connection_id}: {e}")
        except Exception as e:
            logger.error(f"Error handling message from {connection_id}: {e}")
    
    async def send_message(self, connection_id: str, message: Dict[str, Any]) -> bool:
        """Send message to specific connection"""
        connection = self.connections.get(connection_id)
        if not connection:
            logger.warning(f"Connection {connection_id} not found")
            return False
        
        try:
            await connection.send(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Failed to send message to {connection_id}: {e}")
            return False
    
    async def send_to_node(self, node_id: str, message: Dict[str, Any]) -> bool:
        """Send message to specific node"""
        connection_id = self.node_connections.get(node_id)
        if not connection_id:
            logger.warning(f"Node {node_id} not connected")
            return False
        
        return await self.send_message(connection_id, message)
    
    async def broadcast_message(self, message: Dict[str, Any], exclude: Optional[Set[str]] = None) -> int:
        """Broadcast message to all connections"""
        exclude = exclude or set()
        sent_count = 0
        
        for connection_id in self.connections:
            if connection_id not in exclude:
                if await self.send_message(connection_id, message):
                    sent_count += 1
        
        return sent_count
    
    def register_message_handler(self, message_type: str, handler: Callable) -> None:
        """Register handler for specific message type"""
        self.message_handlers[message_type] = handler
        logger.info(f"Registered handler for message type: {message_type}")
    
    def unregister_message_handler(self, message_type: str) -> None:
        """Unregister handler for specific message type"""
        if message_type in self.message_handlers:
            del self.message_handlers[message_type]
            logger.info(f"Unregistered handler for message type: {message_type}")
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.connections)
    
    def get_node_connections(self) -> Dict[str, str]:
        """Get node to connection mapping"""
        return self.node_connections.copy()