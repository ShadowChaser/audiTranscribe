# 📱 External Recording Integration

This guide explains how to save recordings from external apps or screens to your ScribeFlow transcribe app so they appear in the Transcripts page.

## 🎯 Problem Solved

When you record audio from other screens, applications, or external recording apps, those recordings don't automatically appear in your transcribe app. This integration allows any external app to save recordings to your transcribe app's database, making them visible and available for transcription.

## 🚀 Quick Start

### Method 1: Using the Python Script

```bash
# Basic usage - save recording without transcription
python3 save-recording.py ~/Desktop/my-recording.wav

# Auto-transcribe the recording
python3 save-recording.py ~/Desktop/my-recording.wav --auto-transcribe

# Custom name with auto-transcription
python3 save-recording.py ~/Desktop/recording.m4a --auto-transcribe --name "Team Meeting"
```

### Method 2: Using the Shell Script

```bash
# Make the script executable (one time only)
chmod +x save-recording.sh

# Basic usage
./save-recording.sh ~/Desktop/my-recording.wav

# Auto-transcribe
./save-recording.sh ~/Desktop/my-recording.wav true

# Custom name with auto-transcription
./save-recording.sh ~/Desktop/recording.m4a true "Team Meeting"
```

### Method 3: Direct API Call

```bash
# Using curl to save recording
curl -X POST \
  -F "audio=@/path/to/recording.wav" \
  -F "autoTranscribe=true" \
  http://localhost:3001/recordings/external
```

## 📋 Requirements

- **Backend server** must be running (`node server.js` in the `backend` directory)
- **Python 3** (for the Python script)
- **curl** (for shell script or direct API calls)
- **requests library** for Python: `pip install requests`

## 🎵 Supported Audio Formats

The following audio formats are supported:
- `.wav` - Uncompressed audio
- `.mp3` - MP3 compressed audio
- `.m4a` - AAC compressed audio (common on macOS/iOS)
- `.ogg` - Ogg Vorbis
- `.flac` - Lossless compression
- `.webm` - WebM audio
- `.mp4` - MP4 audio streams

## 🔧 Integration Examples

### macOS Voice Memos Integration

```bash
# Export from Voice Memos and save to transcribe app
./save-recording.sh ~/Desktop/VoiceMemo001.m4a true "Voice Memo"
```

### Zoom/Teams Recording Integration

```bash
# Save Zoom recording with auto-transcription
python3 save-recording.py ~/Downloads/zoom_meeting.m4a --auto-transcribe --name "Weekly Standup"
```

### OBS Studio Recording Integration

```bash
# Save OBS recording
./save-recording.sh ~/Videos/obs-recording.mkv true "Screen Recording"
```

### Custom App Integration

For custom applications, integrate with the API directly:

#### Python Example
```python
import requests

def save_to_transcribe_app(audio_file_path, name=None, auto_transcribe=False):
    url = "http://localhost:3001/recordings/external"
    
    with open(audio_file_path, 'rb') as f:
        files = {'audio': (name or os.path.basename(audio_file_path), f, 'audio/*')}
        data = {'autoTranscribe': 'true' if auto_transcribe else 'false'}
        
        response = requests.post(url, files=files, data=data)
        return response.json()

# Usage
result = save_to_transcribe_app('recording.wav', 'My Recording', True)
print(f"Recording saved with ID: {result['recordingId']}")
```

#### Node.js Example
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function saveToTranscribeApp(audioFilePath, name, autoTranscribe = false) {
    const form = new FormData();
    form.append('audio', fs.createReadStream(audioFilePath), name);
    form.append('autoTranscribe', autoTranscribe.toString());
    
    const response = await axios.post('http://localhost:3001/recordings/external', form, {
        headers: form.getHeaders()
    });
    
    return response.data;
}

// Usage
saveToTranscribeApp('recording.wav', 'My Recording', true)
    .then(result => console.log(`Recording saved with ID: ${result.recordingId}`));
```

## 🌐 API Reference

### POST /recordings/external

Save an external recording to the transcribe app.

**Endpoint:** `http://localhost:3001/recordings/external`

**Method:** `POST`

**Content-Type:** `multipart/form-data`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audio` | File | Yes | Audio file to upload |
| `autoTranscribe` | String | No | "true" to auto-transcribe, "false" or omit to skip transcription |

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "External recording saved successfully",
  "recordingId": "60f7b0b5e4b0a1b2c3d4e5f6",
  "filename": "external_1672531200000_abc123.wav",
  "autoTranscribe": false
}
```

