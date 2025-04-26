import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { SocketService } from '../services/socketService';
import { SocketEvent, ConnectionStatus, initialConnectionStatus } from '../lib/socketConfig';

// Create singleton socket service
const socketService = new SocketService();

export function useSocketConnection(autoConnect = false) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Connect to socket server
  const connect = useCallback(() => {
    if (socketService.isConnected()) {
      socketRef.current = socketService.getSocket();
      setConnectionStatus(prev => ({ ...prev, connected: true }));
      return socketRef.current;
    }
    
    try {
      const socket = socketService.connect();
      socketRef.current = socket;
      
      // Setup event listeners
      socket.on(SocketEvent.CONNECT, () => {
        console.log('Socket connected');
        setConnectionStatus({
          connected: true,
          reconnecting: false,
          error: null,
        });
      });
      
      socket.on(SocketEvent.DISCONNECT, () => {
        console.log('Socket disconnected');
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
        }));
      });
      
      socket.on(SocketEvent.ERROR, (error: { message: string }) => {
        console.error('Socket error:', error);
        setConnectionStatus(prev => ({
          ...prev,
          error: error.message,
        }));
      });
      
      socket.on(SocketEvent.RECONNECT_ATTEMPT, (attempt: number) => {
        console.log(`Socket reconnection attempt ${attempt}`);
        setConnectionStatus(prev => ({
          ...prev,
          reconnecting: true,
        }));
      });
      
      socket.on(SocketEvent.RECONNECT, () => {
        console.log('Socket reconnected');
        setConnectionStatus({
          connected: true,
          reconnecting: false,
          error: null,
        });
      });
      
      socket.on(SocketEvent.CONNECTION_STATUS, (status: ConnectionStatus) => {
        setConnectionStatus(status);
      });
      
      return socket;
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setConnectionStatus({
        connected: false,
        reconnecting: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }, []);
  
  // Disconnect from socket server
  const disconnect = useCallback(() => {
    socketService.disconnect();
    socketRef.current = null;
    setConnectionStatus({
      connected: false,
      reconnecting: false,
      error: null,
    });
    setSessionId(null);
  }, []);
  
  // Create a new session
  const createSession = useCallback(async () => {
    if (!socketService.isConnected()) {
      connect();
    }
    
    try {
      const deviceInfo = {
        browser: navigator.userAgent,
        os: navigator.platform,
        device: 'web',
      };
      
      const newSessionId = await socketService.createSession(deviceInfo);
      setSessionId(newSessionId);
      return newSessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      setConnectionStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create session',
      }));
      return null;
    }
  }, [connect]);
  
  // End the current session
  const endSession = useCallback(async () => {
    if (sessionId) {
      try {
        await socketService.endSession();
        setSessionId(null);
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    }
  }, [sessionId]);
  
  // Auto-connect if needed
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);
  
  // Get socket instance
  const getSocket = useCallback(() => {
    return socketRef.current || socketService.getSocket();
  }, []);
  
  return {
    connectionStatus,
    sessionId,
    connect,
    disconnect,
    createSession,
    endSession,
    getSocket,
    isConnected: connectionStatus.connected,
    isReconnecting: connectionStatus.reconnecting,
    error: connectionStatus.error ? new Error(connectionStatus.error) : null,
  };
}

export default useSocketConnection; 