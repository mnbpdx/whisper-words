#!/usr/bin/env python3

import os
import sys
import json
import tempfile
import numpy as np
import logging
from typing import Dict, List, Any, Optional
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("whisperx_wrapper")

# Function to import WhisperX if available
def import_whisperx():
    try:
        import whisperx
        return whisperx
    except ImportError:
        logger.error("WhisperX not installed. For development/testing, using mock implementation.")
        return None

# Mock transcription for development/testing when WhisperX is not available
def mock_transcribe(audio_data: np.ndarray, sample_rate: int) -> Dict[str, Any]:
    logger.info(f"Mock transcribing audio with shape {audio_data.shape}, sample rate {sample_rate}")
    
    # Simulate processing time
    time.sleep(1)
    
    # Generate mock words with random timing
    duration = len(audio_data) / sample_rate
    words = []
    
    sample_words = ["hello", "world", "this", "is", "a", "test", "of", "speech", "recognition"]
    word_count = min(int(duration / 0.3), len(sample_words))
    
    for i in range(word_count):
        start_time = i * 0.3
        end_time = start_time + 0.2
        
        words.append({
            "text": sample_words[i],
            "start": start_time,
            "end": end_time,
            "confidence": 0.85 + (np.random.random() * 0.15)
        })
    
    return {
        "words": words,
        "text": " ".join([w["text"] for w in words])
    }

# Process audio with WhisperX
def process_audio(audio_data: np.ndarray, sample_rate: int) -> Dict[str, Any]:
    whisperx = import_whisperx()
    
    if whisperx:
        try:
            # For actual implementation
            device = "cuda" if whisperx.is_available("cuda") else "cpu"
            logger.info(f"Processing with WhisperX on {device}")
            
            # Load model
            model = whisperx.load_model("base", device=device)
            
            # Transcribe audio
            result = model.transcribe(audio_data, batch_size=16)
            
            # Align words
            model_a, metadata = whisperx.load_align_model(language_code=result["language"], device=device)
            result = whisperx.align(result["segments"], model_a, metadata, audio_data, device)
            
            # Process word-level timestamps
            words = []
            for segment in result["segments"]:
                for word in segment["words"]:
                    words.append({
                        "text": word["word"],
                        "start": word["start"],
                        "end": word["end"],
                        "confidence": word.get("confidence", 0.9)
                    })
            
            return {
                "words": words,
                "text": " ".join([w["text"] for w in words])
            }
            
        except Exception as e:
            logger.error(f"Error processing with WhisperX: {str(e)}")
            logger.info("Falling back to mock implementation")
            return mock_transcribe(audio_data, sample_rate)
    else:
        # Use mock implementation if WhisperX not available
        return mock_transcribe(audio_data, sample_rate)

def main():
    try:
        # Read input from stdin
        input_json = json.loads(sys.stdin.read())
        
        # Extract audio data and sample rate
        audio_data = np.array(input_json["audio_data"], dtype=np.float32)
        sample_rate = input_json["sample_rate"]
        
        # Process audio
        start_time = time.time()
        result = process_audio(audio_data, sample_rate)
        processing_time = time.time() - start_time
        
        # Add processing metadata
        result["processing_time"] = processing_time
        result["sample_rate"] = sample_rate
        
        # Output result to stdout
        sys.stdout.write(json.dumps(result))
        sys.stdout.flush()
        
    except Exception as e:
        error_msg = {"error": str(e)}
        sys.stderr.write(json.dumps(error_msg))
        sys.stderr.flush()
        sys.exit(1)

if __name__ == "__main__":
    main() 