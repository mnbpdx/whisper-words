/**
 * WhisperX related types
 */

/**
 * Represents a transcribed word with timing information
 */
export type Word = {
  id: string; // Unique identifier for the word
  word: string; // The transcribed word text
  startTime: number; // Start time in seconds
  endTime: number; // End time in seconds
  confidence: number; // Confidence score (0-1)
};

/**
 * Transcription result with words and metadata
 */
export type TranscriptionResult = {
  words: Word[];
  sessionId: string;
  timestamp: number;
};

/**
 * Configuration options for WhisperX
 */
export type WhisperXOptions = {
  model: string; // Model size (tiny, base, small, medium, large, etc.)
  language?: string; // Optional language code (en, fr, etc.)
  device: 'cpu' | 'cuda'; // Device to use for inference
  computePrecision?: 'float16' | 'float32'; // Computation precision
  batchSize?: number; // Batch size for processing
  enableHQ?: boolean; // Enable high-quality mode
  loadOptions?: Record<string, unknown>; // Additional model loading options
};

/**
 * Status of the WhisperX service
 */
export type WhisperXStatus = {
  isActive: boolean; // Whether the service is active
  processId?: number; // Process ID if active
  model?: string; // Current model being used
  device?: string; // Current device being used
  uptime?: number; // Service uptime in seconds
  lastActivity?: number; // Timestamp of last activity
  avgProcessingTime?: number; // Average processing time
};

/**
 * Error from WhisperX processing
 */
export type WhisperXError = {
  code: string;
  message: string;
  details?: unknown;
};
