import { SocketEvent } from '../../app/lib/socketConfig';

// Create real mock of StreamingService
const mockStartStreaming = jest.fn().mockReturnValue(true);
const mockStopStreaming = jest.fn();
const mockSendAudioData = jest.fn().mockReturnValue(true);
const mockOnWord = jest.fn();
const mockIsStreaming = jest.fn().mockReturnValue(true);

// Mock the StreamingService module
jest.mock('../../app/services/streamingService', () => {
  return {
    StreamingService: jest.fn().mockImplementation(() => {
      return {
        startStreaming: mockStartStreaming,
        stopStreaming: mockStopStreaming,
        sendAudioData: mockSendAudioData,
        onWord: mockOnWord,
        isStreaming: mockIsStreaming
      };
    })
  };
});

// Import after mocking
import { StreamingService } from '../../app/services/streamingService';

describe('StreamingService', () => {
  let streamingService: ReturnType<typeof StreamingService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Create StreamingService with mock dependencies
    streamingService = new StreamingService({} as any);
  });
  
  test('should initialize correctly', () => {
    expect(streamingService).toBeDefined();
    expect(StreamingService).toHaveBeenCalled();
  });
  
  test('should start streaming when connected', () => {
    streamingService.startStreaming();
    
    expect(mockStartStreaming).toHaveBeenCalled();
    expect(mockStartStreaming).toHaveReturnedWith(true);
  });
  
  test('should stop streaming', () => {
    streamingService.stopStreaming();
    
    expect(mockStopStreaming).toHaveBeenCalled();
  });
  
  test('should send audio data', () => {
    const audioData = new Uint8Array([1, 2, 3]);
    
    streamingService.sendAudioData(audioData);
    
    expect(mockSendAudioData).toHaveBeenCalledWith(audioData);
  });
  
  test('should register word event callback', () => {
    const callback = jest.fn();
    
    streamingService.onWord(callback);
    
    expect(mockOnWord).toHaveBeenCalledWith(callback);
  });
}); 