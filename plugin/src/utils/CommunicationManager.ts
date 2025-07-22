/**
 * Communication Manager - V2 for Content Script
 * Manages communication between the content script and the background script
 */

interface Listener {
  (message: any): void;
}

export class CommunicationManager {
  private port: chrome.runtime.Port;
  public onMessage: {
    addListener: (listener: Listener) => void;
    removeListener: (listener: Listener) => void;
  };
  private listeners: Listener[] = [];

  constructor(private name: string) {
    this.port = chrome.runtime.connect({ name });
    this.port.onMessage.addListener(this.handleMessage.bind(this));
    this.port.onDisconnect.addListener(this.handleDisconnect.bind(this));

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

  private handleMessage(message: any): void {
    this.listeners.forEach(listener => listener(message));
  }

  private handleDisconnect(): void {
    console.warn(`Port '${this.name}' disconnected.`);
    // You might want to add reconnection logic here
  }

  public sendMessage(message: any): void {
    try {
      this.port.postMessage(message);
    } catch (error) {
      console.error(`Failed to send message via port '${this.name}':`, error);
      // Handle error, e.g., port is disconnected
    }
  }
}
