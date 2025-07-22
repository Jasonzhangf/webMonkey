// webMonkey/frontend/src/commands/RemoveConnectionCommand.ts
import { Command } from './Command';
import { Connection } from '../canvas/CanvasEditor';
import { editorState } from '../state/EditorState';

export class RemoveConnectionCommand implements Command {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    public execute(): void {
        editorState.removeConnection(this.connection.id);
    }

    public undo(): void {
        editorState.addConnection(this.connection);
    }
}
