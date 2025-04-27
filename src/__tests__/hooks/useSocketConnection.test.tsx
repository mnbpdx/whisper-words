import { renderHook, act } from '@testing-library/react';
import useSocketConnection from '../../app/hooks/useSocketConnection';
import { SocketEvent } from '../../app/lib/socketConfig';

// Create event handler storage
const eventHandlers: Record<string, Array<(data: any) => void>> = {};

// Mock socket object
const mockSocket = {
  on: jest.fn(function(event, callback) {
    if (!eventHandlers[event]) {
      eventHandlers[event] = [];
    }
    eventHandlers[event].push(callback);
  }),
  
  emit: jest.fn(function(event, data, callback) {
    if (callback && event === SocketEvent.SESSION_CREATE) {
      callback({ sessionId: 'test-session-123' });
    }
    if (callback && event === SocketEvent.SESSION_DESTROY) {
      callback({ success: true });
    }
  }),
  
  off: jest.fn(),
  disconnect: jest.fn(function() { return this; }),
  connect: jest.fn(),
  connected: true,
  
  // Function to simulate an event being triggered
  _simulateEvent: function(event, data) {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(function(callback) {
        callback(data);
      });
    }
  }
};

// Mock the socket.io-client module
jest.mock('socket.io-client', () => {
  return {
    io: jest.fn(() => mockSocket)
  };
});

// Get access to the io function from the mock
const io = require('socket.io-client').io;

// Mock console to suppress log messages
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

describe('useSocketConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear event handlers
    Object.keys(eventHandlers).forEach(key => {
      delete eventHandlers[key];
    });
  });

  test('should initialize with correct default values', () => {
    const { result } = renderHook(() => useSocketConnection());
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.sessionId).toBeNull();
  });

  test('should connect when autoConnect is true', () => {
    renderHook(() => useSocketConnection(true));
    
    expect(io).toHaveBeenCalled();
    expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.CONNECT, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.DISCONNECT, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.ERROR, expect.any(Function));
  });

  test('should connect when connect function is called', () => {
    const { result } = renderHook(() => useSocketConnection());
    
    act(() => {
      result.current.connect();
    });
    
    expect(io).toHaveBeenCalled();
    expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.CONNECT, expect.any(Function));
  });

  test('should update connection status when socket connects', () => {
    const { result } = renderHook(() => useSocketConnection());
    
    act(() => {
      result.current.connect();
      // Simulate connect event
      mockSocket._simulateEvent(SocketEvent.CONNECT, {});
    });
    
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should update connection status when socket disconnects', () => {
    const { result } = renderHook(() => useSocketConnection());
    
    act(() => {
      result.current.connect();
      // Simulate connect then disconnect
      mockSocket._simulateEvent(SocketEvent.CONNECT, {});
      mockSocket._simulateEvent(SocketEvent.DISCONNECT, {});
    });
    
    expect(result.current.isConnected).toBe(false);
  });

  test('should update connection status on error', () => {
    const { result } = renderHook(() => useSocketConnection());
    
    act(() => {
      result.current.connect();
      // Simulate error
      mockSocket._simulateEvent(SocketEvent.ERROR, { message: 'Test error' });
    });
    
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Test error');
  });

  test('should create a session', async () => {
    const { result } = renderHook(() => useSocketConnection());
    
    await act(async () => {
      await result.current.createSession();
    });
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      SocketEvent.SESSION_CREATE,
      expect.objectContaining({ deviceInfo: expect.any(Object) }),
      expect.any(Function)
    );
    expect(result.current.sessionId).toBe('test-session-123');
  });

  test('should end a session', async () => {
    const { result } = renderHook(() => useSocketConnection());
    
    await act(async () => {
      await result.current.createSession();
    });
    
    // Clear previous emit calls
    mockSocket.emit.mockClear();
    
    await act(async () => {
      await result.current.endSession();
    });
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      SocketEvent.SESSION_DESTROY,
      expect.objectContaining({ sessionId: 'test-session-123' }),
      expect.any(Function)
    );
    expect(result.current.sessionId).toBeNull();
  });

  test('should disconnect and clean up', () => {
    const { result, unmount } = renderHook(() => useSocketConnection(true));
    
    act(() => {
      result.current.disconnect();
    });
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.sessionId).toBeNull();
    
    // Test cleanup on unmount
    unmount();
    // Already disconnected, so disconnect should have been called once
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
}); 