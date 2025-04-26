import { useState, useEffect, useCallback } from 'react';
import { Session } from '../types/session';
import { SessionService } from '../services/sessionService';

// Create singleton instance
const sessionService = new SessionService();

interface UseSessionProps {
  autoCreate?: boolean;
  onSessionCreated?: (session: Session) => void;
  onSessionEnded?: () => void;
  onError?: (error: Error) => void;
}

export const useSession = ({
  autoCreate = true,
  onSessionCreated,
  onSessionEnded,
  onError,
}: UseSessionProps = {}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize session on mount if autoCreate is true
  useEffect(() => {
    if (autoCreate) {
      initSession();
    }
    
    // Clean up session on unmount
    return () => {
      if (session) {
        handleEndSession();
      }
    };
  }, [autoCreate]);

  // Create a new session
  const initSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newSession = await sessionService.createSession();
      setSession(newSession);
      onSessionCreated?.(newSession);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create session');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onSessionCreated, onError]);

  // Refresh session data
  const refreshSession = useCallback(async () => {
    if (!session?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSession = await sessionService.getSession(session.id);
      if (updatedSession) {
        setSession(updatedSession);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh session');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.id, onError]);

  // End the current session
  const handleEndSession = useCallback(async () => {
    if (!session?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await sessionService.endSession(session.id);
      setSession(null);
      onSessionEnded?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to end session');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.id, onSessionEnded, onError]);

  return {
    session,
    isLoading,
    error,
    createSession: initSession,
    refreshSession,
    endSession: handleEndSession,
  };
};

export default useSession; 