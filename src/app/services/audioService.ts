type AudioCaptureCallback = (audioData: Float32Array) => void;

interface AudioServiceOptions {
  sampleRate?: number;
  bufferSize?: number;
  channelCount?: number;
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isRecording: boolean = false;
  private onAudioDataCallback: AudioCaptureCallback | null = null;
  private options: AudioServiceOptions;

  constructor(options: AudioServiceOptions = {}) {
    this.options = {
      sampleRate: options.sampleRate || 16000, // Target sample rate for processing, not for AudioContext
      bufferSize: options.bufferSize || 4096,
      channelCount: options.channelCount || 1,
    };
  }

  public async requestPermission(): Promise<PermissionState> {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissionStatus.state as PermissionState;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return 'prompt';
    }
  }

  public async initialize(): Promise<boolean> {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
      
      console.log(`Using browser's AudioContext sample rate: ${this.audioContext.sampleRate}Hz`);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.options.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.mediaStream = stream;
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      
      // Create script processor for handling audio data
      this.processor = this.audioContext.createScriptProcessor(
        this.options.bufferSize,
        this.options.channelCount!,
        this.options.channelCount!
      );

      this.processor.onaudioprocess = this.handleAudioProcess.bind(this);
      
      // Connect the nodes but don't start processing yet
      this.mediaStreamSource.connect(this.processor);
      
      return true;
    } catch (error) {
      console.error('Error initializing audio capture:', error);
      this.cleanup();
      return false;
    }
  }

  public startCapture(callback: AudioCaptureCallback): void {
    if (!this.audioContext || !this.processor || !this.mediaStreamSource) {
      throw new Error('Audio service not initialized. Call initialize() first.');
    }

    this.onAudioDataCallback = callback;
    
    // Connect the processor to the destination to start audio processing
    this.processor.connect(this.audioContext.destination);
    this.isRecording = true;
    
    // Resume audio context if it's suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public stopCapture(): void {
    if (!this.isRecording) return;

    if (this.processor && this.audioContext) {
      this.processor.disconnect(this.audioContext.destination);
    }
    
    this.isRecording = false;
  }

  public cleanup(): void {
    this.stopCapture();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
      this.audioContext = null;
    }
    
    this.onAudioDataCallback = null;
  }

  private handleAudioProcess(event: AudioProcessingEvent): void {
    if (!this.isRecording || !this.onAudioDataCallback) return;

    // Get audio data from first channel
    const audioData = event.inputBuffer.getChannelData(0);
    
    // Pass the audio data to the callback
    this.onAudioDataCallback(audioData);
  }
  
  // Helper method for future use to resample audio data if needed
  private resampleIfNeeded(audioData: Float32Array, originalSampleRate: number, targetSampleRate: number): Float32Array {
    // If sample rates match, no resampling needed
    if (originalSampleRate === targetSampleRate) {
      return audioData;
    }
    
    // For now, just log that resampling would be needed
    // In a production app, we would implement proper resampling here
    console.log(`Note: Audio would need resampling from ${originalSampleRate}Hz to ${targetSampleRate}Hz`);
    
    // Return original data for now
    return audioData;
  }
}

// Export singleton instance
export default new AudioService(); 