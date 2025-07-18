/**
 * Frontend Communication Manager
 * 前端通信管理器
 */

import { 
  BaseMessage, 
  ResponseMessage, 
  WebSocketConnection,
  MessageRouter 
} from '../../../shared/communication';
import { COMMUNICATION } from '../../../shared/constants';

export class CommunicationManager implements MessageRouter {
  private websocket: WebSocket | null = null;
  private messageHandlers: Map<string, (message: BaseMessage) => Promise<ResponseMessage | void>> = new Map();
  private pendingRequests: Map<string, (response: ResponseMessage) => void> = new Map();
  private reconnectAttempts = 0;
  private isConnecting = false;

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
        console.log('Connected to backend WebSocket');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        console.log('WebSocket connection closed');
        this.websocket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
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
          console.log('Connected to backend WebSocket');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
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

  async sendMessage(message: BaseMessage): Promise<ResponseMessage | void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to backend');
    }

    // Add timestamp and ID if not present
    if (!message.id) {
      message.id = crypto.randomUUID();
    }
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }

    this.websocket!.send(JSON.stringify(message));

    // If expecting response, wait for it
    if ('expect_response' in message && message.expect_response) {
      return new Promise<ResponseMessage>((resolve) => {
        this.pendingRequests.set(message.id, resolve);
        
        // Set timeout for response
        setTimeout(() => {
          if (this.pendingRequests.has(message.id)) {
            this.pendingRequests.delete(message.id);
            resolve({
              id: crypto.randomUUID(),
              type: 'response',
              timestamp: new Date().toISOString(),
              source: 'backend',
              target: 'orchestrator',
              request_id: message.id,
              success: false,
              error: {
                type: 'timeout_error',
                message: 'Request timeout',
                context: { request_id: message.id },
                timestamp: new Date().toISOString()
              }
            });
          }
        }, 30000); // 30 second timeout
      });
    }
  }

  async route(message: BaseMessage): Promise<void> {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      try {
        const response = await handler(message);
        if (response) {
          await this.sendMessage(response);
        }
      } catch (error) {
        console.error(`Error handling message ${message.type}:`, error);
      }
    } else {
      console.warn(`No handler registered for message type: ${message.type}`);
    }
  }

  registerHandler(
    messageType: string, 
    handler: (message: BaseMessage) => Promise<ResponseMessage | void>
  ): void {
    this.messageHandlers.set(messageType, handler);
  }

  unregisterHandler(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  private async handleMessage(data: any): Promise<void> {
    try {
      const message = data as BaseMessage;
      
      // Handle response messages
      if (message.type === 'response' && 'request_id' in message) {
        const responseMessage = message as ResponseMessage;
        const pendingRequest = this.pendingRequests.get(responseMessage.request_id);
        if (pendingRequest) {
          this.pendingRequests.delete(responseMessage.request_id);
          pendingRequest(responseMessage);
          return;
        }
      }

      // Route other messages
      await this.route(message);
    } catch (error) {
      console.error('Error handling received message:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= COMMUNICATION.WEBSOCKET.RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = COMMUNICATION.WEBSOCKET.RECONNECT_DELAY * this.reconnectAttempts;
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }
}