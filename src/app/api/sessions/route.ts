import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../services/sessionService';
import { Session } from '../../types/session';

// Create session service
const sessionService = new SessionService();

// Create a new session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, deviceInfo } = body;
    
    const session = await sessionService.createSession(userId, deviceInfo);
    
    return NextResponse.json({
      sessionId: session.id,
      createdAt: session.createdAt,
      status: session.status,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get session by ID
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    const session = await sessionService.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update session by ID
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, ...updates } = body;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Only allow certain fields to be updated
    const allowedUpdates: (keyof Session)[] = ['status', 'metadata', 'audioConfig'];
    const filteredUpdates: Partial<Session> = {};
    
    for (const key of allowedUpdates) {
      if (key in updates) {
        // @ts-ignore - Key is definitely a key of Session
        filteredUpdates[key] = updates[key];
      }
    }
    
    const updatedSession = await sessionService.updateSession(sessionId, filteredUpdates);
    
    return NextResponse.json(updatedSession);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// End a session
export async function DELETE(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    await sessionService.endSession(sessionId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 