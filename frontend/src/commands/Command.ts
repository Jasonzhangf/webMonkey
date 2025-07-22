// webMonkey/frontend/src/commands/Command.ts

export interface Command {
    execute(): void;
    undo(): void;
}
