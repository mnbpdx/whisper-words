import { useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { SocketEvent } from '../lib/socketConfig';
import { SocketEventPayloadMap, EmitEvent } from '../lib/socketEvents';

// Individual event hook
export function useSocketEvent<E extends SocketEvent>(
  socket: Socket | null,
  event: E,
  callback: (payload: any) => void,
  deps: any[] = []
) {
  useEffect(() => {
    if (!socket) return;
    
    // Add event listener
    socket.on(event, callback);
    
    // Clean up on unmount
    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback, ...deps]);
}

// Hook for emitting events
export function useSocketEmitter(socket: Socket | null) {
  const emit = useCallback(<E extends SocketEvent>(
    event: E,
    payload: any
  ): boolean => {
    if (!socket) return false;
    
    socket.emit(event, payload);
    return true;
  }, [socket]);
  
  return { emit };
}

// Main hook that combines functionality
export function useSocketEvents(socket: Socket | null) {
  const { emit } = useSocketEmitter(socket);
  
  // Register an event handler
  const registerEventHandler = useCallback(
    <E extends SocketEvent>(event: E, handler: (payload: any) => void) => {
      if (!socket) return () => {};
      
      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    },
    [socket]
  );
  
  // Unregister an event handler
  const unregisterEventHandler = useCallback(
    <E extends SocketEvent>(event: E, handler: (payload: any) => void) => {
      if (!socket) return;
      socket.off(event, handler);
    },
    [socket]
  );
  
  // Emit an event with the correct type
  const emitEvent = useCallback(
    <E extends SocketEvent>(event: E, payload: any) => {
      return emit(event, payload);
    },
    [emit]
  );
  
  return {
    registerEventHandler,
    unregisterEventHandler,
    emitEvent,
  };
}

export default useSocketEvents;

export function useTranscriptionResults(
  socket: Socket | null,
  onNewWords: (words: SocketEventPayloadMap[SocketEvent.TRANSCRIPTION_RESULT]['words']) => void
) {
  useSocketEvent(
    socket,
    SocketEvent.TRANSCRIPTION_RESULT,
    (payload) => {
      onNewWords(payload.words);
    },
    [onNewWords]
  );
}

export function useConnectionStatus(
  socket: Socket | null,
  onStatusChange: (connected: boolean) => void
) {
  // Handle connect event
  useSocketEvent(
    socket,
    SocketEvent.CONNECT,
    () => {
      onStatusChange(true);
    },
    [onStatusChange]
  );
  
  // Handle disconnect event
  useSocketEvent(
    socket,
    SocketEvent.DISCONNECT,
    () => {
      onStatusChange(false);
    },
    [onStatusChange]
  );
  
  // Initial status
  useEffect(() => {
    if (socket) {
      onStatusChange(socket.connected);
    }
  }, [socket, onStatusChange]);
} 