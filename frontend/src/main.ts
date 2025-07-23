import { CanvasEditor } from './canvas/CanvasEditor';
import { NodeRegistry } from './nodes/NodeRegistry';

document.addEventListener('DOMContentLoaded', () => {
    const nodeRegistry = NodeRegistry.getInstance();
    (nodeRegistry as any).registerBuiltinNodes();

    const container = document.getElementById('app-container') || document.body;
    new CanvasEditor(container);
    
    // 导入测试演示功能
    import('./tests/demo').then(() => {
        console.log('🧪 Test system loaded! Use Ctrl+Shift+T to open test panel');
        console.log('💡 Or run window.runTestDemo() for a guided demo');
    }).catch(err => {
        console.warn('Test system could not be loaded:', err);
    });
});
