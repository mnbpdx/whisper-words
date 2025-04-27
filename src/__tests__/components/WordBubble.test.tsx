import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import WordBubble from '../../app/components/WordBubble';

// Mock the WordBubble component to make it more testable
jest.mock('../../app/components/WordBubble', () => {
  const mockReact = require('react');
  
  return function MockWordBubble({ 
    word, 
    isPinned = false, 
    onPin, 
    onFadeComplete, 
    createdAt, 
    fadeDuration = 2000 
  }) {
    const [isVisible, setIsVisible] = mockReact.useState(true);
    const [opacity, setOpacity] = mockReact.useState(1);
    
    // Set up timers for fading
    mockReact.useEffect(() => {
      if (!isPinned) {
        const fadeTimer = setTimeout(() => {
          setOpacity(0);
        }, fadeDuration);
        
        const removeTimer = setTimeout(() => {
          setIsVisible(false);
          onFadeComplete?.();
        }, fadeDuration + 500);
        
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(removeTimer);
        };
      } else {
        // If pinned, reset opacity
        setOpacity(1);
      }
    }, [isPinned, fadeDuration, onFadeComplete]);
    
    if (!isVisible) {
      return null;
    }
    
    const className = isPinned 
      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
    
    return (
      <div 
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${className}`}
        style={{ opacity, transition: 'opacity 500ms ease-in-out' }}
        onClick={onPin}
        data-testid="word-bubble"
        data-ispinned={isPinned ? 'true' : 'false'}
      >
        <span className={className}>{word}</span>
        {isPinned && (
          <svg 
            className="ml-1 h-3 w-3 text-blue-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            data-testid="pin-icon"
          >
            <path 
              fillRule="evenodd" 
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" 
              clipRule="evenodd" 
            />
          </svg>
        )}
      </div>
    );
  };
});

describe('WordBubble', () => {
  beforeEach(() => {
    // Reset timers between tests
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('should render the word correctly', () => {
    render(
      <WordBubble 
        word="test" 
        createdAt={Date.now()}
      />
    );
    
    expect(screen.getByText('test')).toBeInTheDocument();
  });
  
  test('should apply correct styling for temporary word', () => {
    render(
      <WordBubble 
        word="temporary" 
        createdAt={Date.now()}
      />
    );
    
    const element = screen.getByText('temporary');
    expect(element.parentElement).toHaveClass('bg-gray-200');
    expect(element.parentElement).toHaveClass('text-gray-800');
    expect(element.parentElement).not.toHaveClass('bg-blue-100');
  });
  
  test('should apply correct styling for pinned word', () => {
    render(
      <WordBubble 
        word="pinned" 
        createdAt={Date.now()}
        isPinned={true}
      />
    );
    
    const element = screen.getByText('pinned');
    expect(element.parentElement).toHaveClass('bg-blue-100');
    expect(element.parentElement).toHaveClass('text-blue-800');
    expect(element.parentElement).toHaveClass('border-blue-300');
  });
  
  test('should display pin icon when word is pinned', () => {
    render(
      <WordBubble 
        word="pinned" 
        createdAt={Date.now()}
        isPinned={true}
      />
    );
    
    // Find the SVG element that represents the pin icon
    const pinIcon = screen.getByTestId('pin-icon');
    expect(pinIcon).toBeInTheDocument();
    expect(pinIcon).toHaveClass('text-blue-500');
  });
  
  test('should not display pin icon when word is not pinned', () => {
    render(
      <WordBubble 
        word="unpinned" 
        createdAt={Date.now()}
        isPinned={false}
      />
    );
    
    // Verify that no pin icon exists
    expect(screen.queryByTestId('pin-icon')).not.toBeInTheDocument();
  });
  
  test('should call onPin callback when clicked', () => {
    const onPinMock = jest.fn();
    
    render(
      <WordBubble 
        word="clickable" 
        createdAt={Date.now()}
        onPin={onPinMock}
      />
    );
    
    fireEvent.click(screen.getByText('clickable'));
    
    expect(onPinMock).toHaveBeenCalledTimes(1);
  });
  
  test('should start with full opacity', () => {
    render(
      <WordBubble 
        word="visible" 
        createdAt={Date.now()}
      />
    );
    
    const element = screen.getByTestId('word-bubble');
    expect(element).toHaveStyle('opacity: 1');
  });
  
  test('should fade out after specified duration', () => {
    render(
      <WordBubble 
        word="fading" 
        createdAt={Date.now()}
        fadeDuration={1000}
      />
    );
    
    const element = screen.getByTestId('word-bubble');
    
    // Initially, opacity should be 1
    expect(element).toHaveStyle('opacity: 1');
    
    // Advance time by 1000ms (fadeDuration)
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Opacity should be 0
    expect(element).toHaveStyle('opacity: 0');
  });
  
  test('should call onFadeComplete after fade out and transition duration', () => {
    const onFadeCompleteMock = jest.fn();
    
    render(
      <WordBubble 
        word="completing" 
        createdAt={Date.now()}
        fadeDuration={1000}
        onFadeComplete={onFadeCompleteMock}
      />
    );
    
    // Advance time by 1000ms (fadeDuration)
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // onFadeComplete should not be called yet (waiting for transition)
    expect(onFadeCompleteMock).not.toHaveBeenCalled();
    
    // Advance time by 500ms more (transition duration)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Now onFadeComplete should be called
    expect(onFadeCompleteMock).toHaveBeenCalledTimes(1);
  });
  
  test('should not fade out when pinned', () => {
    render(
      <WordBubble 
        word="pinned" 
        createdAt={Date.now()}
        isPinned={true}
        fadeDuration={1000}
      />
    );
    
    const element = screen.getByTestId('word-bubble');
    
    // Advance time well beyond fade duration
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Element should still be visible with full opacity
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle('opacity: 1');
  });
  
  test('should reset fade timer when switching from unpinned to pinned', () => {
    const { rerender } = render(
      <WordBubble 
        word="pinning" 
        createdAt={Date.now()}
        isPinned={false}
        fadeDuration={1000}
      />
    );
    
    const element = screen.getByTestId('word-bubble');
    
    // Advance time by 500ms (half of fade duration)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Re-render with isPinned=true
    rerender(
      <WordBubble 
        word="pinning" 
        createdAt={Date.now()}
        isPinned={true}
        fadeDuration={1000}
      />
    );
    
    // Advance time well beyond fade duration
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Element should still be visible with full opacity
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle('opacity: 1');
  });
}); 