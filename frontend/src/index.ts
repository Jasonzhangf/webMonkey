/**
 * Frontend Entry Point - Canvas Orchestrator
 * 前端入口点 - Canvas编排器
 */

import { CanvasEditor } from './canvas/CanvasEditor';
import { NodeRegistry } from './nodes/NodeRegistry';
import { CommunicationManager } from './utils/CommunicationManager';

class WebAutomationOrchestrator {
  private canvasEditor: CanvasEditor;
  private nodeRegistry: NodeRegistry;
  private communicationManager: CommunicationManager;

  constructor() {
    this.nodeRegistry = new NodeRegistry();
    this.communicationManager = new CommunicationManager();
    this.canvasEditor = new CanvasEditor(this.nodeRegistry, this.communicationManager);
  }

  async initialize(): Promise<void> {
    console.log('Initializing Web Automation Orchestrator...');
    
    // Initialize communication with backend
    await this.communicationManager.connect();
    
    // Register built-in nodes
    this.nodeRegistry.registerBuiltinNodes();
    
    // Initialize canvas editor
    this.canvasEditor.initialize();
    
    console.log('Web Automation Orchestrator initialized successfully');
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Web Automation Orchestrator...');
    
    this.canvasEditor.cleanup();
    await this.communicationManager.disconnect();
    
    console.log('Web Automation Orchestrator shut down successfully');
  }
}

// Initialize the application
const orchestrator = new WebAutomationOrchestrator();

// Handle page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await orchestrator.initialize();
  } catch (error) {
    console.error('Failed to initialize orchestrator:', error);
  }
});

// Handle page unload
window.addEventListener('beforeunload', async () => {
  try {
    await orchestrator.shutdown();
  } catch (error) {
    console.error('Failed to shutdown orchestrator:', error);
  }
});

export { WebAutomationOrchestrator };