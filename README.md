# WhisperWords

A real-time speech-to-text application that displays transcribed speech as word bubbles. Words fade away after 2 seconds unless pinned by the user.

## Features

- Real-time speech capture using Web Audio API
- Words appear as individual bubbles
- Words automatically fade after 2 seconds
- Words can be pinned to keep them on screen
- Visual status indicators for microphone and transcription status
- Clean, responsive UI built with NextJS and TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/whisper-words.git
   cd whisper-words
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
whisper-words/
├── src/
│   ├── app/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # Services for audio processing
│   │   ├── types/         # TypeScript type definitions
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main page
│   └── ...
├── public/                # Static assets
└── ...
```

## Future Enhancements

- Integration with WhisperX for accurate speech transcription
- WebSocket server for real-time communication
- Support for multiple languages
- User preferences for fade timing and appearance
- Export/save functionality for pinned words

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- WhisperX for speech recognition technology
- NextJS team for the amazing framework
- TailwindCSS for the styling utilities
