/**
 * Plugin Communication Manager
 * 插件通信管理器
 */

import { BaseMessage } from '../../../shared/communication';
import { COMMUNICATION } from '../../../shared/constants';

export class CommunicationManager {
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private messageQueue: BaseMessage[] = [];

  constructor(
    private host: string = COMMUNICATION.WEBSOCKET.DEFAULT_HOST,
    private port: number = COMMUNICATION.WEBSOCKET.DEFAULT_PORT,
    private path: string = COMMUNICATION.WEBSOCKET.DEFAULT_PATH
  ) {}

  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;
    const url = `ws://${this.host}:${this.port}${this.path}`;

    try {
      this.websocket = new WebSocket(url);
      
      this.websocket.onopen = () => {
        console.log('Plugin connected to orchestrator WebSocket');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        console.log('Plugin WebSocket connection closed');
        this.websocket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('Plugin WebSocket error:', error);
        this.isConnecting = false;
      };

      // Wait for connection to open
      await new Promise<void>((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error('WebSocket not initialized'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.websocket.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.websocket.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Connection failed'));
        };
      });

    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  async sendMessage(message: BaseMessage): Promise<void> {
    // Add timestamp and ID if not present
    if (!message.id) {
      message.id = crypto.randomUUID();
    }
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }

    if (this.isConnected()) {
      this.websocket!.send(JSON.stringify(message));
    } else {
      // Queue message for later sending
      this.messageQueue.push(message);
      
      // Try to reconnect if not already connecting
      if (!this.isConnecting) {
        this.connect().catch(error => {
          console.error('Failed to reconnect for message sending:', error);
        });
      }
    }
  }

  private handleMessage(data: any): void {
    try {
      const message = data as BaseMessage;
      
      // Forward message to background script for processing
      chrome.runtime.sendMessage(message).catch(error => {
        console.error('Failed to forward message to background script:', error);
      });
      
    } catch (error) {
      console.error('Error handling received message:', error);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()!;
      this.websocket!.send(JSON.stringify(message));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= COMMUNICATION.WEBSOCKET.RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = COMMUNICATION.WEBSOCKET.RECONNECT_DELAY * this.reconnectAttempts;
    
    console.log(`Scheduling plugin reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Plugin reconnection failed:', error);
      });
    }, delay);
  }
}