**Error (400/500):**
```json
{
  "error": "No audio file uploaded",
  "details": "Additional error information"
}
```

## ⚙️ Configuration

### Changing Backend URL

If your backend runs on a different port or host:

**Python script:**
```bash
python3 save-recording.py recording.wav --server-url http://localhost:3002
```

**Shell script:** Edit the `BACKEND_URL` variable in `save-recording.sh`:
```bash
BACKEND_URL="http://your-server:3002/recordings/external"
```

### Custom Recording Names

The app automatically generates names for external recordings with the format:
`external_{timestamp}_{original_filename}`

You can override this by providing a custom name:

```bash
python3 save-recording.py recording.wav --name "Important Meeting"
```

## 🔄 Auto-Refresh in Frontend

The Transcripts page automatically refreshes every 5 seconds to show new recordings. You don't need to manually refresh the page - external recordings will appear automatically!

## 🔍 Monitoring and Logs

### Backend Logs
When external recordings are saved, you'll see logs like:
```
📱 External recording received: My Recording.wav
📊 External recording saved to database with ID: 60f7b0b5e4b0a1b2c3d4e5f6
🤖 Auto-transcribing external recording...
✅ External recording transcribed in 2543ms
```

### Frontend Indicators
- External recordings appear with a 📁 icon in the Transcripts page
- Auto-transcribed recordings will show transcription status
- Processing status: pending → processing → completed/failed

## 🛠️ Automation Ideas

### Folder Monitoring Script

Create a script that monitors a folder for new recordings:

```bash
#!/bin/bash
# monitor-recordings.sh

WATCH_FOLDER="$HOME/Desktop/Recordings"
SCRIPT_PATH="./save-recording.sh"

echo "Monitoring $WATCH_FOLDER for new recordings..."

fswatch -o "$WATCH_FOLDER" | while read f; do
    for file in "$WATCH_FOLDER"/*.{wav,mp3,m4a,ogg,flac}; do
        if [ -f "$file" ] && [ ! -f "$file.processed" ]; then
            echo "New recording detected: $(basename "$file")"
            $SCRIPT_PATH "$file" true "Auto-detected Recording"
            touch "$file.processed"
        fi
    done
done
```

### Automated Transcription Service

```python
#!/usr/bin/env python3
# auto-transcribe-service.py

import os
import time
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class RecordingHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            file_path = event.src_path
            if file_path.lower().endswith(('.wav', '.mp3', '.m4a', '.ogg', '.flac')):
                print(f"New recording: {file_path}")
                time.sleep(1)  # Wait for file to be fully written
                self.save_recording(file_path)
    
    def save_recording(self, file_path):
        with open(file_path, 'rb') as f:
            files = {'audio': (os.path.basename(file_path), f, 'audio/*')}
            data = {'autoTranscribe': 'true'}
            
            try:
                response = requests.post('http://localhost:3001/recordings/external', 
                                       files=files, data=data)
                if response.status_code == 200:
                    print(f"Successfully saved: {file_path}")
                else:
                    print(f"Failed to save: {file_path}")
            except Exception as e:
                print(f"Error saving {file_path}: {e}")

if __name__ == "__main__":
    path = input("Enter folder to monitor: ").strip() or os.path.expanduser("~/Desktop")
    
    event_handler = RecordingHandler()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=False)
    observer.start()
    
    print(f"Monitoring {path} for recordings...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
```

## 🚨 Troubleshooting

### Recording Not Appearing
1. **Check backend logs** - ensure the upload was successful
2. **Check frontend auto-refresh** - wait up to 5 seconds for the refresh
3. **Verify API response** - ensure you got a success response

### Transcription Not Working
1. **Check Python environment** - ensure faster-whisper is installed in the venv
2. **Check file format** - ensure the audio format is supported
3. **Check backend logs** - look for transcription error messages

### Connection Errors
1. **Verify backend is running** - `curl http://localhost:3001/recordings/external`
2. **Check port conflicts** - ensure nothing else is using port 3001
3. **Firewall settings** - ensure local connections are allowed

### File Size Issues
- Maximum file size depends on your server configuration
- For large files, consider compressing or splitting them
- Monitor server memory usage during large file uploads

## 🎉 Success!

Once set up, you can now:
✅ Record from any external app/screen
✅ Automatically save to your transcribe app
✅ Auto-transcribe recordings
✅ View all recordings in the Transcripts page
✅ Generate summaries and manage transcripts

Your recordings from external sources will now seamlessly integrate with your transcribe app!
