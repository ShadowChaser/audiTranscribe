#!/bin/bash

# Save Recording Script for ScribeFlow Transcribe App
# 
# This script allows external apps/screens to save audio recordings
# to the transcribe app so they appear in the transcripts page.
# 
# Usage: ./save-recording.sh <audio_file> [auto-transcribe] [custom_name]
# 
# Environment Variables:
#   SCRIBEFLOW_API_URL: Base URL of the backend (default: http://localhost:3001)

set -e

# Configuration
BASE_URL="${SCRIBEFLOW_API_URL:-http://localhost:3001}"
BACKEND_URL="${BASE_URL%/}/recordings/external"

# Check arguments
if [ $# -lt 1 ]; then
    echo "❌ Error: Please provide an audio file path"
    echo ""
    echo "Usage: $0 <audio_file> [auto-transcribe] [custom_name]"
    echo ""
    echo "Examples:"
    echo "  $0 ~/Desktop/recording.wav"
    echo "  $0 ~/Desktop/recording.m4a true"
    echo "  $0 ~/Desktop/recording.mp3 true 'My Meeting'"
    exit 1
fi

AUDIO_FILE="$1"
AUTO_TRANSCRIBE="${2:-false}"
CUSTOM_NAME="${3:-}"

# Validate file exists
if [ ! -f "$AUDIO_FILE" ]; then
    echo "❌ Error: Audio file not found: $AUDIO_FILE"
    exit 1
fi

# Get filename for display
FILENAME=$(basename "$AUDIO_FILE")
DISPLAY_NAME="${CUSTOM_NAME:-$FILENAME}"

echo "📤 Uploading recording: $DISPLAY_NAME"
echo "🔗 Target: $BASE_URL"

if [ "$AUTO_TRANSCRIBE" = "true" ]; then
    echo "🤖 Auto-transcription enabled"
fi

# Upload the file using curl
RESPONSE=$(curl -s -X POST \
    -F "audio=@$AUDIO_FILE" \
    -F "autoTranscribe=$AUTO_TRANSCRIBE" \
    "$BACKEND_URL" \
    -w "%{http_code}")

# Extract status code (last 3 characters)
HTTP_CODE="${RESPONSE: -3}"
BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Recording saved successfully!"
    
    # Try to parse JSON response (basic parsing)
    if command -v python3 &> /dev/null; then
        RECORDING_ID=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('recordingId', 'N/A'))" 2>/dev/null || echo "N/A")
        SERVER_FILENAME=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('filename', 'N/A'))" 2>/dev/null || echo "N/A")
        
        echo "📊 Recording ID: $RECORDING_ID"
        echo "📁 Server filename: $SERVER_FILENAME"
    fi
    
    if [ "$AUTO_TRANSCRIBE" = "true" ]; then
        echo "🔄 Transcription started in background..."
        echo "💡 Check the Transcripts page in the app to see the result"
    else
        echo "💡 You can transcribe it later from the Transcripts page"
    fi
    
    echo ""
    echo "🎉 Success! Your recording is now available in the Transcripts page."
    
else
    echo "❌ Error: Failed to save recording (HTTP $HTTP_CODE)"
    if [ -n "$BODY" ]; then
        echo "Response: $BODY"
    fi
    
    if [ "$HTTP_CODE" -eq 000 ] || [ -z "$HTTP_CODE" ]; then
        echo ""
        echo "💡 Make sure the backend server is running and accessible at $BASE_URL"
    fi
    
    exit 1
fi
