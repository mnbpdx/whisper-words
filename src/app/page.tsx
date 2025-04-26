'use client';

import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import BubbleContainer from './components/BubbleContainer';
import Controls from './components/Controls';
import WordBubble from './components/WordBubble';
import MicrophonePermission from './components/MicrophonePermission';
import ErrorMessage from './components/ErrorMessage';
import { useAudioCapture } from './hooks/useAudioCapture';
import { TranscribedWord } from './types/audio';

export default function Home() {
  const { audioState, toggleAudioCapture, requestMicrophonePermission, clearError } = useAudioCapture();
  const [words, setWords] = useState<TranscribedWord[]>([]);
  const [pinnedWords, setPinnedWords] = useState<TranscribedWord[]>([]);

  // Demo function to add sample words (simulating transcription)
  const addSampleWord = () => {
    if (audioState.isActive) {
      const sampleWords = [
        'Hello', 'world', 'this', 'is', 'a', 'test', 'of', 'the', 'speech', 
        'recognition', 'system', 'using', 'WhisperX', 'for', 'transcription'
      ];
      
      const randomWord = sampleWords[Math.floor(Math.random() * sampleWords.length)];
      
      const newWord: TranscribedWord = {
        id: `word-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        word: randomWord,
        startTime: Date.now() / 1000 - 0.5,
        endTime: Date.now() / 1000,
        confidence: Math.random() * 0.5 + 0.5, // Random confidence between 0.5 and 1
        isPinned: false,
        createdAt: Date.now(),
      };

      setWords(prevWords => [...prevWords, newWord]);
    }
  };

  // Demo effect to add words periodically when active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (audioState.isActive) {
      interval = setInterval(addSampleWord, 800); // Add a word roughly every 800ms
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [audioState.isActive]);

  // Remove words that have faded (except pinned ones)
  const handleWordFadeComplete = (wordId: string) => {
    setWords(prevWords => prevWords.filter(word => word.id !== wordId));
  };

  // Handle pinning/unpinning words
  const togglePinWord = (wordId: string) => {
    // Check if the word is in the active words array
    const activeWordIndex = words.findIndex(word => word.id === wordId);
    
    if (activeWordIndex >= 0) {
      // If word is in active words, toggle its pinned state
      const updatedWords = [...words];
      updatedWords[activeWordIndex] = {
        ...updatedWords[activeWordIndex],
        isPinned: !updatedWords[activeWordIndex].isPinned,
      };
      
      // If pinned, add to pinnedWords
      if (!words[activeWordIndex].isPinned) {
        setPinnedWords(prev => [...prev, updatedWords[activeWordIndex]]);
      }
      
      setWords(updatedWords);
    } else {
      // Check if the word is in pinnedWords
      const pinnedIndex = pinnedWords.findIndex(word => word.id === wordId);
      
      if (pinnedIndex >= 0) {
        // Toggle pin off
        const updatedPinnedWords = [...pinnedWords];
        updatedPinnedWords[pinnedIndex] = {
          ...updatedPinnedWords[pinnedIndex],
          isPinned: false,
        };
        
        // Remove from pinnedWords
        setPinnedWords(updatedPinnedWords.filter(word => word.isPinned));
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        {audioState.error && (
          <ErrorMessage message={audioState.error} onDismiss={clearError} />
        )}
        
        <MicrophonePermission 
          permissionState={audioState.micPermission} 
          onRequestPermission={requestMicrophonePermission} 
        />
        
        <Controls 
          isActive={audioState.isActive}
          isListening={audioState.isListening}
          onToggle={toggleAudioCapture}
          micPermission={audioState.micPermission}
        />
        
        <BubbleContainer>
          {/* Render active words */}
          {words.map(word => (
            <WordBubble
              key={word.id}
              word={word.word}
              isPinned={word.isPinned}
              onPin={() => togglePinWord(word.id)}
              onFadeComplete={() => handleWordFadeComplete(word.id)}
              createdAt={word.createdAt}
              fadeDuration={2000}
            />
          ))}
          
          {/* Render pinned words that are no longer in the active words list */}
          {pinnedWords
            .filter(pinnedWord => !words.some(word => word.id === pinnedWord.id))
            .map(pinnedWord => (
              <WordBubble
                key={pinnedWord.id}
                word={pinnedWord.word}
                isPinned={true}
                onPin={() => togglePinWord(pinnedWord.id)}
                createdAt={pinnedWord.createdAt}
              />
            ))
          }
        </BubbleContainer>
      </div>
    </Layout>
  );
}
