import { v4 as uuidv4 } from 'uuid';
import { Session, SessionManager, SessionOptions, SessionStats, SessionStatus } from '../types/session';

// In-memory session storage (in a real app, this would use a database)
const sessions = new Map<string, Session>();
const sessionStats = new Map<string, SessionStats>();

export class SessionService implements SessionManager {
  private options: SessionOptions;
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  
  constructor(options?: Partial<SessionOptions>) {
    this.options = {
      maxSessionDuration: options?.maxSessionDuration ?? 3600,
      inactivityTimeout: options?.inactivityTimeout ?? 300,
    };
    
    // Start session cleanup interval
    this.startCleanupInterval();
  }
  
  private startCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
    
    // Check for expired sessions every minute
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000);
  }
  
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    
    sessions.forEach((session, sessionId) => {
      // Check for max duration exceeded
      if (this.options.maxSessionDuration > 0) {
        const sessionDuration = (now - session.createdAt) / 1000;
        if (sessionDuration > this.options.maxSessionDuration && session.status === 'active') {
          this.updateSession(sessionId, { status: 'ended' });
        }
      }
      
      // Check for inactivity timeout
      if (this.options.inactivityTimeout > 0) {
        const inactiveTime = (now - session.updatedAt) / 1000;
        if (inactiveTime > this.options.inactivityTimeout && session.status === 'active') {
          this.updateSession(sessionId, { status: 'ended' });
        }
      }
    });
  }
  
  async createSession(userId?: string, deviceInfo?: Session['deviceInfo']): Promise<Session> {
    const sessionId = uuidv4();
    const now = Date.now();
    
    const newSession: Session = {
      id: sessionId,
      userId,
      deviceInfo,
      createdAt: now,
      updatedAt: now,
      status: 'initializing',
    };
    
    sessions.set(sessionId, newSession);
    
    // Initialize session stats
    sessionStats.set(sessionId, {
      totalAudioProcessed: 0,
      transcriptionLatency: 0,
      wordCount: 0,
      errorCount: 0,
    });
    
    return newSession;
  }
  
  async getSession(sessionId: string): Promise<Session | null> {
    return sessions.get(sessionId) || null;
  }
  
  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    const updatedSession: Session = {
      ...session,
      ...updates,
      updatedAt: Date.now(),
    };
    
    sessions.set(sessionId, updatedSession);
    return updatedSession;
  }
  
  async endSession(sessionId: string): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      session.updatedAt = Date.now();
    }
  }
  
  async getSessionStats(sessionId: string): Promise<SessionStats> {
    const stats = sessionStats.get(sessionId);
    if (!stats) {
      throw new Error(`Stats for session ${sessionId} not found`);
    }
    return stats;
  }
  
  async isSessionActive(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return session?.status === 'active';
  }
  
  // Update session stats
  async updateSessionStats(sessionId: string, updates: Partial<SessionStats>): Promise<SessionStats> {
    const stats = sessionStats.get(sessionId);
    if (!stats) {
      throw new Error(`Stats for session ${sessionId} not found`);
    }
    
    const updatedStats: SessionStats = {
      ...stats,
      ...updates,
    };
    
    sessionStats.set(sessionId, updatedStats);
    return updatedStats;
  }
  
  // Method to handle session activity (reset inactivity timer)
  async recordSessionActivity(sessionId: string): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      session.updatedAt = Date.now();
    }
  }
  
  // Cleanup resources when service is no longer needed
  destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }
} 