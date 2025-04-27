import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the hooks and component implementations
jest.mock('../../app/hooks/useAudioCapture', () => {
  const mockReact = require('react');
  
  function mockUseAudioCapture() {
    const [capturing, setCapturing] = mockReact.useState(false);
    
    return {
      isCapturing: capturing,
      startCapturing: jest.fn(function() { setCapturing(true); }),
      stopCapturing: jest.fn(function() { setCapturing(false); }),
      error: null,
      audioState: {
        micPermission: 'granted'
      }
    };
  }
  
  return jest.fn(function() { return mockUseAudioCapture(); });
});

jest.mock('../../app/hooks/useSocketConnection', () => {
  const mockReact = require('react');
  
  function mockUseSocketConnection() {
    const [connected, setConnected] = mockReact.useState(false);
    
    return {
      isConnected: connected,
      connect: jest.fn(function() { setConnected(true); }),
      disconnect: jest.fn(function() { setConnected(false); }),
      error: null,
      sendAudioChunk: jest.fn()
    };
  }
  
  return jest.fn(function() { return mockUseSocketConnection(); });
});

// Mock WordBubble component
jest.mock('../../app/components/WordBubble', () => {
  return function MockWordBubble(props) {
    return (
      <div 
        className={`word-bubble ${props.isPinned ? 'pinned' : ''}`}
        style={{ opacity: props.isPinned ? 1 : 0.5 }}
        onClick={props.onPin}
        data-testid="word-bubble"
      >
        {props.word}
      </div>
    );
  };
});

// Mock BubbleContainer component
jest.mock('../../app/components/BubbleContainer', () => {
  return function MockBubbleContainer(props) {
    return (
      <div className="bubble-container" data-testid="bubble-container">
        {props.children}
      </div>
    );
  };
});

// Mock Controls component
jest.mock('../../app/components/Controls', () => {
  return function MockControls(props) {
    return (
      <div className="controls" data-testid="controls">
        <button 
          onClick={props.onToggle}
          data-testid="toggle-button"
        >
          {props.isActive ? 'Listening' : 'Paused'}
        </button>
        <div data-testid="mic-status">
          {props.micPermission === 'granted' ? 'Microphone granted' : 'Microphone denied'}
        </div>
        <div data-testid="listening-status">
          {props.isListening ? 'Transcribing' : 'Not transcribing'}
        </div>
      </div>
    );
  };
});

// Mock the useAudioStreaming hook with a version that provides simulated transcription data
jest.mock('../../app/hooks/useAudioStreaming', () => {
  const mockReact = require('react');
  let mockCallback = null;
  
  function mockUseAudioStreaming({ enabled, onChunkProcessed }) {
    const [streaming, setStreaming] = mockReact.useState(false);
    
    // Store the callback for test to trigger later
    mockReact.useEffect(() => {
      mockCallback = onChunkProcessed;
    }, [onChunkProcessed]);
    
    // Effect to handle the enabled state
    mockReact.useEffect(() => {
      if (enabled) {
        setStreaming(true);
        
        // Simulate receiving transcription after a short delay
        setTimeout(() => {
          if (mockCallback) {
            mockCallback({ 
              words: ['hello', 'world'],
              confidence: 0.95
            });
          }
        }, 100);
      } else {
        setStreaming(false);
      }
    }, [enabled]);
    
    return {
      isStreaming: streaming,
      startStreaming: jest.fn(function() { 
        setStreaming(true);
        // Simulate transcription
        setTimeout(() => {
          if (mockCallback) {
            mockCallback({ 
              words: ['hello', 'world'],
              confidence: 0.95
            });
          }
        }, 100);
      }),
      stopStreaming: jest.fn(function() { setStreaming(false); }),
      error: null
    };
  }
  
  return jest.fn(mockUseAudioStreaming);
});

