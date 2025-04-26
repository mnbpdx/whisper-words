import { useState, useEffect, useCallback } from 'react';
import useAudioCapture from './useAudioCapture';
import useSocketConnection from './useSocketConnection';
import useSocketEvents from './useSocketEvents';
import { AudioChunk } from '../types/audio';
import { SocketEvent } from '../lib/socketConfig';

interface UseAudioStreamingProps {
  enabled?: boolean;
  onStreamingStart?: () => void;
  onStreamingStop?: () => void;
  onChunkSent?: (chunk: AudioChunk) => void;
  onChunkProcessed?: (result: any) => void;
  onError?: (error: Error) => void;
}

export const useAudioStreaming = ({
  enabled = false,
  onStreamingStart,
  onStreamingStop,
  onChunkSent,
  onChunkProcessed,
  onError,
}: UseAudioStreamingProps = {}) => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingError, setStreamingError] = useState<Error | null>(null);
  
  // Use audio capture hook to get audio data from microphone
  const {
    startCapture,
    stopCapture,
    isCapturing,
    audioChunks,
    error: captureError,
  } = useAudioCapture();
  
  // Use socket connection hook for real-time communication
  const {
    socket,
    isConnected,
    connect,
    disconnect,
    error: socketError,
  } = useSocketConnection();
  
  // Use socket events hook to handle events
  const { emitEvent, registerEventHandler } = useSocketEvents(socket);
  
  // Start streaming audio
  const startStreaming = useCallback(async () => {
    if (isStreaming) return;
    
    try {
      // Connect to socket if not already connected
      if (!isConnected) {
        await connect();
      }
      
      // Start audio capture
      await startCapture();
      
      setIsStreaming(true);
      onStreamingStart?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start streaming');
      setStreamingError(error);
      onError?.(error);
    }
  }, [isStreaming, isConnected, connect, startCapture, onStreamingStart, onError]);
  
  // Stop streaming audio
  const stopStreaming = useCallback(() => {
    if (!isStreaming) return;
    
    stopCapture();
    setIsStreaming(false);
    onStreamingStop?.();
  }, [isStreaming, stopCapture, onStreamingStop]);
  
  // Send audio chunks to server when new chunks are available
  useEffect(() => {
    if (!isStreaming || !isConnected || audioChunks.length === 0) return;
    
    const latestChunk = audioChunks[audioChunks.length - 1];
    
    emitEvent(SocketEvent.AUDIO_CHUNK, {
      data: latestChunk.data,
      timestamp: latestChunk.timestamp,
      sampleRate: latestChunk.sampleRate,
      channelCount: latestChunk.channelCount,
    });
    
    onChunkSent?.(latestChunk);
  }, [isStreaming, isConnected, audioChunks, emitEvent, onChunkSent]);
  
  // Register event handler for processed chunks
  useEffect(() => {
    if (!socket) return;
    
    const handleProcessedChunk = (result: any) => {
      onChunkProcessed?.(result);
    };
    
    const unregister = registerEventHandler(SocketEvent.TRANSCRIPTION_RESULT, handleProcessedChunk);
    
    return () => {
      unregister();
    };
  }, [socket, registerEventHandler, onChunkProcessed]);
  
  // Toggle streaming based on enabled prop
  useEffect(() => {
    if (enabled && !isStreaming) {
      startStreaming();
    } else if (!enabled && isStreaming) {
      stopStreaming();
    }
  }, [enabled, isStreaming, startStreaming, stopStreaming]);
  
  // Handle errors
  useEffect(() => {
    const error = captureError || socketError || streamingError;
    if (error) {
      onError?.(error);
    }
  }, [captureError, socketError, streamingError, onError]);
  
  return {
    isStreaming,
    startStreaming,
    stopStreaming,
    isCapturing,
    isConnected,
    error: captureError || socketError || streamingError,
  };
};

export default useAudioStreaming; 