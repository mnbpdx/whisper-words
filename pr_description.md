Fixes #2

## Changes
- Set up Socket.IO server and client integration
- Create audio streaming implementation with WebSocket transport
- Implement session management API and state tracking
- Develop audio chunk processing pipeline
- Add WebSocket event handling and connection status indicators
- Fix microphone permission handling in audio service

## Testing
1. Run the application with npm run dev
2. Toggle the microphone button to start audio capture
3. Verify the WebSocket connection is established
4. Check that audio data is being streamed correctly 