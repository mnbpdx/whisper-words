import { io, Socket } from 'socket.io-client';
import { defaultSocketOptions, SocketEvent, SocketOptions, SOCKET_PATH } from '../lib/socketConfig';
import { SocketEventPayloadMap } from '../lib/socketEvents';
import { Session } from '../types/session';

export class SocketService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts = 0;

  constructor(private options: SocketOptions = defaultSocketOptions) {}

  // Initialize Socket.IO connection
  connect(sessionId?: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.sessionId = sessionId || null;

    // Create Socket.IO instance - Connect to our custom server
    const socketURL = typeof window !== 'undefined' ? 'http://localhost:3333' : '';

    console.log('Connecting to Socket.IO server at:', socketURL, 'with path:', SOCKET_PATH);

    this.socket = io(socketURL, {
      autoConnect: true,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      timeout: this.options.timeout,
      transports: this.options.transports,
      path: SOCKET_PATH,
      query: sessionId ? { sessionId } : undefined,
      withCredentials: false,
    });

    // Log connection events
    this.socket.on('connect', () => {
      console.log('Socket connected with ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  // Disconnect and cleanup
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
      this.reconnectAttempts = 0;
    }
  }

  // Check connection status
  isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }

  // Get current socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Get current session ID
  getSessionId(): string | null {
    return this.sessionId;
  }

  // Set session ID
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    // Update socket query parameter if socket exists
    if (this.socket && this.socket.connected) {
      // For socket.io-client, we need to reconnect to update query params
      this.socket.disconnect().connect();
    }
  }

  // Create a new session
  async createSession(deviceInfo?: Session['deviceInfo']): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        SocketEvent.SESSION_CREATE,
        { deviceInfo },
        (response: { sessionId: string; error?: string }) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          this.sessionId = response.sessionId;
          resolve(response.sessionId);
        }
      );
    });
  }

  // End a session
  async endSession(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.sessionId) {
        reject(new Error('Socket not connected or no session ID'));
        return;
      }

      this.socket.emit(
        SocketEvent.SESSION_DESTROY,
        { sessionId: this.sessionId },
        (response: { success: boolean; error?: string }) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          this.sessionId = null;
          resolve();
        }
      );
    });
  }

  // Type-safe event emitter
  emit<E extends SocketEvent>(event: E, payload: SocketEventPayloadMap[E]): boolean {
    if (!this.socket) {
      return false;
    }

    this.socket.emit(event, payload);
    return true;
  }

  // Type-safe event listener
  on<E extends SocketEvent>(event: E, callback: (payload: SocketEventPayloadMap[E]) => void): void {
    if (!this.socket) {
      return;
    }

    this.socket.on(event, callback);
  }

  // Type-safe event listener (one time)
  once<E extends SocketEvent>(
    event: E,
    callback: (payload: SocketEventPayloadMap[E]) => void
  ): void {
    if (!this.socket) {
      return;
    }

    this.socket.once(event, callback);
  }

  // Remove event listener
  off<E extends SocketEvent>(
    event: E,
    callback?: (payload: SocketEventPayloadMap[E]) => void
  ): void {
    if (!this.socket) {
      return;
    }

    this.socket.off(event, callback);
  }
}
