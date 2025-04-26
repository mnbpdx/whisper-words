import React, { useEffect, useState } from 'react';

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
  
  useEffect(() => {
    if (!isPinned) {
      const fadeTimer = setTimeout(() => {
        setOpacity(0);
      }, fadeDuration);
      
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        onFadeComplete?.();
      }, fadeDuration + 500); // Adding 500ms for the transition to complete
      
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [isPinned, fadeDuration, onFadeComplete]);
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div 
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-500 cursor-pointer
        ${isPinned 
          ? 'bg-blue-100 text-blue-800 border border-blue-300' 
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }
      `}
      style={{ opacity }}
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