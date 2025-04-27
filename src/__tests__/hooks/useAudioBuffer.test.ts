import { renderHook, act } from '@testing-library/react';
import { useAudioBuffer } from '../../app/hooks/useAudioBuffer';
import BufferService from '../../app/services/bufferService';

// Mock the BufferService
jest.mock('../../app/services/bufferService', () => {
  return jest.fn().mockImplementation(({ onBufferFull }) => {
    return {
      addToBuffer: jest.fn((audioData) => {
        if (audioData.length >= 1000) {
          onBufferFull(audioData);
        }
      }),
      getCurrentBufferSize: jest.fn().mockReturnValue(500),
      forceProcess: jest.fn(),
      clearBuffer: jest.fn(),
    };
  });
});

describe('useAudioBuffer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAudioBuffer(true));
    
    expect(result.current.bufferSize).toBe(0);
    expect(result.current.isProcessing).toBe(false);
    expect(BufferService).toHaveBeenCalledWith(expect.objectContaining({
      maxBufferSize: expect.any(Number),
      onBufferFull: expect.any(Function)
    }));
  });
  
  test('should add audio data to buffer when active', () => {
    const { result } = renderHook(() => useAudioBuffer(true));
    
    const audioData = new Float32Array(100);
    
    act(() => {
      result.current.addToBuffer(audioData);
    });
    
    // Check bufferService.addToBuffer was called
    const mockBufferService = (BufferService as jest.Mock).mock.results[0].value;
    expect(mockBufferService.addToBuffer).toHaveBeenCalledWith(audioData);
    expect(result.current.bufferSize).toBe(500);
  });
  
  test('should not add audio data to buffer when inactive', () => {
    const { result } = renderHook(() => useAudioBuffer(false));
    
    const audioData = new Float32Array(100);
    
    act(() => {
      result.current.addToBuffer(audioData);
    });
    
    // Check bufferService.addToBuffer was not called
    const mockBufferService = (BufferService as jest.Mock).mock.results[0].value;
    expect(mockBufferService.addToBuffer).not.toHaveBeenCalled();
  });
  
  test('should trigger buffer full callback when buffer is full', () => {
    const { result } = renderHook(() => useAudioBuffer(true));
    
    // Create large audio data that will trigger onBufferFull
    const audioData = new Float32Array(1024);
    
    act(() => {
      result.current.addToBuffer(audioData);
    });
    
    // Processing state should be true initially
    expect(result.current.isProcessing).toBe(true);
    
    // Advance timers to simulate processing completion
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Processing state should be false after timeout
    expect(result.current.isProcessing).toBe(false);
  });
  
  test('should force process current buffer', () => {
    const { result } = renderHook(() => useAudioBuffer(true));
    
    // Mock getCurrentBufferSize to return a positive value
    const mockBufferService = (BufferService as jest.Mock).mock.results[0].value;
    mockBufferService.getCurrentBufferSize.mockReturnValueOnce(100);
    
    act(() => {
      result.current.forceProcess();
    });
    
    // Check forceProcess was called
    expect(mockBufferService.forceProcess).toHaveBeenCalledTimes(1);
    expect(result.current.bufferSize).toBe(0);
  });
  
  test('should not force process when buffer is empty', () => {
    const { result } = renderHook(() => useAudioBuffer(true));
    
    // Mock getCurrentBufferSize to return zero
    const mockBufferService = (BufferService as jest.Mock).mock.results[0].value;
    mockBufferService.getCurrentBufferSize.mockReturnValueOnce(0);
    
    act(() => {
      result.current.forceProcess();
    });
    
    // Check forceProcess was not called
    expect(mockBufferService.forceProcess).not.toHaveBeenCalled();
  });
  
  test('should clear buffer', () => {
    const { result } = renderHook(() => useAudioBuffer(true));
    
    act(() => {
      result.current.clearBuffer();
    });
    
    // Check clearBuffer was called
    const mockBufferService = (BufferService as jest.Mock).mock.results[0].value;
    expect(mockBufferService.clearBuffer).toHaveBeenCalledTimes(1);
    expect(result.current.bufferSize).toBe(0);
  });
  
  test('should process remaining audio when becoming inactive', () => {
    const { rerender } = renderHook(
      (isActive) => useAudioBuffer(isActive),
      { initialProps: true }
    );
    
    // Mock getCurrentBufferSize to return a positive value
    const mockBufferService = (BufferService as jest.Mock).mock.results[0].value;
    mockBufferService.getCurrentBufferSize.mockReturnValueOnce(100);
    
    // Change isActive to false
    rerender(false);
    
    // Check forceProcess was called
    expect(mockBufferService.forceProcess).toHaveBeenCalledTimes(1);
  });
  
  test('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useAudioBuffer(true));
    
    unmount();
    
    // Check clearBuffer was called during cleanup
    const mockBufferService = (BufferService as jest.Mock).mock.results[0].value;
    expect(mockBufferService.clearBuffer).toHaveBeenCalledTimes(1);
  });
}); 