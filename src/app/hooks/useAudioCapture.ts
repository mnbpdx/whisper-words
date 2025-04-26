import { useState, useEffect, useCallback } from 'react';
import audioService from '../services/audioService';
import { AudioState, MicrophonePermissionState } from '../types/audio';

export const useAudioCapture = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    isActive: false,
    isListening: false,
    micPermission: 'prompt',
    error: null,
  });

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

  // Toggle audio capture
  const toggleAudioCapture = useCallback(async () => {
    if (audioState.isActive) {
      // Stop audio capture
      try {
        audioService.stopCapture();
        setAudioState(prevState => ({
          ...prevState,
          isActive: false,
          isListening: false,
        }));
      } catch (error) {
        setAudioState(prevState => ({
          ...prevState,
          error: 'Failed to stop audio capture.',
        }));
      }
    } else {
      // Start audio capture
      try {
        // Initialize audio if not already initialized
        if (!audioState.isListening) {
          const initialized = await audioService.initialize();
          if (!initialized) {
            throw new Error('Failed to initialize audio capture.');
          }
        }

        // Start audio capture with a callback for handling audio data
        audioService.startCapture((audioData) => {
          // In a real application, this would send the audio data to the buffer service
          // Here we're just setting the state to show it's working
          console.log('Audio data received:', audioData.length);
        });

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
      }
    }
  }, [audioState.isActive, audioState.isListening]);

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
  };
}; 