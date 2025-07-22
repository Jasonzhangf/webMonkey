// webMonkey/frontend/src/commands/CommandHistory.ts
import { Command } from './Command';

class CommandHistory {
    private static instance: CommandHistory;
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    private constructor() {}

    public static getInstance(): CommandHistory {
        if (!CommandHistory.instance) {
            CommandHistory.instance = new CommandHistory();
        }
        return CommandHistory.instance;
    }

    public execute(command: Command): void {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo stack on new action
    }

    public undo(): void {
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        }
    }

    public redo(): void {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
        }
    }
}

export const commandHistory = CommandHistory.getInstance();
