// webMonkey/frontend/src/commands/AddConnectionCommand.ts
import { Command } from './Command';
import { Connection } from '../canvas/CanvasEditor';
import { editorState } from '../state/EditorState';

export class AddConnectionCommand implements Command {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    public execute(): void {
        editorState.addConnection(this.connection);
    }

    public undo(): void {
        editorState.removeConnection(this.connection.id);
    }
}
