import { v4 as uuidv4 } from 'uuid';
import { AudioChunk, AudioStreamMetadata, AudioStreamOptions } from '../types/audio';
import { SocketEvent } from '../lib/socketConfig';
import { AudioChunkPayload } from '../lib/socketEvents';
import { SocketService } from './socketService';

const DEFAULT_STREAM_OPTIONS: AudioStreamOptions = {
  batchSize: 1, // Send chunks one by one
  compressionEnabled: false, // No compression initially
  maxRetries: 3, // Maximum retry attempts for failed chunks
};

export class AudioStreamingService {
  private options: AudioStreamOptions;
  private chunkQueue: AudioChunk[] = [];
  private isProcessing = false;
  private sessionId: string | null = null;
  private chunkCounter = 0;
  
  constructor(
    private socketService: SocketService,
    options?: Partial<AudioStreamOptions>
  ) {
    this.options = {
      ...DEFAULT_STREAM_OPTIONS,
      ...options,
    };
  }
  
  // Set session ID
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }
  
  // Get current session ID
  getSessionId(): string | null {
    return this.sessionId || this.socketService.getSessionId();
  }
  
  // Queue audio chunk for streaming
  queueAudioChunk(chunk: AudioChunk): void {
    // Add unique ID to chunk if not present
    const chunkWithId: AudioChunk = {
      ...chunk,
      id: chunk.id || uuidv4(),
      sessionId: this.getSessionId() || undefined,
    };
    
    this.chunkQueue.push(chunkWithId);
    
    // Start processing queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  // Process queued audio chunks
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.chunkQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Get next batch of chunks
      const batchSize = Math.min(this.options.batchSize, this.chunkQueue.length);
      const chunksToProcess = this.chunkQueue.splice(0, batchSize);
      
      // Process each chunk in the batch
      for (const chunk of chunksToProcess) {
        await this.streamChunk(chunk);
      }
    } finally {
      this.isProcessing = false;
      
      // Continue processing if there are more chunks
      if (this.chunkQueue.length > 0) {
        this.processQueue();
      }
    }
  }
  
  // Stream a single audio chunk
  private async streamChunk(chunk: AudioChunk): Promise<boolean> {
    if (!this.socketService.isConnected()) {
      // If socket is not connected, add chunk back to queue
      this.chunkQueue.unshift(chunk);
      return false;
    }
    
    const sessionId = this.getSessionId();
    if (!sessionId) {
      console.error('Cannot stream audio chunk: No session ID available');
      return false;
    }
    
    // Prepare audio data for transmission
    // In a real app, you might want to compress or convert the audio here
    const payload: AudioChunkPayload = {
      chunkId: chunk.id || uuidv4(),
      timestamp: chunk.timestamp,
      audioData: chunk.data.buffer, // Send ArrayBuffer instead of Float32Array
      sampleRate: chunk.sampleRate,
    };
    
    try {
      // Send chunk via socket
      return this.socketService.emit(SocketEvent.AUDIO_CHUNK, payload);
    } catch (error) {
      console.error('Error streaming audio chunk:', error);
      return false;
    }
  }
  
  // Clear queue and reset state
  reset(): void {
    this.chunkQueue = [];
    this.isProcessing = false;
    this.chunkCounter = 0;
  }
  
  // Check if streaming service is connected
  isConnected(): boolean {
    return this.socketService.isConnected();
  }
} 