import { WhisperService } from '../../app/services/whisperService';
import { PythonProcessManager } from '../../app/server/pythonProcessManager';

// Mock implementation for PythonProcessManager
const mockStartProcess = jest.fn().mockResolvedValue(undefined);
const mockStopProcess = jest.fn().mockResolvedValue(undefined);
const mockIsRunning = jest.fn().mockReturnValue(true);
const mockProcessAudio = jest.fn().mockImplementation(async () => {
  return {
    words: [
      { text: 'hello', start: 0, end: 0.5, confidence: 0.95 },
      { text: 'world', start: 0.6, end: 1.0, confidence: 0.92 },
    ],
    text: 'hello world',
    processing_time: 0.5,
  };
});

// Create the mock class
jest.mock('../../app/server/pythonProcessManager', () => {
  return {
    PythonProcessManager: jest.fn().mockImplementation(() => ({
      startProcess: mockStartProcess,
      stopProcess: mockStopProcess,
      processAudio: mockProcessAudio,
      isRunning: mockIsRunning,
    })),
  };
});

describe('WhisperService', () => {
  let whisperService: WhisperService;

  beforeEach(() => {
    jest.clearAllMocks();
    whisperService = new WhisperService();
  });

  test('should initialize correctly', () => {
    expect(whisperService).toBeDefined();
    expect(PythonProcessManager).toHaveBeenCalled();
  });

  test('should start the transcription process', async () => {
    await whisperService.start();

    expect(mockStartProcess).toHaveBeenCalled();
    expect(whisperService.isActive()).toBe(true);
  });

  test('should stop the transcription process', async () => {
    await whisperService.start();
    await whisperService.stop();

    expect(mockStopProcess).toHaveBeenCalled();
    expect(whisperService.isActive()).toBe(false);
  });

  test('should transcribe audio data and return words with timestamps', async () => {
    // Start the service
    await whisperService.start();

    // Mock audio data
    const audioData = new Float32Array([0.1, 0.2, 0.3]);
    const sampleRate = 16000;

    // Transcribe audio
    const result = await whisperService.transcribeAudio(audioData, sampleRate);

    // Verify process audio was called
    expect(mockProcessAudio).toHaveBeenCalledWith(audioData, sampleRate);

    // Check result
    expect(result).toHaveProperty('words');
    expect(result.words).toHaveLength(2);
    expect(result.words[0]).toHaveProperty('word', 'hello');
    expect(result.words[0]).toHaveProperty('startTime', 0);
    expect(result.words[0]).toHaveProperty('endTime', 0.5);
    expect(result.words[0]).toHaveProperty('confidence', 0.95);
  });

  test('should convert WhisperX word format to application word format', async () => {
    // Start the service
    await whisperService.start();

    // Override the mock implementation for this test
    mockProcessAudio.mockResolvedValueOnce({
      words: [{ text: 'hello', start: 0, end: 0.5, confidence: 0.95 }],
      text: 'hello',
      processing_time: 0.2,
    });

    // Transcribe audio
    const result = await whisperService.transcribeAudio(new Float32Array([0.1]), 16000);

    // Check format conversion
    expect(result.words[0]).toEqual({
      word: 'hello',
      startTime: 0,
      endTime: 0.5,
      confidence: 0.95,
      id: expect.any(String),
    });
  });

  test('should handle errors during transcription', async () => {
    // Start the service
    await whisperService.start();

    // Mock error during processing
    mockProcessAudio.mockRejectedValueOnce(new Error('Processing error'));

    // Attempt to transcribe should throw error
    await expect(whisperService.transcribeAudio(new Float32Array([0.1]), 16000)).rejects.toThrow(
      'Transcription failed: Processing error'
    );
  });

  test('should handle restart of transcription process', async () => {
    // We need to set up the mock to properly simulate the restart scenario

    // First mock isRunning to return false initially
    mockIsRunning.mockReturnValueOnce(false);

    // Now try to transcribe - this should trigger a start
    await whisperService.transcribeAudio(new Float32Array([0.1]), 16000);

    // Verify process was started
    expect(mockStartProcess).toHaveBeenCalledTimes(1);
  });
});
