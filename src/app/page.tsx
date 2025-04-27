'use client';

import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import BubbleContainer from './components/BubbleContainer';
import Controls from './components/Controls';
import WordBubble from './components/WordBubble';
import MicrophonePermission from './components/MicrophonePermission';
import ErrorMessage from './components/ErrorMessage';
import ConnectionStatus from './components/ConnectionStatus';
import { useAudioCapture } from './hooks/useAudioCapture';
import useAudioStreaming from './hooks/useAudioStreaming';
import useSession from './hooks/useSession';
import { TranscribedWord } from './types/audio';

export default function Home() {
  const { audioState, toggleAudioCapture, requestMicrophonePermission, clearError } = useAudioCapture();
  const [words, setWords] = useState<TranscribedWord[]>([]);
  const [pinnedWords, setPinnedWords] = useState<TranscribedWord[]>([]);
  
  // Initialize session
  const {
    session,
    isLoading: isSessionLoading,
    error: sessionError,
    createSession,
    endSession,
  } = useSession({
    autoCreate: true,
    onError: (error) => console.error('Session error:', error),
  });
  
  // Initialize audio streaming
  const {
    isStreaming,
    startStreaming,
    stopStreaming,
    isConnected,
    error: streamingError,
  } = useAudioStreaming({
    enabled: audioState.isActive,
    onStreamingStart: () => console.log('Streaming started'),
    onStreamingStop: () => console.log('Streaming stopped'),
    onChunkProcessed: (result) => {
      if (result?.words && Array.isArray(result.words)) {
        const newWords: TranscribedWord[] = result.words.map((word: any) => ({
          id: `word-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          word: word.text,
          startTime: word.start,
          endTime: word.end,
          confidence: word.confidence || 0.9,
          isPinned: false,
          createdAt: Date.now(),
        }));
        
        setWords(prevWords => [...prevWords, ...newWords]);
      }
    },
    onError: (error) => console.error('Streaming error:', error),
  });

  // Connect audio toggle with streaming
  useEffect(() => {
    if (audioState.isActive && !isStreaming) {
      startStreaming();
    } else if (!audioState.isActive && isStreaming) {
      stopStreaming();
    }
  }, [audioState.isActive, isStreaming, startStreaming, stopStreaming]);

  // Demo function to add sample words (simulating transcription) - will remove when real transcription is working
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

  // Demo effect to add words periodically when active - will remove when real transcription is working
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
    console.log('Word fade complete:', wordId);
    setWords(prevWords => {
      // Only filter out unpinned words that match the id
      const updatedWords = prevWords.filter(word => word.id !== wordId || word.isPinned);
      
      // If word was pinned, ensure it's in the pinnedWords array
      const word = prevWords.find(w => w.id === wordId && w.isPinned);
      if (word) {
        setPinnedWords(prev => {
          // Only add if not already in pinnedWords
          if (!prev.some(p => p.id === wordId)) {
            return [...prev, word];
          }
          return prev;
        });
      }
      
      return updatedWords;
    });
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

  // Combine errors from different sources
  const error = audioState.error || sessionError || streamingError;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        {error && (
          <ErrorMessage message={error.toString()} onDismiss={clearError} />
        )}
        
        <div className="flex justify-between items-center">
          <MicrophonePermission 
            permissionState={audioState.micPermission} 
            onRequestPermission={requestMicrophonePermission} 
          />
          
          <ConnectionStatus 
            isConnected={isConnected}
            isConnecting={isSessionLoading}
          />
        </div>
        
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
