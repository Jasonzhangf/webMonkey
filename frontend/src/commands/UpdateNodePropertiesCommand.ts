// webMonkey/frontend/src/commands/UpdateNodePropertiesCommand.ts
import { Command } from './Command';
import { BaseNode } from '../nodes/BaseNode';
import { editorState } from '../state/EditorState';

export class UpdateNodePropertiesCommand implements Command {
    private nodeId: string;
    private oldProperties: any;
    private newProperties: any;

    constructor(nodeId: string, oldProperties: any, newProperties: any) {
        this.nodeId = nodeId;
        // Deep clone to prevent reference issues
        this.oldProperties = JSON.parse(JSON.stringify(oldProperties));
        this.newProperties = JSON.parse(JSON.stringify(newProperties));
    }

    public execute(): void {
        const state = editorState.getState();
        const node = state.nodes.find(n => n.id === this.nodeId);
        if (node) {
            node.properties = this.newProperties;
            editorState.setState(state, false); // Don't create a new history entry for the execution itself
        }
    }

    public undo(): void {
        const state = editorState.getState();
        const node = state.nodes.find(n => n.id === this.nodeId);
        if (node) {
            node.properties = this.oldProperties;
            editorState.setState(state, false); // Don't create a new history entry for the undo
        }
    }
}
