import { renderHook, act } from '@testing-library/react';
import { useAudioStreaming } from '../../app/hooks/useAudioStreaming';
import useAudioCapture from '../../app/hooks/useAudioCapture';
import useSocketConnection from '../../app/hooks/useSocketConnection';
import useSocketEvents from '../../app/hooks/useSocketEvents';
import { SocketEvent } from '../../app/lib/socketConfig';

// Mock the dependency hooks
jest.mock('../../app/hooks/useAudioCapture', () => {
  return jest.fn().mockImplementation(() => ({
    startCapture: jest.fn().mockResolvedValue(undefined),
    stopCapture: jest.fn(),
    isCapturing: false,
    audioChunks: [],
    error: null,
    audioState: {
      isActive: false,
      isListening: false,
      micPermission: 'granted',
      error: null
    },
    clearError: jest.fn()
  }));
});

jest.mock('../../app/hooks/useSocketConnection', () => {
  return jest.fn().mockImplementation(() => ({
    socket: {},
    isConnected: true,
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    error: null
  }));
});

jest.mock('../../app/hooks/useSocketEvents', () => {
  return jest.fn().mockImplementation(() => ({
    emitEvent: jest.fn(),
    registerEventHandler: jest.fn().mockReturnValue(jest.fn()),
    unregisterEventHandler: jest.fn()
  }));
});

// We're not going to mock React's useState directly, as that's causing the hook order issues
// Instead, we'll mock the entire component under test when needed

describe('useAudioStreaming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAudioStreaming());
    
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  test('should start streaming when enabled is true', async () => {
    const onStreamingStartMock = jest.fn();
    
    // Set up the startCapture mock to resolve immediately
    const startCaptureMock = jest.fn().mockResolvedValue(undefined);
    (useAudioCapture as jest.Mock).mockImplementation(() => ({
      startCapture: startCaptureMock,
      stopCapture: jest.fn(),
      isCapturing: false,
      audioChunks: [],
      audioState: {
        isActive: false,
        isListening: false,
        micPermission: 'granted',
        error: null
      },
      error: null,
      clearError: jest.fn()
    }));
    
    // Initial render with enabled=false
    const { result, rerender } = renderHook(
      (props) => useAudioStreaming(props),
      { initialProps: { enabled: false, onStreamingStart: onStreamingStartMock } }
    );
    
    expect(result.current.isStreaming).toBe(false);
    
    // Change enabled to true
    await act(async () => {
      rerender({ enabled: true, onStreamingStart: onStreamingStartMock });
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Check that streaming started
    expect(startCaptureMock).toHaveBeenCalled();
    expect(onStreamingStartMock).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(true);
  });
  
  // Instead of using hook state mocking which causes order issues,
  // we'll test the effects indirectly through behavior
  test('should stop streaming when enabled is false', async () => {
    const onStreamingStopMock = jest.fn();
    const stopCaptureMock = jest.fn();
    
    // Setup with streaming initially enabled
    (useAudioCapture as jest.Mock).mockImplementation(() => ({
      startCapture: jest.fn().mockResolvedValue(undefined),
      stopCapture: stopCaptureMock,
      isCapturing: true,
      audioChunks: [],
      audioState: {
        isActive: true,
        isListening: true,
        micPermission: 'granted',
        error: null
      },
      error: null,
      clearError: jest.fn()
    }));
    
    // Render with enabled=true first
    const { result, rerender } = renderHook(
      (props) => useAudioStreaming(props),
      { initialProps: { enabled: true, onStreamingStop: onStreamingStopMock } }
    );
    
    // Wait for the initial rendering to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Change enabled to false
    await act(async () => {
      rerender({ enabled: false, onStreamingStop: onStreamingStopMock });
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Check that streaming stopped
    expect(stopCaptureMock).toHaveBeenCalled();
    expect(onStreamingStopMock).toHaveBeenCalled();
  });
  
  test('should emit audio chunks when new chunks are available', async () => {
    // Mock audio chunks
    const mockAudioChunks = [
      {
        data: new Float32Array(1024),
        timestamp: Date.now(),
        sampleRate: 16000,
        channelCount: 1
      }
    ];
    
    const emitEventMock = jest.fn();
    
    (useAudioCapture as jest.Mock).mockImplementation(() => ({
      startCapture: jest.fn().mockResolvedValue(undefined),
      stopCapture: jest.fn(),
      isCapturing: true,
      audioChunks: mockAudioChunks,
      audioState: {
        isActive: true,
        isListening: true,
        micPermission: 'granted',
        error: null
      },
      error: null,
      clearError: jest.fn()
    }));
    
    (useSocketEvents as jest.Mock).mockImplementation(() => ({
      emitEvent: emitEventMock,
      registerEventHandler: jest.fn().mockReturnValue(jest.fn()),
      unregisterEventHandler: jest.fn()
    }));
    
    // Render the hook with enabled=true
    renderHook(() => useAudioStreaming({ enabled: true }));
    
    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Check that the event was emitted with the audio chunk data
    expect(emitEventMock).toHaveBeenCalledWith(SocketEvent.AUDIO_CHUNK, expect.objectContaining({
      data: mockAudioChunks[0].data,
      timestamp: mockAudioChunks[0].timestamp,
      sampleRate: mockAudioChunks[0].sampleRate
    }));
  });
}); 