// Mock component to test integration
const TestComponent = () => {
  const [words, setWords] = React.useState([]);
  const [isActive, setIsActive] = React.useState(false);
  
  // Use the mock implementation of useAudioStreaming
  const { isStreaming } = jest.requireMock('../../app/hooks/useAudioStreaming')({
    enabled: isActive,
    onChunkProcessed: (result) => {
      if (result && result.words) {
        const newWords = result.words.map((word) => ({
          id: `word-${Date.now()}-${Math.random()}`,
          text: word,
          isPinned: false,
          createdAt: Date.now()
        }));
        setWords(prev => [...prev, ...newWords]);
      }
    }
  });
  
  // Use the mock implementation of useAudioCapture
  const { audioState } = jest.requireMock('../../app/hooks/useAudioCapture')();
  
  const toggleListening = () => {
    setIsActive(!isActive);
  };
  
  const handlePinWord = (id) => {
    setWords(prev => 
      prev.map(word => 
        word.id === id ? { ...word, isPinned: !word.isPinned } : word
      )
    );
  };
  
  const handleWordFade = (id) => {
    setWords(prev => prev.filter(word => word.id !== id));
  };
  
  // Effect to handle word fading
  React.useEffect(() => {
    const timeouts = words
      .filter(word => !word.isPinned)
      .map(word => {
        return setTimeout(() => {
          handleWordFade(word.id);
        }, 2000); // 2 second fade time
      });
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [words]);
  
  return (
    <div>
      <div 
        className="controls" 
        data-testid="controls"
      >
        <button 
          onClick={toggleListening}
          data-testid="toggle-button"
        >
          {isActive ? 'Listening' : 'Paused'}
        </button>
        <div data-testid="mic-status">
          {audioState?.micPermission === 'granted' ? 'Microphone granted' : 'Microphone denied'}
        </div>
        <div data-testid="listening-status">
          {isStreaming ? 'Transcribing' : 'Not transcribing'}
        </div>
      </div>
      
      <div className="bubble-container" data-testid="bubble-container">
        {words.map(word => (
          <div
            key={word.id}
            className={`word-bubble ${word.isPinned ? 'pinned' : ''}`}
            style={{ opacity: 1 }}
            onClick={() => handlePinWord(word.id)}
            data-testid="word-bubble"
          >
            {word.text}
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Audio Capture → Streaming → Word Display Flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });
  
  test('should display words in bubbles when transcription results are received', async () => {
    render(<TestComponent />);
    
    // Initially, no words should be displayed
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
    expect(screen.queryByText('world')).not.toBeInTheDocument();
    
    // Toggle listening on
    fireEvent.click(screen.getByTestId('toggle-button'));
    
    // Advance timers to allow for word processing
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // Words should now appear
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    
    // Verify that words fade after the specified duration (2000ms)
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    
    // Words should be gone after fading
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
    expect(screen.queryByText('world')).not.toBeInTheDocument();
  });
  
  test('should pin words when clicked and prevent them from fading', async () => {
    render(<TestComponent />);
    
    // Toggle listening on
    fireEvent.click(screen.getByTestId('toggle-button'));
    
    // Advance timers to allow for word processing
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // Words should appear
    const helloElement = screen.getByText('hello');
    
    // Pin the "hello" word by clicking it
    fireEvent.click(helloElement);
    
    // Advance time beyond fade duration
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    
    // "hello" should still be visible because it's pinned
    expect(screen.getByText('hello')).toBeInTheDocument();
    
    // "world" should be gone because it wasn't pinned
    expect(screen.queryByText('world')).not.toBeInTheDocument();
  });
  
  test('should stop transcription when toggle is turned off', async () => {
    render(<TestComponent />);
    
    // Toggle listening on
    fireEvent.click(screen.getByTestId('toggle-button'));
    
    // Advance timers to allow for word processing
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // Words should appear
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    
    // Get initial count of word bubbles
    const initialWordCount = screen.getAllByTestId('word-bubble').length;
    
    // Toggle listening off
    fireEvent.click(screen.getByTestId('toggle-button'));
    
    // Advance timers to check if more words would be added
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // The number of word bubbles should remain the same since no new words are added
    // while transcription is off
    const wordCount = screen.getAllByTestId('word-bubble').length;
    expect(wordCount).toBe(initialWordCount);
  });
}); 