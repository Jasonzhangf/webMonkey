// webMonkey/frontend/src/commands/RemoveNodeCommand.ts
import { Command } from './Command';
import { BaseNode } from '../nodes/BaseNode';
import { Connection } from '../canvas/CanvasEditor';
import { editorState } from '../state/EditorState';

export class RemoveNodeCommand implements Command {
    private node: BaseNode;
    private connections: Connection[];

    constructor(node: BaseNode) {
        this.node = node;
        const allConnections = editorState.getState().connections;
        this.connections = allConnections.filter(c => c.from.nodeId === node.id || c.to.nodeId === node.id);
    }

    public execute(): void {
        editorState.removeNode(this.node.id);
    }

    public undo(): void {
        editorState.addNode(this.node);
        this.connections.forEach(c => editorState.addConnection(c));
    }
}
