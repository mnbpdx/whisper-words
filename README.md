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
- Python 3.8+
- CUDA-compatible GPU (recommended for faster transcription)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/whisper-words.git
   cd whisper-words
   ```

2. Install JavaScript dependencies

   ```bash
   npm install
   ```

3. Install Python dependencies (WhisperX)

   ```bash
   pip install -r requirements.txt
   ```

   Note: WhisperX performs best with GPU acceleration. If you have a CUDA-compatible GPU, ensure you have the appropriate CUDA toolkit installed.

4. Set environment variables (copy from example)

   ```bash
   cp .env.local.example .env.local
   ```

   Update .env.local with your configuration (especially PYTHON_PATH if needed)

5. Start the development server

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## WhisperX Integration

This project integrates WhisperX for accurate speech transcription with word-level timestamps. The integration uses:

- A WebSocket server for real-time audio streaming from the browser
- A Python child process for WhisperX processing
- Batched inference for optimal performance

### Configuration Options

You can adjust WhisperX performance in the Python wrapper:

- Model size: Change "base" to "large-v2" for higher accuracy (requires more GPU memory)
- Batch size: Adjust batch_size parameter for your GPU capabilities
- Compute type: Change to "int8" if low on GPU memory

## Project Structure

```
whisper-words/
├── src/
│   ├── app/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── api/
│   │   │   └── socket/    # WebSocket server
│   │   ├── server/
│   │   │   └── python/    # WhisperX integration
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

- Support for multiple languages
- Speaker diarization (speaker identification)
- User preferences for fade timing and appearance
- Export/save functionality for pinned words

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [WhisperX](https://github.com/m-bain/whisperX) for speech recognition technology
- NextJS team for the amazing framework
- TailwindCSS for the styling utilities
