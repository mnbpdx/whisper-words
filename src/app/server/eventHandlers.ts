import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../lib/socketConfig';
import { AudioChunkPayload, SessionCreatePayload, SessionResponse } from '../lib/socketEvents';
import { AudioProcessor } from './audioProcessor';
import { SessionService } from '../services/sessionService';
import { Session, SessionStatus } from '../types/session';

// Singleton instances
const audioProcessor = new AudioProcessor();
const sessionService = new SessionService();

// Map of socket ID to session ID
const socketSessionMap = new Map<string, string>();

// Handle new socket connection
export function handleConnection(io: Server, socket: Socket): void {
  console.log(`Socket connected: ${socket.id}`);
  
  // Check for session ID in query
  const { sessionId } = socket.handshake.query;
  if (sessionId && typeof sessionId === 'string') {
    // Verify session exists
    sessionService.getSession(sessionId).then(session => {
      if (session) {
        // Associate socket with session
        socketSessionMap.set(socket.id, sessionId);
        
        // Update session status
        sessionService.updateSession(sessionId, { status: 'active' });
        
        console.log(`Socket ${socket.id} reconnected to session ${sessionId}`);
      }
    });
  }
  
  // Set up event listeners
  setupEventListeners(io, socket);
  
  // Handle disconnection
  socket.on('disconnect', () => handleDisconnect(io, socket));
}

// Set up event listeners for a socket
function setupEventListeners(io: Server, socket: Socket): void {
  // Session creation
  socket.on(SocketEvent.SESSION_CREATE, (payload: SessionCreatePayload, callback) => {
    handleSessionCreate(socket, payload).then(response => {
      callback(response);
    }).catch(error => {
      callback({ error: error.message });
    });
  });
  
  // Session destruction
  socket.on(SocketEvent.SESSION_DESTROY, ({ sessionId }: { sessionId: string }, callback) => {
    handleSessionDestroy(socket, sessionId).then(() => {
      callback({ success: true });
    }).catch(error => {
      callback({ success: false, error: error.message });
    });
  });
  
  // Audio chunk reception
  socket.on(SocketEvent.AUDIO_CHUNK, (payload: AudioChunkPayload) => {
    handleAudioChunk(io, socket, payload);
  });
}

// Handle socket disconnection
function handleDisconnect(io: Server, socket: Socket): void {
  console.log(`Socket disconnected: ${socket.id}`);
  
  const sessionId = socketSessionMap.get(socket.id);
  if (sessionId) {
    // Update session but don't end it (client might reconnect)
    sessionService.updateSession(sessionId, { status: 'paused' });
    socketSessionMap.delete(socket.id);
  }
}

// Handle session creation
async function handleSessionCreate(socket: Socket, payload: SessionCreatePayload): Promise<SessionResponse> {
  try {
    // Create new session
    const session = await sessionService.createSession(payload.userId, payload.deviceInfo);
    
    // Update session status to active
    await sessionService.updateSession(session.id, { status: 'active' });
    
    // Associate socket with session
    socketSessionMap.set(socket.id, session.id);
    
    console.log(`Created session ${session.id} for socket ${socket.id}`);
    
    return {
      sessionId: session.id,
      createdAt: session.createdAt,
      status: 'active',
    };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

// Handle session destruction
async function handleSessionDestroy(socket: Socket, sessionId: string): Promise<void> {
  // Verify socket owns this session
  const socketSessionId = socketSessionMap.get(socket.id);
  if (socketSessionId !== sessionId) {
    throw new Error('Unauthorized: Socket does not own this session');
  }
  
  // End session
  await sessionService.endSession(sessionId);
  
  // Clear audio processor session
  audioProcessor.clearSession(sessionId);
  
  // Remove socket-session association
  socketSessionMap.delete(socket.id);
  
  console.log(`Ended session ${sessionId} for socket ${socket.id}`);
}

// Handle audio chunk reception
function handleAudioChunk(io: Server, socket: Socket, payload: AudioChunkPayload): void {
  // Get session ID for this socket
  const sessionId = socketSessionMap.get(socket.id);
  if (!sessionId) {
    console.error(`Received audio chunk from socket ${socket.id} with no associated session`);
    return;
  }
  
  // Record session activity
  sessionService.recordSessionActivity(sessionId);
  
  // Process audio chunk
  audioProcessor.processChunk(sessionId, payload);
  
  // Process buffer if needed
  audioProcessor.processOldChunks(sessionId);
  
  // Get audio data for processing
  const audioData = audioProcessor.getAudioForProcessing(sessionId);
  if (audioData) {
    // In a real application, this is where you would send the audio to WhisperX
    // For now, we'll emit a mock transcription result
    const mockTranscriptionResult = {
      words: [
        {
          word: "hello",
          startTime: 0,
          endTime: 0.5,
          confidence: 0.95,
          id: `word-${Date.now()}-1`,
        },
        {
          word: "world",
          startTime: 0.6,
          endTime: 1.0,
          confidence: 0.92,
          id: `word-${Date.now()}-2`,
        },
      ],
      sessionId,
      timestamp: Date.now(),
    };
    
    // Emit transcription result to the client
    socket.emit(SocketEvent.TRANSCRIPTION_RESULT, mockTranscriptionResult);
  }
} 