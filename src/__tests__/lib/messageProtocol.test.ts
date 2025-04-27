import { MessageProtocol } from '../../app/lib/messageProtocol';

// Mock uuid to generate sequential IDs for testing
jest.mock('uuid', () => {
  let id = 0;
  return {
    v4: jest.fn(() => `mock-uuid-${++id}`),
  };
});

describe('MessageProtocol', () => {
  let protocol: MessageProtocol;

  beforeEach(() => {
    protocol = new MessageProtocol();
  });

  test('should format audio data message correctly', () => {
    // Create audio data
    const audioData = new Float32Array([0.1, 0.2, 0.3]);
    const sampleRate = 16000;
    const sessionId = 'test-session-123';

    // Format message
    const message = protocol.formatAudioDataMessage(audioData, sampleRate, sessionId);

    // Verify message structure
    expect(message).toBeInstanceOf(Object);
    expect(message).toHaveProperty('audio_data');
    expect(message).toHaveProperty('sample_rate', sampleRate);
    expect(message).toHaveProperty('session_id', sessionId);

    // Audio data should be converted to Array for JSON serialization
    expect(Array.isArray(message.audio_data)).toBe(true);
    expect(message.audio_data).toHaveLength(audioData.length);

    // Content should match
    expect(message.audio_data[0]).toBeCloseTo(0.1);
    expect(message.audio_data[1]).toBeCloseTo(0.2);
    expect(message.audio_data[2]).toBeCloseTo(0.3);
  });

  test('should parse transcription result correctly', () => {
    // Mock WhisperX response format
    const whisperxResult = {
      words: [
        { text: 'hello', start: 0.1, end: 0.3, confidence: 0.9 },
        { text: 'world', start: 0.4, end: 0.6, confidence: 0.85 },
      ],
      text: 'hello world',
      processing_time: 0.5,
      sample_rate: 16000,
    };

    // Parse result
    const sessionId = 'test-session-123';
    const result = protocol.parseTranscriptionResult(whisperxResult, sessionId);

    // Verify structure
    expect(result).toHaveProperty('words');
    expect(result).toHaveProperty('sessionId', sessionId);
    expect(result).toHaveProperty('timestamp');

    // Words should be transformed to app format
    expect(result.words).toHaveLength(2);
    expect(result.words[0]).toEqual({
      word: 'hello',
      startTime: 0.1,
      endTime: 0.3,
      confidence: 0.9,
      id: expect.any(String), // Should generate unique ID
    });

    // Each word should have a unique ID
    expect(result.words[0].id).not.toEqual(result.words[1].id);
  });

  test('should validate audio data message', () => {
    // Valid message
    const validMessage = {
      audio_data: [0.1, 0.2, 0.3],
      sample_rate: 16000,
      session_id: 'test-session',
    };

    // Invalid messages
    const missingAudioData = {
      sample_rate: 16000,
      session_id: 'test-session',
    };

    const missingSessionId = {
      audio_data: [0.1, 0.2, 0.3],
      sample_rate: 16000,
    };

    const invalidSampleRate = {
      audio_data: [0.1, 0.2, 0.3],
      sample_rate: 'invalid',
      session_id: 'test-session',
    };

    // Test validation
    expect(protocol.validateAudioDataMessage(validMessage)).toBe(true);
    expect(
      protocol.validateAudioDataMessage(missingAudioData as Partial<typeof validMessage>)
    ).toBe(false);
    expect(
      protocol.validateAudioDataMessage(missingSessionId as Partial<typeof validMessage>)
    ).toBe(false);
    expect(protocol.validateAudioDataMessage(invalidSampleRate as Record<string, unknown>)).toBe(
      false
    );
  });

  test('should validate transcription result', () => {
    // Valid result
    const validResult = {
      words: [{ text: 'hello', start: 0.1, end: 0.3, confidence: 0.9 }],
      text: 'hello',
      processing_time: 0.5,
    };

    // Invalid results
    const missingWords = {
      text: 'hello',
      processing_time: 0.5,
    };

    const invalidWordFormat = {
      words: [
        { word: 'hello', startTime: 0.1, endTime: 0.3 }, // Wrong format
      ],
      text: 'hello',
      processing_time: 0.5,
    };

    // Test validation
    expect(protocol.validateTranscriptionResult(validResult)).toBe(true);
    expect(protocol.validateTranscriptionResult(missingWords as Partial<typeof validResult>)).toBe(
      false
    );
    expect(protocol.validateTranscriptionResult(invalidWordFormat as Record<string, unknown>)).toBe(
      false
    );
  });

  test('should handle empty audio data', () => {
    // Empty audio data
    const audioData = new Float32Array(0);
    const sampleRate = 16000;
    const sessionId = 'test-session-123';

    // Should still format correctly
    const message = protocol.formatAudioDataMessage(audioData, sampleRate, sessionId);

    expect(message).toHaveProperty('audio_data');
    expect(message.audio_data).toHaveLength(0);
    expect(protocol.validateAudioDataMessage(message)).toBe(true);
  });

  test('should handle error response', () => {
    // Error response from Python
    const errorResponse = {
      error: 'Processing failed',
    };

    // Should detect error
    expect(protocol.isErrorResponse(errorResponse)).toBe(true);
    expect(protocol.isErrorResponse({ words: [] })).toBe(false);

    // Should extract error message
    expect(protocol.getErrorMessage(errorResponse)).toBe('Processing failed');
  });
});
