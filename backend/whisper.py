import sys
import os
from faster_whisper import WhisperModel

def transcribe_audio(audio_path, output_path):
    try:
        # Initialize the model (base model for good balance of speed and accuracy)
        model = WhisperModel("base", device="cpu", compute_type="int8")
        
        print(f"Transcribing audio file: {audio_path}")
        
        # Transcribe the audio (faster-whisper handles WebM automatically)
        segments, info = model.transcribe(audio_path, beam_size=5)
        
        print(f"Detected language: {info.language} (probability: {info.language_probability:.2f})")
        
        # Write transcription to file
        with open(output_path, "w", encoding="utf-8") as f:
            for segment in segments:
                f.write(f"[{segment.start:.2f}s - {segment.end:.2f}s]: {segment.text}\n")
        
        print(f"Transcription saved to: {output_path}")
        
    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 whisper.py <audio_path> <output_path>")
        sys.exit(1)
    
    audio_path = sys.argv[1]
    output_path = sys.argv[2]
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    transcribe_audio(audio_path, output_path)
