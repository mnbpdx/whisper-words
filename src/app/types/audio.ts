// Audio data types
export interface AudioChunk {
  data: Float32Array;
  timestamp: number;
  sampleRate: number;
  id?: string; // Unique identifier for streaming
  sessionId?: string; // Session ID for streaming
}

export interface TranscribedWord {
  id: string;
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  isPinned: boolean;
  createdAt: number;
}

export interface WordWithTiming {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionResult {
  text: string;
  words: WordWithTiming[];
  sessionId?: string; // Added for streaming context
  timestamp?: number; // Added for sequence ordering
}

// Microphone permission states
export type MicrophonePermissionState = 'granted' | 'denied' | 'prompt';

// Application state related to audio
export interface AudioState {
  isActive: boolean;
  isListening: boolean;
  micPermission: MicrophonePermissionState;
  error: string | null;
  isStreaming?: boolean; // Added for streaming state
  connectionStatus?: 'connected' | 'disconnected' | 'connecting' | 'error'; // Added for WebSocket status
}

// Audio processing configuration
export interface AudioProcessingConfig {
  sampleRate: number;
  channelCount: number;
  bufferSize: number;
  chunkDuration: number; // Duration of each chunk in ms
  streamingEnabled: boolean;
}

export const defaultAudioConfig: AudioProcessingConfig = {
  sampleRate: 16000, // WhisperX works best with 16kHz audio
  channelCount: 1, // Mono audio for speech recognition
  bufferSize: 4096, // Default buffer size
  chunkDuration: 500, // 500ms chunks for streaming
  streamingEnabled: true,
};

// Audio streaming types
export interface AudioStreamMetadata {
  sessionId: string;
  timestamp: number;
  chunkIndex: number;
  totalChunks: number;
  isLastChunk: boolean;
  format: 'float32' | 'int16'; // Audio format/encoding
}

export interface AudioStreamOptions {
  batchSize: number; // Number of chunks to send in a batch
  compressionEnabled: boolean;
  maxRetries: number;
} 