import { useState, useEffect, useCallback, useRef } from 'react';
import audioService from '../services/audioService';
import { AudioState, MicrophonePermissionState, AudioChunk } from '../types/audio';

export const useAudioCapture = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    isActive: false,
    isListening: false,
    micPermission: 'prompt',
    error: null,
  });
  const [audioChunks, setAudioChunks] = useState<AudioChunk[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const chunksRef = useRef<AudioChunk[]>([]);

  // Check for microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permissionState = await audioService.requestPermission();
        setAudioState(prevState => ({
          ...prevState,
          micPermission: permissionState as MicrophonePermissionState,
        }));
      } catch (error) {
        console.error('Error checking microphone permission:', error);
      }
    };

    checkPermission();

    // Clean up audio service on unmount
    return () => {
      if (audioState.isActive) {
        audioService.cleanup();
      }
    };
  }, []);

  // Start audio capture
  const startCapture = useCallback(async () => {
    try {
      // Initialize audio if needed
      const initialized = await audioService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize audio capture.');
      }

      // Start capturing audio
      audioService.startCapture((audioData) => {
        const newChunk: AudioChunk = {
          data: audioData,
          timestamp: Date.now(),
          sampleRate: audioService.getSampleRate(),
          channelCount: audioService.getChannelCount(),
        };
        
        // Update the ref synchronously
        chunksRef.current = [...chunksRef.current, newChunk];
        
        // Update state (will cause re-render)
        setAudioChunks(chunksRef.current);
      });
      
      setIsCapturing(true);
      setAudioState(prevState => ({
        ...prevState,
        isActive: true,
        isListening: true,
        error: null,
      }));
    } catch (error) {
      console.error('Error starting audio capture:', error);
      setAudioState(prevState => ({
        ...prevState,
        error: 'Failed to start audio capture. Please check your microphone permissions.',
      }));
      throw error;
    }
  }, []);

  // Stop audio capture
  const stopCapture = useCallback(() => {
    try {
      audioService.stopCapture();
      setIsCapturing(false);
      setAudioState(prevState => ({
        ...prevState,
        isActive: false,
        isListening: false,
      }));
      // Clear chunks
      chunksRef.current = [];
      setAudioChunks([]);
    } catch (error) {
      setAudioState(prevState => ({
        ...prevState,
        error: 'Failed to stop audio capture.',
      }));
      throw error;
    }
  }, []);

  // Toggle audio capture
  const toggleAudioCapture = useCallback(async () => {
    if (audioState.isActive) {
      await stopCapture();
    } else {
      await startCapture();
    }
  }, [audioState.isActive, startCapture, stopCapture]);

  // Request microphone permission explicitly
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const initialized = await audioService.initialize();
      if (initialized) {
        // Stop the audio capture since we just wanted permission
        audioService.stopCapture();
        
        setAudioState(prevState => ({
          ...prevState,
          micPermission: 'granted',
          error: null,
        }));
      } else {
        setAudioState(prevState => ({
          ...prevState,
          micPermission: 'denied',
          error: 'Microphone permission denied.',
        }));
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setAudioState(prevState => ({
        ...prevState,
        error: 'Failed to request microphone permission.',
      }));
    }
  }, []);

  // Clear any error messages
  const clearError = useCallback(() => {
    setAudioState(prevState => ({
      ...prevState,
      error: null,
    }));
  }, []);

  return {
    audioState,
    toggleAudioCapture,
    requestMicrophonePermission,
    clearError,
    startCapture,
    stopCapture,
    isCapturing,
    audioChunks,
  };
};

export default useAudioCapture; 