import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Create a simple handler function since we can't easily import the ES module
function handleConnection(io, socket) {
  console.log(`Socket connected: ${socket.id}`);

  // Basic event handlers
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });

  // Handle audio chunks
  socket.on('audio_chunk', (payload) => {
    console.log(`Received audio chunk from ${socket.id}, chunkId: ${payload.chunkId}`);

    // Send a mock transcription response
    const response = {
      words: [
        { text: 'Hello', start: 0, end: 0.1, confidence: 0.95 },
        { text: 'world', start: 0.15, end: 0.3, confidence: 0.95 },
        { text: 'this', start: 0.35, end: 0.5, confidence: 0.95 },
        { text: 'is', start: 0.55, end: 0.6, confidence: 0.98 },
        { text: 'working', start: 0.65, end: 0.9, confidence: 0.92 },
      ],
      timestamp: Date.now(),
    };

    // Send the transcription result
    socket.emit('transcription_result', response);
  });

  // Handle session creation
  socket.on('session_create', (data, callback) => {
    const sessionId = `session_${Date.now()}`;
    console.log(`Created session: ${sessionId}`);
    if (callback) callback({ sessionId });
  });

  // Handle session destruction
  socket.on('session_destroy', (data, callback) => {
    console.log(`Destroyed session: ${data?.sessionId || 'unknown'}`);
    if (callback) callback({ success: true });
  });
}

// Prepare the Next.js app
app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Create Socket.IO server
  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Handle Socket.IO connections
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    handleConnection(io, socket);
  });

  // Start the server
  const PORT = process.env.PORT || 3333;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> Socket.IO path: /api/socket`);
  });
});
