/**
 * Frontend Communication Manager
 * Manages WebSocket communication for the frontend canvas editor
 */

interface Listener {
    (message: any): void;
}

export class CommunicationManager {
    private websocket: WebSocket | null = null;
    public onMessage: {
        addListener: (listener: Listener) => void;
        removeListener: (listener: Listener) => void;
    };
    private listeners: Listener[] = [];

    constructor(private url: string) {
        this.onMessage = {
            addListener: (listener) => {
                this.listeners.push(listener);
            },
            removeListener: (listener) => {
                const index = this.listeners.indexOf(listener);
                if (index > -1) {
                    this.listeners.splice(index, 1);
                }
            },
        };
    }

    public connect(): void {
        this.websocket = new WebSocket(this.url);

        this.websocket.onopen = () => {
            console.log('Frontend: WebSocket connection established.');
        };

        this.websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.websocket.onclose = () => {
            console.log('Frontend: WebSocket connection closed. Reconnecting...');
            setTimeout(() => this.connect(), 1000);
        };

        this.websocket.onerror = (error) => {
            console.error('Frontend: WebSocket error:', error);
        };
    }

    private handleMessage(message: any): void {
        this.listeners.forEach(listener => listener(message));
    }

    public sendMessage(message: any): void {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        } else {
            console.error('Frontend: WebSocket is not connected.');
        }
    }
}
