import { io } from 'socket.io-client';

// Define constants for events to use in mocks
const SESSION_CREATE = 'session_create';
const SESSION_DESTROY = 'session_destroy';
const AUDIO_DATA = 'audio_data';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn().mockImplementation((event, data, callback) => {
      if (callback && event === SESSION_CREATE) {
        callback({ sessionId: 'test-session-123' });
      }
      if (callback && event === SESSION_DESTROY) {
        callback({ success: true });
      }
    }),
    once: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn().mockReturnThis(),
    connect: jest.fn(),
    connected: true
  };
  
  return {
    io: jest.fn(() => mockSocket)
  };
});

// Use the mock socket from the mock
const mockIo = io as jest.Mock;
const mockSocket = mockIo();

// Import after mocking
import { SocketService } from '../../app/services/socketService';
import { SocketEvent } from '../../app/lib/socketConfig';

describe('SocketService', () => {
  let socketService: SocketService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    socketService = new SocketService();
  });
  
  test('should connect to socket server', () => {
    const socket = socketService.connect();
    
    expect(mockIo).toHaveBeenCalled();
    expect(socket).toBe(mockSocket);
    expect(socketService.isConnected()).toBe(true);
  });
  
  test('should connect with session ID', () => {
    const sessionId = 'existing-session-123';
    socketService.connect(sessionId);
    
    expect(mockIo).toHaveBeenCalledWith(expect.any(String), 
      expect.objectContaining({
        query: { sessionId }
      })
    );
    expect(socketService.getSessionId()).toBe(sessionId);
  });
  
  test('should disconnect', () => {
    socketService.connect();
    socketService.disconnect();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(socketService.isConnected()).toBe(false);
    expect(socketService.getSocket()).toBeNull();
  });
  
  test('should create a session', async () => {
    socketService.connect();
    const sessionId = await socketService.createSession({ device: 'test', browser: 'test', os: 'test' });
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      SocketEvent.SESSION_CREATE,
      expect.objectContaining({ deviceInfo: expect.any(Object) }),
      expect.any(Function)
    );
    expect(sessionId).toBe('test-session-123');
    expect(socketService.getSessionId()).toBe('test-session-123');
  });
  
  test('should end a session', async () => {
    socketService.connect();
    // Set a session ID first
    await socketService.createSession();
    
    await socketService.endSession();
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      SocketEvent.SESSION_DESTROY,
      expect.objectContaining({ sessionId: 'test-session-123' }),
      expect.any(Function)
    );
    expect(socketService.getSessionId()).toBeNull();
  });
  
  test('should emit events', () => {
    socketService.connect();
    
    const emitted = socketService.emit(SocketEvent.AUDIO_DATA, { data: new Uint8Array([1, 2, 3]) });
    
    expect(emitted).toBe(true);
    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.AUDIO_DATA, expect.any(Object));
  });
  
  test('should register event listeners', () => {
    socketService.connect();
    const callback = jest.fn();
    
    socketService.on(SocketEvent.AUDIO_DATA, callback);
    
    expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.AUDIO_DATA, callback);
  });
  
  test('should register one-time event listeners', () => {
    socketService.connect();
    const callback = jest.fn();
    
    socketService.once(SocketEvent.AUDIO_DATA, callback);
    
    expect(mockSocket.once).toHaveBeenCalledWith(SocketEvent.AUDIO_DATA, callback);
  });
  
  test('should remove event listeners', () => {
    socketService.connect();
    const callback = jest.fn();
    
    socketService.on(SocketEvent.AUDIO_DATA, callback);
    socketService.off(SocketEvent.AUDIO_DATA, callback);
    
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.AUDIO_DATA, callback);
  });
}); 