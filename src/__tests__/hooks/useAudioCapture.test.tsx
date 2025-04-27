import { renderHook, act } from '@testing-library/react';
import { useAudioCapture } from '../../app/hooks/useAudioCapture';
import audioService from '../../app/services/audioService';
import React from 'react';

// Mock the audioService
jest.mock('../../app/services/audioService', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn().mockResolvedValue('granted'),
    initialize: jest.fn().mockResolvedValue(true),
    startCapture: jest.fn().mockImplementation(callback => {
      // Simulate audio data callback
      const audioData = new Float32Array(1024).fill(0.5);
      callback(audioData);
      return true;
    }),
    stopCapture: jest.fn().mockReturnValue(true),
    cleanup: jest.fn().mockReturnValue(true),
    getSampleRate: jest.fn().mockReturnValue(16000),
    getChannelCount: jest.fn().mockReturnValue(1)
  }
}));

describe('useAudioCapture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initialize with correct default state', async () => {
    const { result } = renderHook(() => useAudioCapture());
    
    // Initial state
    expect(result.current.audioState).toEqual({
      isActive: false,
      isListening: false,
      micPermission: 'prompt',
      error: null,
    });
    expect(result.current.audioChunks).toEqual([]);
    expect(result.current.isCapturing).toBe(false);
    
    // Wait for permission check to complete
    await act(async () => {
      // Wait for the useEffect to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // After permission check
    expect(result.current.audioState.micPermission).toBe('granted');
    expect(audioService.requestPermission).toHaveBeenCalledTimes(1);
  });
  
  test('should start audio capture when startCapture is called', async () => {
    const { result } = renderHook(() => useAudioCapture());
    
    // Wait for permission check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Start capture
    await act(async () => {
      await result.current.startCapture();
    });
    
    // Check state
    expect(result.current.audioState.isActive).toBe(true);
    expect(result.current.audioState.isListening).toBe(true);
    expect(result.current.isCapturing).toBe(true);
    
    // Check that audioService methods were called
    expect(audioService.initialize).toHaveBeenCalledTimes(1);
    expect(audioService.startCapture).toHaveBeenCalledTimes(1);
    
    // Verify audio chunks
    expect(result.current.audioChunks.length).toBe(1);
    expect(result.current.audioChunks[0].data).toBeInstanceOf(Float32Array);
    expect(result.current.audioChunks[0].sampleRate).toBe(16000);
    expect(result.current.audioChunks[0].channelCount).toBe(1);
  });
  
  test('should stop audio capture when stopCapture is called', async () => {
    const { result } = renderHook(() => useAudioCapture());
    
    // Wait for permission check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Start capture
    await act(async () => {
      await result.current.startCapture();
    });
    
    // Stop capture
    act(() => {
      result.current.stopCapture();
    });
    
    // Check state
    expect(result.current.audioState.isActive).toBe(false);
    expect(result.current.audioState.isListening).toBe(false);
    expect(result.current.isCapturing).toBe(false);
    
    // Check that audioService.stopCapture was called
    expect(audioService.stopCapture).toHaveBeenCalledTimes(1);
    
    // Verify audio chunks are cleared
    expect(result.current.audioChunks.length).toBe(0);
  });
  
  test('should toggle audio capture when toggleAudioCapture is called', async () => {
    const { result } = renderHook(() => useAudioCapture());
    
    // Wait for permission check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Toggle on
    await act(async () => {
      await result.current.toggleAudioCapture();
    });
    
    // Check state
    expect(result.current.audioState.isActive).toBe(true);
    expect(result.current.isCapturing).toBe(true);
    
    // Toggle off
    await act(async () => {
      await result.current.toggleAudioCapture();
    });
    
    // Check state
    expect(result.current.audioState.isActive).toBe(false);
    expect(result.current.isCapturing).toBe(false);
  });
  
  test('should handle errors during initialization', async () => {
    // Mock initialization failure
    (audioService.initialize as jest.Mock).mockRejectedValueOnce(new Error('Failed to initialize'));
    
    const { result } = renderHook(() => useAudioCapture());
    
    // Wait for permission check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Try to start capture
    await act(async () => {
      try {
        await result.current.startCapture();
      } catch (e) {
        // Expected error
      }
    });
    
    // Check error state
    expect(result.current.audioState.error).toBeTruthy();
    expect(result.current.audioState.isActive).toBe(false);
  });
  
  test('should request microphone permission explicitly', async () => {
    const { result } = renderHook(() => useAudioCapture());
    
    // Wait for permission check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Reset mock to test explicit permission request
    (audioService.initialize as jest.Mock).mockClear();
    
    // Request permission
    await act(async () => {
      await result.current.requestMicrophonePermission();
    });
    
    // Check that audioService.initialize was called
    expect(audioService.initialize).toHaveBeenCalledTimes(1);
    
    // Check permission state
    expect(result.current.audioState.micPermission).toBe('granted');
    expect(result.current.audioState.error).toBeNull();
  });
  
  test('should handle denied microphone permission', async () => {
    // Mock permission denied
    (audioService.initialize as jest.Mock).mockResolvedValueOnce(false);
    
    const { result } = renderHook(() => useAudioCapture());
    
    // Wait for permission check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Request permission
    await act(async () => {
      await result.current.requestMicrophonePermission();
    });
    
    // Check permission state
    expect(result.current.audioState.micPermission).toBe('denied');
    expect(result.current.audioState.error).toBe('Microphone permission denied.');
  });
  
  test('should clear errors when clearError is called', async () => {
    const { result } = renderHook(() => useAudioCapture());
    
    // Wait for permission check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Set error state manually using the exposed state setter
    await act(async () => {
      // @ts-ignore - Using private method for testing
      result.current.clearError();
      
      // Set error state
      result.current.audioState.error = 'Test error';
      
      // Clear error
      result.current.clearError();
    });
    
    // Check error state
    expect(result.current.audioState.error).toBeNull();
  });
  
  test('should clean up on unmount', async () => {
    // Create a new mock for the cleanup function
    const cleanupMock = jest.fn();
    (audioService.cleanup as jest.Mock).mockImplementation(cleanupMock);
    
    // Set a state flag to trigger the cleanup on unmount
    const mockSetState = jest.fn();
    // Mock useState to set isActive to true to ensure cleanup is called
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [{
      isActive: true,
      isListening: true,
      micPermission: 'granted',
      error: null
    }, mockSetState]);
    
    // Mock other useState calls
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [[], jest.fn()]); // audioChunks
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]); // isCapturing
    
    // Render the hook
    const { unmount } = renderHook(() => useAudioCapture());
    
    // Unmount to trigger cleanup
    unmount();
    
    // Verify that cleanup was called
    expect(cleanupMock).toHaveBeenCalled();
    
    // Restore mocks
    jest.spyOn(React, 'useState').mockRestore();
  });
}); 