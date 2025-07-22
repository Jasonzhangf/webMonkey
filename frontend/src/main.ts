import { CanvasEditor } from './canvas/CanvasEditor';
import { NodeRegistry } from './nodes/NodeRegistry';

document.addEventListener('DOMContentLoaded', () => {
    const nodeRegistry = NodeRegistry.getInstance();
    nodeRegistry.registerBuiltinNodes();

    const container = document.getElementById('app-container') || document.body;
    const editor = new CanvasEditor(container);
    editor.initialize();
});
