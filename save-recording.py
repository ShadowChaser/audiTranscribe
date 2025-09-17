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


def save_recording_to_transcribe_app(audio_file_path, auto_transcribe=False, custom_name=None):
    """
    Save an audio recording to the transcribe app backend.
    
    Args:
        audio_file_path (str): Path to the audio file
        auto_transcribe (bool): Whether to automatically transcribe the recording
        custom_name (str): Custom name for the recording
    
    Returns:
        dict: Response from the server
    """
    # Validate file exists
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
    
    # Get file info
    file_path = Path(audio_file_path)
    file_name = custom_name or file_path.name
    
    # Prepare the request
    url = "http://localhost:3001/recordings/external"
    
    try:
        with open(audio_file_path, 'rb') as audio_file:
            files = {
                'audio': (file_name, audio_file, 'audio/*')
            }
            
            data = {
                'autoTranscribe': 'true' if auto_transcribe else 'false'
            }
            
            print(f"📤 Uploading recording: {file_name}")
            if auto_transcribe:
                print("🤖 Auto-transcription enabled")
            
            response = requests.post(url, files=files, data=data, timeout=30)
            
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
            "❌ Could not connect to transcribe app backend.\n"
            "Make sure the backend server is running on http://localhost:3001"
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
        default='http://localhost:3001',
        help='Base URL of the transcribe app backend (default: %(default)s)'
    )
    
    args = parser.parse_args()
    
    try:
        # Update the URL if custom server URL is provided
        global url
        url = f"{args.server_url.rstrip('/')}/recordings/external"
        
        result = save_recording_to_transcribe_app(
            args.audio_file,
            args.auto_transcribe,
            args.name
        )
        
        print(f"\n🎉 Success! Your recording is now available in the Transcripts page.")
        
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
