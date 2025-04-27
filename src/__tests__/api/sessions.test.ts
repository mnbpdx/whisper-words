import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../../app/api/sessions/route';
import { SessionService } from '../../app/services/sessionService';

// Mock SessionService
jest.mock('../../app/services/sessionService', () => {
  // Create mock functions inside the factory function
  const createSessionMock = jest.fn();
  const getSessionMock = jest.fn();
  const updateSessionMock = jest.fn();
  const endSessionMock = jest.fn();
  const recordSessionActivityMock = jest.fn();

  return {
    SessionService: jest.fn(() => {
      return {
        createSession: createSessionMock,
        getSession: getSessionMock,
        updateSession: updateSessionMock,
        endSession: endSessionMock,
        recordSessionActivity: recordSessionActivityMock
      };
    }),
    // Export the mocks so we can access them in the test
    __mocks: {
      createSessionMock,
      getSessionMock,
      updateSessionMock,
      endSessionMock,
      recordSessionActivityMock
    }
  };
});

// Import the mocks from the mock module
const { __mocks: { 
  createSessionMock, 
  getSessionMock, 
  updateSessionMock, 
  endSessionMock, 
  recordSessionActivityMock 
}} = jest.requireMock('../../app/services/sessionService');

describe('Sessions API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    createSessionMock.mockResolvedValue({
      id: 'test-session-123',
      createdAt: new Date().toISOString(),
      status: 'active',
      userId: 'test-user',
      deviceInfo: { browser: 'Chrome', os: 'Windows' }
    });
    
    getSessionMock.mockImplementation((sessionId: string) => {
      if (sessionId === 'unknown-session') {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        id: sessionId,
        createdAt: new Date().toISOString(),
        status: 'active',
        userId: 'test-user',
        deviceInfo: { browser: 'jest', os: 'test' }
      });
    });
    
    updateSessionMock.mockResolvedValue({
      id: 'test-session-123',
      createdAt: new Date().toISOString(),
      status: 'paused',
      metadata: { lastWord: 'hello' },
      userId: 'test-user',
      deviceInfo: { browser: 'jest', os: 'test' }
    });
    
    endSessionMock.mockResolvedValue(undefined);
    recordSessionActivityMock.mockResolvedValue(true);
  });
  
  describe('POST - Create Session', () => {
    test('should create a new session with valid data', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          userId: 'test-user',
          deviceInfo: { 
            browser: 'Chrome', 
            os: 'Windows',
            device: 'Desktop'
          }
        })
      } as unknown as NextRequest;
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('sessionId', 'test-session-123');
      expect(data).toHaveProperty('status', 'active');
      expect(data).toHaveProperty('createdAt');
    });
    
    test('should handle errors during session creation', async () => {
      // Setup mock to throw an error for this specific test
      createSessionMock.mockRejectedValueOnce(new Error('Database error'));
      
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          userId: 'test-user',
          deviceInfo: { browser: 'Chrome', os: 'Windows' }
        })
      } as unknown as NextRequest;
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error', 'Database error');
    });
  });
  
  describe('GET - Retrieve Session', () => {
    test('should retrieve an existing session by ID', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('test-session-123')
          }
        }
      } as unknown as NextRequest;
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id', 'test-session-123');
      expect(data).toHaveProperty('status', 'active');
    });
    
    test('should return 404 for non-existent session', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('unknown-session')
          }
        }
      } as unknown as NextRequest;
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Session not found');
    });
    
    test('should return 400 when session ID is not provided', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue(null)
          }
        }
      } as unknown as NextRequest;
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Session ID is required');
    });
  });
  
  describe('PUT - Update Session', () => {
    test('should update an existing session', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          sessionId: 'test-session-123',
          status: 'paused',
          metadata: { lastWord: 'hello' }
        })
      } as unknown as NextRequest;
      
      const response = await PUT(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id', 'test-session-123');
      expect(data).toHaveProperty('status', 'paused');
      expect(data).toHaveProperty('metadata.lastWord', 'hello');
    });
    
    test('should return 400 when session ID is not provided', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          status: 'paused'
        })
      } as unknown as NextRequest;
      
      const response = await PUT(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Session ID is required');
    });
    
    test('should only allow certain fields to be updated', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          sessionId: 'test-session-123',
          status: 'paused',
          illegalField: 'should be filtered out'
        })
      } as unknown as NextRequest;
      
      await PUT(mockRequest);
      
      // Verify updateSession was called with proper filtered fields
      expect(updateSessionMock).toHaveBeenCalledWith(
        'test-session-123',
        expect.objectContaining({
          status: 'paused'
        })
      );
      
      // Verify illegal fields were filtered out
      expect(updateSessionMock).not.toHaveBeenCalledWith(
        'test-session-123',
        expect.objectContaining({
          illegalField: expect.anything()
        })
      );
    });
  });
  
  describe('DELETE - End Session', () => {
    test('should end an existing session', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('test-session-123')
          }
        }
      } as unknown as NextRequest;
      
      const response = await DELETE(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(endSessionMock).toHaveBeenCalledWith('test-session-123');
    });
    
    test('should return 400 when session ID is not provided', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue(null)
          }
        }
      } as unknown as NextRequest;
      
      const response = await DELETE(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Session ID is required');
    });
    
    test('should handle errors during session deletion', async () => {
      // Setup mock to throw an error for this specific test
      endSessionMock.mockRejectedValueOnce(new Error('Failed to end session'));
      
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('test-session-123')
          }
        }
      } as unknown as NextRequest;
      
      const response = await DELETE(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error', 'Failed to end session');
    });
  });
}); 