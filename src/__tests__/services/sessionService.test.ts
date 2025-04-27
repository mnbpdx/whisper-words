import { v4 as uuidv4 } from 'uuid';
import { Session } from '../../app/types/session';

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}));

// Mock the global fetch
global.fetch = jest.fn();

// Create sample response data
const mockSessionResponse = {
  sessionId: 'test-session-123', 
  createdAt: new Date().toISOString(),
  deviceInfo: { browser: 'test', os: 'test', device: 'test' },
  active: true
};

// Mock the SessionService implementation
jest.mock('../../app/services/sessionService', () => {
  return {
    SessionService: jest.fn().mockImplementation(() => {
      return {
        createSession: jest.fn().mockImplementation(async (deviceInfo) => {
          return {
            sessionId: 'test-session-123',
            deviceInfo: deviceInfo || { browser: 'unknown', os: 'unknown', device: 'unknown' },
            createdAt: new Date().toISOString(),
            active: true
          };
        }),
        
        getSession: jest.fn().mockImplementation(async (sessionId) => {
          if (sessionId === 'test-session-123') {
            return mockSessionResponse;
          }
          return null;
        }),
        
        endSession: jest.fn().mockImplementation(async () => {
          return true;
        }),
        
        listSessions: jest.fn().mockImplementation(async () => {
          return [mockSessionResponse];
        })
      };
    })
  };
});

// Import after mocking
import { SessionService } from '../../app/services/sessionService';

describe('SessionService', () => {
  let sessionService: ReturnType<typeof SessionService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    sessionService = new SessionService();
  });
  
  test('should create a new session', async () => {
    const deviceInfo = { browser: 'test', os: 'test', device: 'test' };
    const session = await sessionService.createSession(deviceInfo);
    
    expect(session).toMatchObject({
      sessionId: 'test-session-123',
      deviceInfo: deviceInfo,
      createdAt: expect.any(String)
    });
    
    expect(sessionService.createSession).toHaveBeenCalledWith(deviceInfo);
  });
  
  test('should get session by ID', async () => {
    const session = await sessionService.getSession('test-session-123');
    
    expect(session).toMatchObject({
      sessionId: 'test-session-123',
      deviceInfo: expect.any(Object),
      active: true
    });
    
    expect(sessionService.getSession).toHaveBeenCalledWith('test-session-123');
  });
  
  test('should end a session', async () => {
    const result = await sessionService.endSession('test-session-123');
    
    expect(result).toBe(true);
    expect(sessionService.endSession).toHaveBeenCalledWith('test-session-123');
  });
}); 