import { spawn } from 'child_process';
import { PythonProcessManager } from '../../app/server/pythonProcessManager';

// Mock child_process
jest.mock('child_process');

// Create mock objects
const mockStdin = { write: jest.fn().mockReturnValue(true), end: jest.fn() };
const mockStdout = { on: jest.fn() };
const mockStderr = { on: jest.fn() };
const mockOn = jest.fn();
const mockKill = jest.fn();

// Create mock process
const mockProcess = {
  stdin: mockStdin,
  stdout: mockStdout,
  stderr: mockStderr,
  on: mockOn,
  kill: mockKill,
  pid: 12345,
};

describe('PythonProcessManager', () => {
  let processManager: PythonProcessManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up spawn mock
    (spawn as jest.Mock).mockReturnValue(mockProcess);

    processManager = new PythonProcessManager();
  });

  test('should initialize correctly without starting a process', () => {
    expect(spawn).not.toHaveBeenCalled();
    expect(processManager.isRunning()).toBe(false);
  });

  test('should start Python process correctly', async () => {
    // Set up stdout behavior
    mockStdout.on.mockImplementation((event, callback) => {
      if (event === 'data') {
        callback(Buffer.from(JSON.stringify({ status: 'ready' })));
      }
    });

    // Start the process
    await processManager.startProcess();

    // Check that spawn was called
    expect(spawn).toHaveBeenCalledWith('python3', expect.any(Array), expect.any(Object));

    expect(processManager.isRunning()).toBe(true);
  });

  test('should process audio data correctly', async () => {
    // Mock the stdout behavior to resolve audio processing immediately
    let dataCallback: ((data: Buffer) => void) | null = null;

    mockStdout.on.mockImplementation((event, callback) => {
      if (event === 'data') {
        // Store callback for later use
        dataCallback = callback;
      }
    });

    // Start the process
    await processManager.startProcess();

    // Setup a promise for the audio processing
    const audioPromise = processManager.processAudio(new Float32Array([0.1, 0.2, 0.3]), 16000);

    // Immediately trigger the mock response
    if (dataCallback) {
      dataCallback(
        Buffer.from(
          JSON.stringify({
            words: [{ text: 'test', start: 0, end: 0.2, confidence: 0.9 }],
            text: 'test',
            processing_time: 0.1,
          })
        )
      );
    }

    // Now await the result
    const result = await audioPromise;

    // Verify stdin.write was called
    expect(mockStdin.write).toHaveBeenCalledWith(
      expect.stringContaining('"audio_data"'),
      expect.any(String)
    );

    // Check result structure
    expect(result).toHaveProperty('words');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('processing_time');
  }, 10000); // Increase timeout just in case

  test('should stop process correctly', async () => {
    // Mock stdout to ensure process starts
    mockStdout.on.mockImplementation((event, callback) => {
      if (event === 'data') {
        callback(Buffer.from(JSON.stringify({ status: 'ready' })));
      }
    });

    // Start and stop the process
    await processManager.startProcess();
    await processManager.stopProcess();

    // Verify kill was called
    expect(mockKill).toHaveBeenCalled();
  });
});
