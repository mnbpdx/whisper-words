Fixes #1

## Story 1: Project Foundation and Audio Capture

### What's Been Implemented
- ✅ Set up NextJS project with TypeScript, TailwindCSS, ESLint, and Prettier
- ✅ Created application layout with responsive design
- ✅ Implemented audio capture service with microphone permissions
- ✅ Added audio buffering system for future WebSocket integration
- ✅ Created UI controls including toggle switch and status indicators
- ✅ Added error handling for compatibility and permission issues

### Implementation Details
- The project uses Next.js 14 with App Router
- Audio capture is implemented with Web Audio API
- UI components are built with TailwindCSS for styling
- Created reusable hooks for audio capture and buffering

### Testing
- Verify that the toggle switch changes color (green=active, red=inactive)
- Check that microphone permissions are properly requested
- Confirm that audio capture is active when toggle is on
- Test error handling by denying microphone permissions

### Screenshots
N/A - Functionality needs to be manually tested

### Next Steps
This PR completes Story 1. The next steps will be Story 2: implementing real-time communication system with Socket.IO. 