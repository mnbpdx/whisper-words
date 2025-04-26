import React, { useEffect, useState, useRef } from 'react';

interface WordBubbleProps {
  word: string;
  isPinned?: boolean;
  onPin?: () => void;
  onFadeComplete?: () => void;
  createdAt: number;
  fadeDuration?: number; // in milliseconds
}

const WordBubble: React.FC<WordBubbleProps> = ({
  word,
  isPinned = false,
  onPin,
  onFadeComplete,
  createdAt,
  fadeDuration = 2000, // Default to 2 seconds
}) => {
  const [opacity, setOpacity] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const removeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ensure fade callback is stable across renders
  const handleFadeComplete = useRef(onFadeComplete);
  useEffect(() => {
    handleFadeComplete.current = onFadeComplete;
  }, [onFadeComplete]);
  
  // Reset and set up fade timers when component mounts or isPinned changes
  useEffect(() => {
    // Clear any existing timers
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (removeTimerRef.current) {
      clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }
    
    // If not pinned, set up fade and remove timers
    if (!isPinned) {
      // Set opacity to 1 initially when added
      setOpacity(1);
      setIsVisible(true);
      
      // Start fade after fadeDuration
      fadeTimerRef.current = setTimeout(() => {
        setOpacity(0);
      }, fadeDuration);
      
      // Remove from DOM after transition completes
      removeTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        handleFadeComplete.current?.();
      }, fadeDuration + 500); // Adding 500ms for the transition to complete
    } else {
      // If pinned, ensure it's visible with full opacity
      setOpacity(1);
      setIsVisible(true);
    }
    
    return () => {
      // Clean up timers on unmount or when dependencies change
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      if (removeTimerRef.current) {
        clearTimeout(removeTimerRef.current);
        removeTimerRef.current = null;
      }
    };
  }, [isPinned, fadeDuration]);
  
  // If bubble should be hidden, return null
  if (!isVisible) {
    return null;
  }
  
  return (
    <div 
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer
        ${isPinned 
          ? 'bg-blue-100 text-blue-800 border border-blue-300' 
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }
      `}
      style={{ 
        opacity, 
        transition: 'opacity 500ms ease-in-out',
      }}
      onClick={onPin}
    >
      {word}
      {isPinned && (
        <svg 
          className="ml-1 h-3 w-3 text-blue-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
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

export default WordBubble; 