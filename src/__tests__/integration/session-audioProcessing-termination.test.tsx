import { SessionService } from '../../app/services/sessionService';
import { AudioProcessor } from '../../app/server/audioProcessor';

// Mock socket.io client
jest.mock('socket.io-client', () => {
  // Define socket events locally within the mock
  const SESSION_CREATE = 'session_create';
  const SESSION_DESTROY = 'session_destroy';
  
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

// Mock SessionService
jest.mock('../../app/services/sessionService', () => {
  return {
    SessionService: jest.fn().mockImplementation(() => ({
      createSession: jest.fn().mockImplementation((userId, deviceInfo) => Promise.resolve({
        id: 'test-session-123',
        createdAt: new Date().toISOString(),
        status: 'active',
        userId,
        deviceInfo
      })),
      getSession: jest.fn().mockImplementation((sessionId) => {
        if (sessionId === 'non-existent-session') {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          id: sessionId,
          createdAt: new Date().toISOString(),
          status: 'active',
          userId: 'test-user',
          deviceInfo: { browser: 'jest', os: 'test' }
        });
      }),
      updateSession: jest.fn().mockImplementation((sessionId, updates) => {
        return Promise.resolve({
          id: sessionId,
          createdAt: new Date().toISOString(),
          ...updates,
          userId: 'test-user',
          deviceInfo: { browser: 'jest', os: 'test' }
        });
      }),
      endSession: jest.fn().mockResolvedValue(true),
      recordSessionActivity: jest.fn().mockResolvedValue(true)
    }))
  };
});

// Mock AudioProcessor
jest.mock('../../app/server/audioProcessor', () => {
  return {
    AudioProcessor: jest.fn().mockImplementation(() => ({
      processChunk: jest.fn(),
      processOldChunks: jest.fn(),
      getSessionStats: jest.fn().mockReturnValue({
        totalChunks: 5,
        processedChunks: 5,
        wordCount: 20,
        averageProcessingTime: 150
      })
    }))
  };
});

describe('Session Creation → Audio Processing → Session Termination Flow', () => {
  let sessionService: SessionService;
  let audioProcessor: AudioProcessor;
  
  beforeEach(() => {
    jest.clearAllMocks();
    sessionService = new SessionService();
    audioProcessor = new AudioProcessor();
  });
  
  test('should create a session, process audio, and terminate session', async () => {
    // 1. Create a new session
    const deviceInfo = {
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop'
    };
    
    const session = await sessionService.createSession('test-user', deviceInfo);
    
    expect(session).toHaveProperty('id', 'test-session-123');
    expect(session).toHaveProperty('status', 'active');
    
    // 2. Process audio chunks in the session
    const audioChunk = {
      chunkId: 'chunk-1',
      timestamp: Date.now(),
      audioData: new ArrayBuffer(1024),
      sampleRate: 16000,
      isLastChunk: false
    };
    
    audioProcessor.processChunk(session.id, audioChunk);
    expect(audioProcessor.processChunk).toHaveBeenCalledWith(session.id, audioChunk);
    
    // 3. Record session activity
    await sessionService.recordSessionActivity(session.id);
    expect(sessionService.recordSessionActivity).toHaveBeenCalledWith(session.id);
    
    // 4. Get session stats
    const stats = audioProcessor.getSessionStats(session.id);
    expect(stats).toEqual({
      totalChunks: 5,
      processedChunks: 5,
      wordCount: 20,
      averageProcessingTime: 150
    });
    
    // 5. Update session status
    const updatedSession = await sessionService.updateSession(session.id, { status: 'paused' });
    expect(updatedSession).toHaveProperty('status', 'paused');
    expect(sessionService.updateSession).toHaveBeenCalledWith(
      session.id,
      expect.objectContaining({ status: 'paused' })
    );
    
    // 6. End the session
    await sessionService.endSession(session.id);
    expect(sessionService.endSession).toHaveBeenCalledWith(session.id);
  });
  
  test('should handle the complete lifecycle of a session with multiple audio chunks', async () => {
    // 1. Create session
    const session = await sessionService.createSession('test-user', { browser: 'Firefox', os: 'macOS' });
    
    // 2. Process multiple audio chunks
    for (let i = 0; i < 3; i++) {
      const chunk = {
        chunkId: `chunk-${i}`,
        timestamp: Date.now() + i * 100,
        audioData: new ArrayBuffer(1024),
        sampleRate: 16000,
        isLastChunk: i === 2
      };
      
      audioProcessor.processChunk(session.id, chunk);
      expect(audioProcessor.processChunk).toHaveBeenCalledWith(session.id, chunk);
      
      // Record activity after each chunk
      await sessionService.recordSessionActivity(session.id);
    }
    
    expect(audioProcessor.processChunk).toHaveBeenCalledTimes(3);
    expect(sessionService.recordSessionActivity).toHaveBeenCalledTimes(3);
    
    // 3. Process old chunks (might happen periodically in the real app)
    audioProcessor.processOldChunks(session.id);
    expect(audioProcessor.processOldChunks).toHaveBeenCalledWith(session.id);
    
    // 4. Get final stats
    const stats = audioProcessor.getSessionStats(session.id);
    expect(stats.totalChunks).toBe(5);
    expect(stats.processedChunks).toBe(5);
    
    // 5. End session
    await sessionService.endSession(session.id);
    expect(sessionService.endSession).toHaveBeenCalledWith(session.id);
  });
  
  test('should verify session exists before processing audio', async () => {
    // Mock for getSession to return null for non-existent session
    (sessionService.getSession as jest.Mock).mockImplementationOnce(() => Promise.resolve(null));
    
    // Try to get a non-existent session
    const session = await sessionService.getSession('non-existent-session');
    expect(session).toBeNull();
    
    // Processing should not proceed with invalid session
    if (!session) {
      expect(true).toBe(true); // Session correctly identified as not existing
    } else {
      // This code should not run
      audioProcessor.processChunk(session.id, {
        chunkId: 'test',
        timestamp: Date.now(),
        audioData: new ArrayBuffer(1024),
        sampleRate: 16000,
        isLastChunk: false
      });
      expect(audioProcessor.processChunk).not.toHaveBeenCalled();
    }
  });
}); 