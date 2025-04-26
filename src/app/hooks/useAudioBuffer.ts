import { useState, useEffect, useCallback, useRef } from 'react';
import BufferService from '../services/bufferService';

export const useAudioBuffer = (isActive: boolean) => {
  const bufferServiceRef = useRef<BufferService | null>(null);
  const [bufferSize, setBufferSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Initialize buffer service
  useEffect(() => {
    bufferServiceRef.current = new BufferService({
      maxBufferSize: 16000 * 2, // 2 seconds at 16kHz
      onBufferFull: (buffer: Float32Array) => {
        setIsProcessing(true);
        // In a real application, this would send the buffer to the server for processing
        console.log('Buffer full, size:', buffer.length);
        
        // Simulate processing time
        setTimeout(() => {
          setIsProcessing(false);
        }, 500);
      },
    });

    return () => {
      if (bufferServiceRef.current) {
        bufferServiceRef.current.clearBuffer();
      }
    };
  }, []);

  // Add audio data to buffer
  const addToBuffer = useCallback((audioData: Float32Array) => {
    if (bufferServiceRef.current && isActive) {
      bufferServiceRef.current.addToBuffer(audioData);
      setBufferSize(bufferServiceRef.current.getCurrentBufferSize());
    }
  }, [isActive]);

  // Force process the current buffer
  const forceProcess = useCallback(() => {
    if (bufferServiceRef.current && bufferServiceRef.current.getCurrentBufferSize() > 0) {
      bufferServiceRef.current.forceProcess();
      setBufferSize(0);
    }
  }, []);

  // Clear the buffer
  const clearBuffer = useCallback(() => {
    if (bufferServiceRef.current) {
      bufferServiceRef.current.clearBuffer();
      setBufferSize(0);
    }
  }, []);

  // Update buffer size when active state changes
  useEffect(() => {
    if (!isActive && bufferServiceRef.current) {
      // Process any remaining audio when stopping
      if (bufferServiceRef.current.getCurrentBufferSize() > 0) {
        bufferServiceRef.current.forceProcess();
      }
      setBufferSize(0);
    }
  }, [isActive]);

  return {
    bufferSize,
    isProcessing,
    addToBuffer,
    forceProcess,
    clearBuffer,
  };
}; 