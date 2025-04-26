// Audio data types
export interface AudioChunk {
  data: Float32Array;
  timestamp: number;
  sampleRate: number;
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
}

// Microphone permission states
export type MicrophonePermissionState = 'granted' | 'denied' | 'prompt';

// Application state related to audio
export interface AudioState {
  isActive: boolean;
  isListening: boolean;
  micPermission: MicrophonePermissionState;
  error: string | null;
} 