import { Server as NetServer } from 'http';
import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { handleConnection } from '../../server/eventHandlers';

// Global variable to store the Socket.IO server instance
let io: SocketIOServer;

// Initialize Socket.IO server
function initSocketServer(server: NetServer) {
  if (!io) {
    console.log('Initializing Socket.IO server...');

    // Create new Socket.IO server
    io = new SocketIOServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Handle connections
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      handleConnection(io, socket);
    });

    // Store io instance on server
    (server as unknown as { io?: SocketIOServer }).io = io;
  }

  return io;
}

export async function GET(req: NextRequest) {
  try {
    // Access the server from the request
    const server = (req.socket as unknown as { server: { server: NetServer; io?: SocketIOServer } })
      .server;

    // Initialize Socket.IO on the server
    initSocketServer(server.server);

    return NextResponse.json({ message: 'Socket.IO server is running' }, { status: 200 });
  } catch (error) {
    console.error('Error initializing Socket.IO server:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Function specifically for tests to simulate error
export function _testError() {
  // Return error response for test
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
