import { PythonProcessManager } from '../server/pythonProcessManager';
import { MessageProtocol } from '../lib/messageProtocol';
import {
  TranscriptionResult,
  WhisperXStatus,
  WhisperXOptions,
  WhisperXError,
} from '../types/whisper';
import { EventEmitter } from 'events';

/**
 * WhisperService events
 */
export enum WhisperServiceEvent {
  STATUS_CHANGE = 'status_change',
  ERROR = 'error',
  TRANSCRIPTION_COMPLETE = 'transcription_complete',
}

/**
 * Service for interaction with WhisperX speech recognition
 */
export class WhisperService extends EventEmitter {
  private processManager: PythonProcessManager;
  private messageProtocol: MessageProtocol;
  private active: boolean = false;
  private options: WhisperXOptions = {
    model: 'base',
    device: 'cpu',
    language: 'en',
  };
  private status: WhisperXStatus = {
    isActive: false,
    model: this.options.model,
    device: this.options.device,
    uptime: 0,
    lastActivity: 0,
    avgProcessingTime: 0,
  };
  private startTime: number = 0;
  private processingTimes: number[] = [];

  constructor(options?: Partial<WhisperXOptions>) {
    super();
    this.processManager = new PythonProcessManager();
    this.messageProtocol = new MessageProtocol();

    // Apply options if provided
    if (options) {
      this.setOptions(options);
    }
  }

  /**
   * Start the WhisperX service
   */
  async start(): Promise<void> {
    if (this.active) {
      return; // Already running
    }

    try {
      await this.processManager.startProcess();
      this.active = true;
      this.startTime = Date.now();

      this.updateStatus({
        isActive: true,
        model: this.options.model,
        device: this.options.device,
        uptime: 0,
        lastActivity: Date.now(),
      });

      console.log('WhisperX service started');
    } catch (error) {
      this.active = false;
      this.emitError('start_failed', `Failed to start WhisperX service: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Stop the WhisperX service
   */
  async stop(): Promise<void> {
    if (!this.active) {
      return; // Already stopped
    }

    try {
      await this.processManager.stopProcess();
    } finally {
      this.active = false;
      this.processingTimes = [];
      this.updateStatus({ isActive: false });
      console.log('WhisperX service stopped');
    }
  }

  /**
   * Check if the service is active
   */
  isActive(): boolean {
    return this.active && this.processManager.isRunning();
  }

  /**
   * Get current service status
   */
  getStatus(): WhisperXStatus {
    // Update uptime if active
    if (this.active) {
      this.status.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    }

    return { ...this.status };
  }

  /**
   * Transcribe audio data
   */
  async transcribeAudio(audioData: Float32Array, sampleRate: number): Promise<TranscriptionResult> {
    // Make sure service is running
    if (!this.isActive()) {
      console.log('WhisperX service not active, starting...');
      await this.start();
    }

    console.log(`[WHISPER] Processing audio data: ${audioData.length} samples at ${sampleRate}Hz`);

    // Update status
    this.updateStatus({ lastActivity: Date.now() });

    try {
      // Process audio
      const startTime = Date.now();
      const result = await this.processManager.processAudio(audioData, sampleRate);
      const processingTime = Date.now() - startTime;

      // Update processing time metrics
      this.processingTimes.push(processingTime);
      if (this.processingTimes.length > 10) {
        this.processingTimes.shift(); // Keep only last 10 times
      }

      // Calculate average processing time
      const avgProcessingTime =
        this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
      this.updateStatus({ avgProcessingTime });

      // Convert to app format
      const transcriptionResult = this.messageProtocol.parseTranscriptionResult(
        result,
        'session-id'
      );

      // Emit transcription complete event
      this.emit(WhisperServiceEvent.TRANSCRIPTION_COMPLETE, transcriptionResult);

      return transcriptionResult;
    } catch (error) {
      this.emitError('transcription_failed', `Transcription failed: ${error.message}`, error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Set service options
   */
  setOptions(options: Partial<WhisperXOptions>): void {
    this.options = { ...this.options, ...options };

    // Update status
    this.updateStatus({
      model: this.options.model,
      device: this.options.device,
    });
  }

  /**
   * Get current options
   */
  getOptions(): WhisperXOptions {
    return { ...this.options };
  }

  /**
   * Update status and emit events
   */
  private updateStatus(updates: Partial<WhisperXStatus>): void {
    this.status = { ...this.status, ...updates };
    this.emit(WhisperServiceEvent.STATUS_CHANGE, this.status);
  }

  /**
   * Emit error event
   */
  private emitError(code: string, message: string, details?: unknown): void {
    const error: WhisperXError = { code, message, details };
    this.emit(WhisperServiceEvent.ERROR, error);
  }
}
