import { Server as NetServer } from 'http';
import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { handleConnection } from '../../server/eventHandlers';

// Initialize Socket.IO server
function initSocketServer(req: NextRequest) {
  // @ts-ignore - res is not in types but is available
  const res = req.socket.server;
  
  if (!res.io) {
    console.log('Initializing Socket.IO server...');
    
    // Create new Socket.IO server
    const io = new SocketIOServer(res.server as NetServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Handle connections
    io.on('connection', (socket) => {
      handleConnection(io, socket);
    });
    
    // Store io instance on response object
    res.io = io;
  }
  
  return res.io;
}

export function GET(req: NextRequest) {
  try {
    // Initialize Socket.IO server
    initSocketServer(req);
    
    return NextResponse.json({ message: 'Socket.IO server is running' }, { status: 200 });
  } catch (error) {
    console.error('Socket.IO server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 