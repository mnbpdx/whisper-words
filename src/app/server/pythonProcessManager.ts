import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { TranscriptionResult, MessageProtocol } from '../lib/messageProtocol';

/**
 * Manager for the WhisperX Python process
 * Handles spawning, communication, and lifecycle management
 */
export class PythonProcessManager {
  private process: ChildProcess | null = null;
  private responseBuffer: string = '';
  private activeRequests: Map<
    string,
    {
      resolve: (result: TranscriptionResult) => void;
      reject: (error: Error) => void;
    }
  > = new Map();
  private requestId: number = 0;
  private messageProtocol = new MessageProtocol();
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    // Determine paths
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptPath = path.join(
      process.cwd(),
      'src',
      'app',
      'server',
      'python',
      'whisperx_wrapper.py'
    );

    // Ensure script exists
    if (!fs.existsSync(this.scriptPath)) {
      console.warn(`WhisperX wrapper script not found at ${this.scriptPath}`);
    }
  }

  /**
   * Check if Python process is running
   */
  isRunning(): boolean {
    return this.process !== null && this.process.pid !== undefined;
  }

  /**
   * Start the Python process
   */
  async startProcess(): Promise<void> {
    if (this.isRunning()) {
      return; // Already running
    }

    return new Promise((resolve, reject) => {
      try {
        // Spawn Python process
        this.process = spawn(this.pythonPath, [this.scriptPath], {
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        // Check if process started successfully
        if (!this.process || !this.process.pid) {
          throw new Error('Failed to start Python process');
        }

        console.log(`Started WhisperX Python process with PID ${this.process.pid}`);

        // Handle stdout (results)
        this.process.stdout.on('data', (data: Buffer) => {
          this.handleProcessOutput(data);
        });

        // Handle stderr (errors)
        this.process.stderr.on('data', (data: Buffer) => {
          const errorStr = data.toString();
          console.error(`WhisperX Python process error: ${errorStr}`);

          try {
            // Try to parse as JSON error
            const errorObj = JSON.parse(errorStr);
            if (this.messageProtocol.isErrorResponse(errorObj)) {
              // Reject all pending requests with this error
              this.rejectAllRequests(new Error(this.messageProtocol.getErrorMessage(errorObj)));
            }
          } catch {
            // Not JSON, just log the error
            console.error('Raw Python error:', errorStr);
          }
        });

        // Handle process exit
        this.process.on('exit', (code: number, signal: string) => {
          console.log(`WhisperX Python process exited with code ${code} and signal ${signal}`);
          this.process = null;
          this.rejectAllRequests(new Error(`Process exited with code ${code}`));
        });

        // Handle process error
        this.process.on('error', (error: Error) => {
          console.error('WhisperX Python process error:', error);
          this.process = null;
          reject(error);
        });

        // Initial startup delay to give process time to initialize
        setTimeout(() => {
          if (this.isRunning()) {
            resolve();
          } else {
            reject(new Error('Python process failed to start'));
          }
        }, 1000);
      } catch (error) {
        this.process = null;
        reject(error);
      }
    });
  }

  /**
   * Stop the Python process
   */
  async stopProcess(): Promise<void> {
    if (!this.isRunning() || !this.process) {
      return;
    }

    return new Promise((resolve) => {
      // Kill process
      this.process?.kill();

      // Clear resources
      this.process = null;
      this.responseBuffer = '';
      this.rejectAllRequests(new Error('Process was stopped'));

      resolve();
    });
  }

  /**
   * Process audio data with WhisperX
   */
  async processAudio(audioData: Float32Array, sampleRate: number): Promise<TranscriptionResult> {
    // Ensure process is running
    if (!this.isRunning()) {
      await this.startProcess();
    }

    // Generate unique request ID
    const requestId = `req_${++this.requestId}`;

    // Create message
    const message = this.messageProtocol.formatAudioDataMessage(audioData, sampleRate, requestId);

    return new Promise((resolve, reject) => {
      // Register request
      this.activeRequests.set(requestId, { resolve, reject });

      try {
        // Send message to Python process
        if (this.process?.stdin) {
          const messageStr = this.messageProtocol.serializeMessage(message);
          this.process.stdin.write(messageStr + '\n', 'utf8');
        } else {
          reject(new Error('Python process not available'));
        }
      } catch (error) {
        this.activeRequests.delete(requestId);
        reject(error);
      }
    });
  }

  /**
   * Handle output from Python process
   */
  private handleProcessOutput(data: Buffer): void {
    // Add to buffer
    this.responseBuffer += data.toString();

    // Try to extract complete JSON objects
    let jsonEndIndex: number;
    while ((jsonEndIndex = this.findJsonEnd()) !== -1) {
      const jsonStr = this.responseBuffer.substring(0, jsonEndIndex + 1);
      this.responseBuffer = this.responseBuffer.substring(jsonEndIndex + 1);

      try {
        // Parse JSON response
        const response = JSON.parse(jsonStr);

        // Check if it's an error
        if (this.messageProtocol.isErrorResponse(response)) {
          this.rejectAllRequests(new Error(this.messageProtocol.getErrorMessage(response)));
          continue;
        }

        // Valid transcription result
        if (this.messageProtocol.validateTranscriptionResult(response)) {
          // Resolve the first pending request
          const requestId = this.findOldestRequestId();
          if (requestId) {
            const request = this.activeRequests.get(requestId);
            if (request) {
              request.resolve(response);
              this.activeRequests.delete(requestId);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WhisperX response:', error);
      }
    }
  }

  /**
   * Find the end index of a complete JSON object in the buffer
   */
  private findJsonEnd(): number {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < this.responseBuffer.length; i++) {
      const char = this.responseBuffer[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
      } else if (char === '"') {
        inString = true;
      } else if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }

    return -1;
  }

  /**
   * Find the oldest pending request ID
   */
  private findOldestRequestId(): string | undefined {
    if (this.activeRequests.size === 0) {
      return undefined;
    }

    return Array.from(this.activeRequests.keys())[0];
  }

  /**
   * Reject all pending requests with an error
   */
  private rejectAllRequests(error: Error): void {
    for (const request of this.activeRequests.values()) {
      request.reject(error);
    }

    this.activeRequests.clear();
  }
}
