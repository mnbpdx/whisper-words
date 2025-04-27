import { NextRequest, NextResponse } from 'next/server';
import { AudioProcessor } from '../../../server/audioProcessor';
import { SessionService } from '../../../services/sessionService';

// Services
const audioProcessor = new AudioProcessor();
const sessionService = new SessionService();

// Process audio data
export async function POST(req: NextRequest) {
  try {
    // Get session ID from query parameters
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Verify session exists and is active
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }
    
    // Get audio data from request
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }
    
    // Get sample rate from form data or use default
    const sampleRate = parseInt(formData.get('sampleRate') as string || '16000', 10);
    
    // Get timestamp from form data or use current time
    const timestamp = parseInt(formData.get('timestamp') as string || Date.now().toString(), 10);
    
    // Convert audio file to array buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    
    // Create audio chunk payload
    const audioChunk = {
      chunkId: formData.get('chunkId') as string || `chunk-${Date.now()}`,
      timestamp,
      audioData: arrayBuffer,
      sampleRate,
      isLastChunk: formData.get('isLastChunk') === 'true',
    };
    
    // Process audio chunk
    audioProcessor.processChunk(sessionId, audioChunk);
    
    // Process old chunks if necessary
    audioProcessor.processOldChunks(sessionId);
    
    // Get session stats
    const stats = audioProcessor.getSessionStats(sessionId);
    
    // Update session activity timestamp
    await sessionService.recordSessionActivity(sessionId);
    
    // Return success with stats
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error processing audio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get audio processing status for session
export async function GET(req: NextRequest) {
  try {
    // Get session ID from query parameters
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Verify session exists
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Get session stats
    const stats = audioProcessor.getSessionStats(sessionId);
    
    if (!stats) {
      return NextResponse.json({ error: 'No audio processing data found for session' }, { status: 404 });
    }
    
    // Return stats
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error getting audio processing status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 