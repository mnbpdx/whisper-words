import { v4 as uuidv4 } from 'uuid';
import { AudioChunkPayload } from '../lib/socketEvents';

// Buffer for collecting audio chunks per session
type SessionBuffer = {
  chunks: AudioChunkPayload[];
  lastProcessedTimestamp: number;
  sampleRate: number;
};

// Map of session ID to audio buffer
const sessionBuffers = new Map<string, SessionBuffer>();

// Configuration
const MAX_BUFFER_DURATION = 10000; // Max buffer duration in ms
const MIN_CHUNK_DURATION = 500; // Min duration for processing in ms

export class AudioProcessor {
  // Process an incoming audio chunk
  processChunk(sessionId: string, chunk: AudioChunkPayload): void {
    // Get or create session buffer
    let sessionBuffer = sessionBuffers.get(sessionId);
    if (!sessionBuffer) {
      sessionBuffer = {
        chunks: [],
        lastProcessedTimestamp: 0,
        sampleRate: chunk.sampleRate,
      };
      sessionBuffers.set(sessionId, sessionBuffer);
    }
    
    // Add chunk to buffer
    sessionBuffer.chunks.push(chunk);
    
    // Sort chunks by timestamp
    sessionBuffer.chunks.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  // Get audio data ready for processing
  getAudioForProcessing(sessionId: string): { audioData: Float32Array, sampleRate: number } | null {
    const sessionBuffer = sessionBuffers.get(sessionId);
    if (!sessionBuffer || sessionBuffer.chunks.length === 0) {
      return null;
    }
    
    // Check if we have enough audio data
    const firstTimestamp = sessionBuffer.chunks[0].timestamp;
    const lastTimestamp = sessionBuffer.chunks[sessionBuffer.chunks.length - 1].timestamp;
    const bufferDuration = lastTimestamp - firstTimestamp;
    
    // Only process if we have enough data or marked as last chunk
    const hasLastChunk = sessionBuffer.chunks.some(chunk => chunk.isLastChunk);
    if (bufferDuration < MIN_CHUNK_DURATION && !hasLastChunk) {
      return null;
    }
    
    // Concatenate audio data
    let totalLength = 0;
    for (const chunk of sessionBuffer.chunks) {
      // Assuming audioData is Float32Array or can be converted to it
      const audioData = chunk.audioData instanceof ArrayBuffer
        ? new Float32Array(chunk.audioData)
        : chunk.audioData as Float32Array;
      
      totalLength += audioData.length;
    }
    
    // Create a single Float32Array
    const concatenatedAudio = new Float32Array(totalLength);
    let offset = 0;
    
    for (const chunk of sessionBuffer.chunks) {
      const audioData = chunk.audioData instanceof ArrayBuffer
        ? new Float32Array(chunk.audioData)
        : chunk.audioData as Float32Array;
      
      concatenatedAudio.set(audioData, offset);
      offset += audioData.length;
    }
    
    // Update last processed timestamp
    sessionBuffer.lastProcessedTimestamp = lastTimestamp;
    
    // Clear buffer
    sessionBuffer.chunks = [];
    
    return {
      audioData: concatenatedAudio,
      sampleRate: sessionBuffer.sampleRate,
    };
  }
  
  // Process older chunks if buffer is getting full
  processOldChunks(sessionId: string): void {
    const sessionBuffer = sessionBuffers.get(sessionId);
    if (!sessionBuffer || sessionBuffer.chunks.length === 0) {
      return;
    }
    
    // Check if buffer duration exceeds maximum
    const firstTimestamp = sessionBuffer.chunks[0].timestamp;
    const lastTimestamp = sessionBuffer.chunks[sessionBuffer.chunks.length - 1].timestamp;
    const bufferDuration = lastTimestamp - firstTimestamp;
    
    if (bufferDuration > MAX_BUFFER_DURATION) {
      // Find index where to split the buffer
      let splitIndex = 0;
      const targetTimestamp = lastTimestamp - MAX_BUFFER_DURATION;
      
      while (splitIndex < sessionBuffer.chunks.length && 
             sessionBuffer.chunks[splitIndex].timestamp < targetTimestamp) {
        splitIndex++;
      }
      
      // Process chunks up to split index
      if (splitIndex > 0) {
        // Extract chunks for processing
        const chunksToProcess = sessionBuffer.chunks.slice(0, splitIndex);
        sessionBuffer.chunks = sessionBuffer.chunks.slice(splitIndex);
        
        // Calculate total length
        let totalLength = 0;
        for (const chunk of chunksToProcess) {
          const audioData = chunk.audioData instanceof ArrayBuffer
            ? new Float32Array(chunk.audioData)
            : chunk.audioData as Float32Array;
          
          totalLength += audioData.length;
        }
        
        // Create a single Float32Array
        const concatenatedAudio = new Float32Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunksToProcess) {
          const audioData = chunk.audioData instanceof ArrayBuffer
            ? new Float32Array(chunk.audioData)
            : chunk.audioData as Float32Array;
          
          concatenatedAudio.set(audioData, offset);
          offset += audioData.length;
        }
        
        // Update last processed timestamp
        const lastProcessedChunk = chunksToProcess[chunksToProcess.length - 1];
        sessionBuffer.lastProcessedTimestamp = lastProcessedChunk.timestamp;
        
        // Here we would pass concatenatedAudio to transcription service
        // For now, we'll just log it
        console.log(`Processed ${chunksToProcess.length} chunks with ${totalLength} samples`);
      }
    }
  }
  
  // Clear session buffer
  clearSession(sessionId: string): void {
    sessionBuffers.delete(sessionId);
  }
  
  // Get all session IDs
  getSessionIds(): string[] {
    return Array.from(sessionBuffers.keys());
  }
  
  // Get buffer statistics for a session
  getSessionStats(sessionId: string): { chunkCount: number, bufferDuration: number } | null {
    const sessionBuffer = sessionBuffers.get(sessionId);
    if (!sessionBuffer) {
      return null;
    }
    
    const chunkCount = sessionBuffer.chunks.length;
    let bufferDuration = 0;
    
    if (chunkCount > 0) {
      const firstTimestamp = sessionBuffer.chunks[0].timestamp;
      const lastTimestamp = sessionBuffer.chunks[sessionBuffer.chunks.length - 1].timestamp;
      bufferDuration = lastTimestamp - firstTimestamp;
    }
    
    return { chunkCount, bufferDuration };
  }
} 