#!/usr/bin/env python3
"""
Save Recording Script for ScribeFlow Transcribe App

This script allows external apps/screens to save audio recordings
to the transcribe app so they appear in the transcripts page.

Usage:
  python3 save-recording.py <audio_file_path> [--auto-transcribe] [--name <custom_name>]

Examples:
  python3 save-recording.py /path/to/recording.wav
  python3 save-recording.py /path/to/recording.m4a --auto-transcribe
  python3 save-recording.py /path/to/recording.mp3 --auto-transcribe --name "Meeting Recording"
"""

import argparse
import os
import requests
import sys
from pathlib import Path


def save_recording_to_transcribe_app(audio_file_path, auto_transcribe=False, custom_name=None, server_url=None):
    """
    Save an audio recording to the transcribe app backend.
    
    Args:
        audio_file_path (str): Path to the audio file
        auto_transcribe (bool): Whether to automatically transcribe the recording
        custom_name (str): Custom name for the recording
        server_url (str): Base URL of the backend
    
    Returns:
        dict: Response from the server
    """
    # Use provided server_url or environment variable or default
    base_url = server_url or os.environ.get('SCRIBEFLOW_API_URL', 'http://localhost:3001')
    endpoint_url = f"{base_url.rstrip('/')}/recordings/external"

    # Validate file exists
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
    
    # Get file info
    file_path = Path(audio_file_path)
    file_name = custom_name or file_path.name
    
    try:
        with open(audio_file_path, 'rb') as audio_file:
            files = {
                'audio': (file_name, audio_file, 'audio/*')
            }
            
            data = {
                'autoTranscribe': 'true' if auto_transcribe else 'false'
            }
            
            print(f"📤 Uploading recording: {file_name}")
            print(f"🔗 Target: {base_url}")
            if auto_transcribe:
                print("🤖 Auto-transcription enabled")
            
            response = requests.post(endpoint_url, files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Recording saved successfully!")
                print(f"📊 Recording ID: {result.get('recordingId')}")
                print(f"📁 Server filename: {result.get('filename')}")
                
                if auto_transcribe:
                    print("🔄 Transcription started in background...")
                    print("💡 Check the Transcripts page in the app to see the result")
                else:
                    print("💡 You can transcribe it later from the Transcripts page")
                
                return result
            else:
                error_msg = f"Failed to save recording. Status: {response.status_code}"
                if response.text:
                    try:
                        error_data = response.json()
                        error_msg += f"\nError: {error_data.get('error', 'Unknown error')}"
                        if 'details' in error_data:
                            error_msg += f"\nDetails: {error_data['details']}"
                    except:
                        error_msg += f"\nResponse: {response.text}"
                
                raise Exception(error_msg)
                
    except requests.exceptions.ConnectionError:
        raise Exception(
            f"❌ Could not connect to transcribe app backend at {base_url}.\n"
            "Make sure the backend server is running and accessible."
        )
    except requests.exceptions.Timeout:
        raise Exception("❌ Request timed out. The file might be too large.")


def main():
    parser = argparse.ArgumentParser(
        description="Save audio recording to ScribeFlow Transcribe App",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s /path/to/recording.wav
  %(prog)s /path/to/recording.m4a --auto-transcribe
  %(prog)s /path/to/recording.mp3 --auto-transcribe --name "Meeting Recording"
  
Supported audio formats:
  .wav, .mp3, .m4a, .ogg, .flac, .webm, .mp4 (audio)
        """
    )
    
    parser.add_argument(
        'audio_file',
        help='Path to the audio file to save'
    )
    
    parser.add_argument(
        '--auto-transcribe',
        action='store_true',
        help='Automatically start transcription after saving'
    )
    
    parser.add_argument(
        '--name',
        help='Custom name for the recording (defaults to filename)'
    )
    
    parser.add_argument(
        '--server-url',
        help='Base URL of the transcribe app backend (default: http://localhost:3001 or SCRIBEFLOW_API_URL env var)'
    )
    
    args = parser.parse_args()
    
    try:
        result = save_recording_to_transcribe_app(
            args.audio_file,
            args.auto_transcribe,
            args.name,
            args.server_url
        )
        
        print(f"\n🎉 Success! Your recording is now available in the Transcripts page.")
        
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
