// webMonkey/frontend/src/state/EditorState.ts
import { BaseNode, NodeExecutionState } from "../nodes/BaseNode";
import { Connection } from "../canvas/CanvasEditor";

export interface CanvasViewState {
    pan: { x: number, y: number };
    zoom: number;
}

export interface EditorData {
    nodes: BaseNode[];
    connections: Connection[];
}

type StateUpdateListener = (state: EditorData) => void;

class EditorState {
    private static instance: EditorState;

    private state: EditorData = {
        nodes: [],
        connections: [],
    };

    private viewState: CanvasViewState = {
        pan: { x: 0, y: 0 },
        zoom: 1.0,
    };

    private listeners: StateUpdateListener[] = [];
    private history: EditorData[] = [];
    private historyIndex = -1;

    private constructor() {}

    public static getInstance(): EditorState {
        if (!EditorState.instance) {
            EditorState.instance = new EditorState();
        }
        return EditorState.instance;
    }
    
    public subscribe(listener: StateUpdateListener): void {
        this.listeners.push(listener);
    }

    public unsubscribe(listener: StateUpdateListener): void {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private notify(): void {
        // Pass the actual state to prevent breaking class instances
        // Listeners should not mutate the state directly
        this.listeners.forEach(l => l(this.state));
    }
    
    private saveStateToHistory(): void {
        this.history.splice(this.historyIndex + 1);
        // Create a shallow copy for history (deep cloning breaks class instances)
        this.history.push({
            nodes: [...this.state.nodes],
            connections: [...this.state.connections]
        });
        this.historyIndex++;
    }

    public undo(): void {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.state = this.history[this.historyIndex];
            this.notify();
        }
    }

    public redo(): void {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.state = this.history[this.historyIndex];
            this.notify();
        }
    }

    public getState(): EditorData {
        return this.state;
    }

    public setState(newState: EditorData, saveToHistory = true): void {
        this.state = newState;
        if (saveToHistory) {
            this.saveStateToHistory();
        }
        this.notify();
    }
    
    // --- Node operations ---
    public addNode(node: BaseNode): void {
        this.state.nodes.push(node);
        this.saveStateToHistory();
        this.notify();
    }

    public removeNode(nodeId: string): void {
        this.state.nodes = this.state.nodes.filter(n => n.id !== nodeId);
        // Also remove connections attached to this node
        this.state.connections = this.state.connections.filter(c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId);
        this.saveStateToHistory();
        this.notify();
    }

    public updateNodePosition(nodeId: string, position: { x: number, y: number }): void {
        const node = this.state.nodes.find(n => n.id === nodeId);
        if (node) {
            node.position = position;
        }
        // This is a frequent operation, so we might not want to save every single pixel move to history.
        // For now, we will notify without saving to history. A better approach is to use a "command" pattern.
        this.notify();
    }
    
    public updateNodeExecutionState(nodeId: string, executionState: NodeExecutionState): void {
        const node = this.state.nodes.find(n => n.id === nodeId);
        if (node) {
            node.executionState = executionState;
        }
        this.notify(); // Execution state changes should not be part of undo/redo history
    }

    // --- Connection operations ---
    public addConnection(connection: Connection): void {
        this.state.connections.push(connection);
        this.saveStateToHistory();
        this.notify();
    }

    public removeConnection(connectionId: string): void {
        this.state.connections = this.state.connections.filter(c => c.id !== connectionId);
        this.saveStateToHistory();
        this.notify();
    }
}

export const editorState = EditorState.getInstance();
