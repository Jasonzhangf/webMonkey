// webMonkey/frontend/src/commands/AddNodeCommand.ts
import { Command } from './Command';
import { BaseNode } from '../nodes/BaseNode';
import { editorState } from '../state/EditorState';

export class AddNodeCommand implements Command {
    private node: BaseNode;

    constructor(node: BaseNode) {
        this.node = node;
    }

    public execute(): void {
        editorState.addNode(this.node);
    }

    public undo(): void {
        editorState.removeNode(this.node.id);
    }
}
