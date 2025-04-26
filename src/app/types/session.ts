// Session type definitions

export type SessionStatus = 'initializing' | 'active' | 'paused' | 'ended' | 'error';

export interface Session {
  id: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
  status: SessionStatus;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
  metadata?: Record<string, any>;
  audioConfig?: {
    sampleRate: number;
    channelCount: number;
    bufferSize: number;
  };
}

export interface SessionStats {
  totalAudioProcessed: number; // in seconds
  transcriptionLatency: number; // average latency in ms
  wordCount: number;
  errorCount: number;
}

export interface SessionManager {
  createSession: (userId?: string, deviceInfo?: Session['deviceInfo']) => Promise<Session>;
  getSession: (sessionId: string) => Promise<Session | null>;
  updateSession: (sessionId: string, updates: Partial<Session>) => Promise<Session>;
  endSession: (sessionId: string) => Promise<void>;
  getSessionStats: (sessionId: string) => Promise<SessionStats>;
  isSessionActive: (sessionId: string) => Promise<boolean>;
}

export interface SessionOptions {
  maxSessionDuration: number; // in seconds, 0 = unlimited
  inactivityTimeout: number; // in seconds, 0 = no timeout
}

export const defaultSessionOptions: SessionOptions = {
  maxSessionDuration: 3600, // 1 hour max session by default
  inactivityTimeout: 300, // 5 minutes inactivity timeout
}; 