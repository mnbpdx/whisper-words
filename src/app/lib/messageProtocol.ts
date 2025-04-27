import { v4 as uuidv4 } from 'uuid';
import { Word } from '../types/whisper';

/**
 * Types for messages exchanged with WhisperX Python process
 */
export type AudioDataMessage = {
  audio_data: number[];
  sample_rate: number;
  session_id: string;
};

export type WhisperXWord = {
  text: string;
  start: number;
  end: number;
  confidence: number;
};

export type TranscriptionResult = {
  words: WhisperXWord[];
  text: string;
  processing_time: number;
  sample_rate?: number;
  error?: string;
};

export type AppTranscriptionResult = {
  words: Word[];
  sessionId: string;
  timestamp: number;
};

/**
 * Handles message formatting and parsing between Node.js and Python process
 */
export class MessageProtocol {
  /**
   * Format audio data message for Python process
   */
  formatAudioDataMessage(
    audioData: Float32Array,
    sampleRate: number,
    sessionId: string
  ): AudioDataMessage {
    // Convert Float32Array to regular array for JSON serialization
    return {
      audio_data: Array.from(audioData),
      sample_rate: sampleRate,
      session_id: sessionId,
    };
  }

  /**
   * Parse transcription result from Python and convert to app format
   */
  parseTranscriptionResult(result: TranscriptionResult, sessionId: string): AppTranscriptionResult {
    // Convert WhisperX word format to app word format
    const words: Word[] = result.words.map((word) => ({
      word: word.text,
      startTime: word.start,
      endTime: word.end,
      confidence: word.confidence,
      id: uuidv4(), // Generate unique ID for each word
    }));

    return {
      words,
      sessionId,
      timestamp: Date.now(),
    };
  }

  /**
   * Validate audio data message
   */
  validateAudioDataMessage(message: unknown): message is AudioDataMessage {
    return (
      message !== null &&
      typeof message === 'object' &&
      Array.isArray((message as AudioDataMessage).audio_data) &&
      typeof (message as AudioDataMessage).sample_rate === 'number' &&
      typeof (message as AudioDataMessage).session_id === 'string'
    );
  }

  /**
   * Validate transcription result from Python
   */
  validateTranscriptionResult(result: unknown): result is TranscriptionResult {
    return (
      result !== null &&
      typeof result === 'object' &&
      Array.isArray((result as TranscriptionResult).words) &&
      (result as TranscriptionResult).words.every(
        (word: WhisperXWord) =>
          typeof word.text === 'string' &&
          typeof word.start === 'number' &&
          typeof word.end === 'number' &&
          typeof word.confidence === 'number'
      )
    );
  }

  /**
   * Check if response is an error
   */
  isErrorResponse(response: unknown): boolean {
    return (
      response !== null &&
      typeof response === 'object' &&
      typeof (response as { error?: string }).error === 'string'
    );
  }

  /**
   * Get error message from error response
   */
  getErrorMessage(response: unknown): string {
    return response !== null &&
      typeof response === 'object' &&
      (response as { error?: string }).error
      ? (response as { error: string }).error
      : 'Unknown error';
  }

  /**
   * Serialize message to JSON
   */
  serializeMessage(message: unknown): string {
    return JSON.stringify(message);
  }

  /**
   * Parse JSON message
   */
  parseMessage<T>(message: string): T {
    return JSON.parse(message) as T;
  }
}
