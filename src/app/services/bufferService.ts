interface BufferServiceOptions {
  maxBufferSize?: number;  // Maximum buffer size in samples
  onBufferFull?: (buffer: Float32Array) => void;  // Callback when buffer is full
}

class BufferService {
  private buffer: Float32Array[] = [];
  private currentBufferSize: number = 0;
  private maxBufferSize: number;
  private onBufferFull: ((buffer: Float32Array) => void) | null = null;

  constructor(options: BufferServiceOptions = {}) {
    this.maxBufferSize = options.maxBufferSize || 16000 * 5; // 5 seconds at 16kHz by default
    this.onBufferFull = options.onBufferFull || null;
  }

  /**
   * Add audio data to the buffer
   */
  public addToBuffer(audioData: Float32Array): void {
    this.buffer.push(audioData);
    this.currentBufferSize += audioData.length;

    if (this.currentBufferSize >= this.maxBufferSize) {
      this.processBuffer();
    }
  }

  /**
   * Process the buffer when it's full
   */
  private processBuffer(): void {
    if (this.buffer.length === 0) return;

    // Concatenate all chunks into a single Float32Array
    const concatenatedBuffer = new Float32Array(this.currentBufferSize);
    let offset = 0;

    for (const chunk of this.buffer) {
      concatenatedBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Call the callback with the full buffer
    if (this.onBufferFull) {
      this.onBufferFull(concatenatedBuffer);
    }

    // Reset the buffer
    this.clearBuffer();
  }

  /**
   * Clear the buffer
   */
  public clearBuffer(): void {
    this.buffer = [];
    this.currentBufferSize = 0;
  }

  /**
   * Set the callback to execute when buffer is full
   */
  public setBufferFullCallback(callback: (buffer: Float32Array) => void): void {
    this.onBufferFull = callback;
  }

  /**
   * Force process the current buffer even if not full
   */
  public forceProcess(): void {
    if (this.currentBufferSize > 0) {
      this.processBuffer();
    }
  }

  /**
   * Get the current buffer size in samples
   */
  public getCurrentBufferSize(): number {
    return this.currentBufferSize;
  }

  /**
   * Set a new maximum buffer size
   */
  public setMaxBufferSize(size: number): void {
    this.maxBufferSize = size;
  }
}

export default BufferService; 