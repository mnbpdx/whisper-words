// Socket event payload type definitions
import { SocketEvent, ConnectionStatus } from './socketConfig';

// Audio chunk payload sent from client to server
export interface AudioChunkPayload {
  chunkId: string;
  timestamp: number;
  audioData: Float32Array | ArrayBuffer;
  sampleRate: number;
  isLastChunk?: boolean;
}

// Transcription result payload sent from server to client
export interface TranscriptionResultPayload {
  words: TranscribedWord[];
  sessionId: string;
  timestamp: number;
}

export interface TranscribedWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  id: string;
}

// Session-related payloads
export interface SessionCreatePayload {
  userId?: string;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
}

export interface SessionResponse {
  sessionId: string;
  createdAt: number;
  status: 'active' | 'ended';
}

// Connection status payload
export type ConnectionStatusPayload = ConnectionStatus;

// Map of event names to their payload types for type safety
export interface SocketEventPayloadMap {
  [SocketEvent.AUDIO_CHUNK]: AudioChunkPayload;
  [SocketEvent.TRANSCRIPTION_RESULT]: TranscriptionResultPayload;
  [SocketEvent.SESSION_CREATE]: SessionCreatePayload;
  [SocketEvent.SESSION_DESTROY]: { sessionId: string };
  [SocketEvent.CONNECTION_STATUS]: ConnectionStatusPayload;
  [SocketEvent.ERROR]: { message: string; code?: string };
}

// Helper type for emitting events with correct payload types
export type EmitEvent<E extends SocketEvent> = 
  (event: E, payload: SocketEventPayloadMap[E]) => void; 