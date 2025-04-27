import { NextRequest } from 'next/server';
import { POST, GET } from '../../app/api/audio/process/route';
import { AudioProcessor } from '../../app/server/audioProcessor';
import { SessionService } from '../../app/services/sessionService';

// Mock File and FormData for testing
global.File = class MockFile {
  name: string;
  type: string;
  content: Uint8Array;

  constructor(content: Uint8Array[], filename: string, options: { type: string }) {
    this.name = filename;
    this.type = options.type;
    this.content = content[0];
  }

  arrayBuffer() {
    return Promise.resolve(this.content.buffer);
  }
};

// Mock FormData
class MockFormData {
  private data: Record<string, any> = {};

  append(key: string, value: any) {
    this.data[key] = value;
  }

  get(key: string) {
    return this.data[key];
  }
}

global.FormData = MockFormData as any;

// Mock SessionService
jest.mock('../../app/services/sessionService', () => {
  const getSessionMock = jest.fn();
  const recordSessionActivityMock = jest.fn();
  
  return {
    SessionService: jest.fn(() => {
      return {
        getSession: getSessionMock,
        recordSessionActivity: recordSessionActivityMock
      };
    }),
    __mocks: {
      getSessionMock,
      recordSessionActivityMock
    }
  };
});

// Mock AudioProcessor
jest.mock('../../app/server/audioProcessor', () => {
  const processChunkMock = jest.fn();
  const processOldChunksMock = jest.fn();
  const getSessionStatsMock = jest.fn();
  
  return {
    AudioProcessor: jest.fn(() => {
      return {
        processChunk: processChunkMock,
        processOldChunks: processOldChunksMock,
        getSessionStats: getSessionStatsMock
      };
    }),
    __mocks: {
      processChunkMock,
      processOldChunksMock,
      getSessionStatsMock
    }
  };
});

// Import the mocks
const { __mocks: { getSessionMock, recordSessionActivityMock } } = jest.requireMock('../../app/services/sessionService');
const { __mocks: { processChunkMock, processOldChunksMock, getSessionStatsMock } } = jest.requireMock('../../app/server/audioProcessor');

describe('Audio Processing API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    getSessionMock.mockResolvedValue({
      id: 'test-session-123',
      status: 'active',
      createdAt: new Date().toISOString()
    });
    
    recordSessionActivityMock.mockResolvedValue(true);
    
    processChunkMock.mockReturnValue(undefined);
    processOldChunksMock.mockReturnValue(undefined);
    
    getSessionStatsMock.mockReturnValue({
      totalAudioProcessed: 60,
      wordCount: 120,
      audioQualityScore: 0.85
    });
  });
  
  describe('POST - Process Audio Chunk', () => {
    test('should process audio chunk and return stats', async () => {
      // Create mock audio data
      const audioData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockFormData = new MockFormData();
      mockFormData.append('audio', new global.File([audioData], 'audio.wav', { type: 'audio/wav' }));
      mockFormData.append('sampleRate', '16000');
      mockFormData.append('timestamp', Date.now().toString());
      
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('test-session-123')
          }
        },
        formData: jest.fn().mockResolvedValue(mockFormData)
      } as unknown as NextRequest;
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('stats');
      expect(processChunkMock).toHaveBeenCalled();
      expect(processOldChunksMock).toHaveBeenCalledWith('test-session-123');
      expect(recordSessionActivityMock).toHaveBeenCalledWith('test-session-123');
    });
    
    test('should return 400 when session ID is not provided', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue(null)
          }
        }
      } as unknown as NextRequest;
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Session ID is required');
      expect(processChunkMock).not.toHaveBeenCalled();
    });
    
    test('should return 404 when session is not found', async () => {
      getSessionMock.mockResolvedValueOnce(null);
      
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('nonexistent-session')
          }
        }
      } as unknown as NextRequest;
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Session not found');
    });
    
    test('should return 400 when session is not active', async () => {
      getSessionMock.mockResolvedValueOnce({
        id: 'test-session-123',
        status: 'paused',
        createdAt: new Date().toISOString()
      });
      
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('test-session-123')
          }
        }
      } as unknown as NextRequest;
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Session is not active');
    });
    
    test('should handle errors during processing', async () => {
      processChunkMock.mockImplementationOnce(() => {
        throw new Error('Processing failed');
      });
      
      // Create mock audio data
      const audioData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockFormData = new MockFormData();
      mockFormData.append('audio', new global.File([audioData], 'audio.wav', { type: 'audio/wav' }));
      
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('test-session-123')
          }
        },
        formData: jest.fn().mockResolvedValue(mockFormData)
      } as unknown as NextRequest;
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error', 'Processing failed');
    });
  });
  
  describe('GET - Session Audio Statistics', () => {
    test('should retrieve session statistics', async () => {
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
      expect(getSessionStatsMock).toHaveBeenCalledWith('test-session-123');
      expect(data).toHaveProperty('totalAudioProcessed', 60);
      expect(data).toHaveProperty('wordCount', 120);
      expect(data).toHaveProperty('audioQualityScore', 0.85);
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
    
    test('should return 404 when session is not found', async () => {
      getSessionMock.mockResolvedValueOnce(null);
      
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('nonexistent-session')
          }
        }
      } as unknown as NextRequest;
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Session not found');
    });
    
    test('should return 404 when no stats are found', async () => {
      getSessionStatsMock.mockReturnValueOnce(null);
      
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('test-session-123')
          }
        }
      } as unknown as NextRequest;
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'No audio processing data found for session');
    });
    
    test('should handle errors during stats retrieval', async () => {
      getSessionStatsMock.mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: jest.fn().mockReturnValue('test-session-123')
          }
        }
      } as unknown as NextRequest;
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error', 'Database error');
    });
  });
}); 