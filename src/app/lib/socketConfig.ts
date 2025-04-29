// Socket.IO configuration and event definitions

export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  RECONNECT = 'reconnect',
  RECONNECT_ATTEMPT = 'reconnect_attempt',

  // Custom app events
  AUDIO_CHUNK = 'audio_chunk',
  TRANSCRIPTION_RESULT = 'transcription_result',
  SESSION_CREATE = 'session_create',
  SESSION_DESTROY = 'session_destroy',
  CONNECTION_STATUS = 'connection_status',
}

export interface SocketOptions {
  reconnectionAttempts: number;
  reconnectionDelay: number;
  timeout: number;
  transports: string[];
}

export const defaultSocketOptions: SocketOptions = {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  transports: ['websocket', 'polling'],
};

// Path used by the custom server.js implementation
export const SOCKET_PATH = '/api/socket';

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

export const initialConnectionStatus: ConnectionStatus = {
  connected: false,
  reconnecting: false,
  error: null,
};
