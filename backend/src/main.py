"""
Backend Service Entry Point
后端服务入口点
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .api.routes import router as api_router
from .services.communication_service import CommunicationService
from .services.state_manager import StateManager
from .utils.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global services
communication_service: CommunicationService = None
state_manager: StateManager = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global communication_service, state_manager
    
    logger.info("Starting Web Automation Orchestrator Backend...")
    
    # Initialize services
    settings = get_settings()
    state_manager = StateManager()
    communication_service = CommunicationService(settings.websocket)
    
    # Start services
    await state_manager.initialize()
    await communication_service.start()
    
    logger.info("Backend services started successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down backend services...")
    await communication_service.stop()
    await state_manager.cleanup()
    logger.info("Backend services shut down successfully")


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    settings = get_settings()
    
    app = FastAPI(
        title="Web Automation Orchestrator API",
        description="Backend API for web automation orchestrator",
        version="1.0.0",
        lifespan=lifespan
    )
    
    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Include routers
    app.include_router(api_router, prefix="/api/v1")
    
    return app


# Create app instance
app = create_app()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Web Automation Orchestrator Backend",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "communication": communication_service.is_running() if communication_service else False,
            "state_manager": state_manager.is_ready() if state_manager else False
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )