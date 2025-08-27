# 🎙️ Whisper Local Transcription App

A local web application that transcribes audio files using OpenAI's Whisper model. Upload audio files and get accurate AI-powered transcriptions with timestamps.

## ✨ Features

- **Local Processing**: All transcription happens on your machine - no cloud services needed
- **Multiple Audio Formats**: Supports WAV, MP3, M4A, OGG, and FLAC files
- **Timestamped Output**: Get transcriptions with precise timestamps
- **Modern UI**: Beautiful, responsive React frontend
- **Fast Processing**: Uses faster-whisper for optimized performance

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **AI Model**: OpenAI Whisper (via faster-whisper)
- **Storage**: Local file system

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python 3.8+**
- **pip** (Python package manager)

## 🚀 Setup Instructions

### 1. Clone and Navigate
```bash
git clone <your-repo-url>
cd transcribeapp
```

### 2. Install Python Dependencies
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment and install faster-whisper
source venv/bin/activate
pip install faster-whisper
```

### 3. Setup Backend
```bash
cd backend
npm install
```

### 4. Setup Frontend
```bash
cd ../frontend
npm install
```

## 🎯 Running the Application

### Start Backend Server
```bash
cd backend
node server.js
```
The backend will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

## 📱 How to Use

1. Open your browser and go to `http://localhost:5173`
2. Click "Choose Audio File" and select an audio file
3. Click "Upload & Transcribe" to start the transcription process
4. Wait for the AI to process your audio (this may take a few minutes)
5. View your transcription with timestamps!

## 📂 Project Structure

```
transcribeapp/
├── backend/
│   ├── server.js          # Express server
│   ├── whisper.py         # Python Whisper wrapper
│   ├── uploads/           # Uploaded audio files
│   ├── transcripts/       # Generated transcriptions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   └── App.css        # Styling
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔧 API Endpoints

- `POST /upload` - Upload audio file and start transcription
- `GET /transcript/:filename` - Get transcription content
- `GET /transcripts/:filename` - Serve transcript files

## 🎨 Supported Audio Formats

- WAV (.wav)
- MP3 (.mp3)
- M4A (.m4a)
- OGG (.ogg)
- FLAC (.flac)

## ⚡ Performance Tips

- **CPU vs GPU**: The app uses CPU by default. For faster processing with NVIDIA GPUs, modify `whisper.py` to use `device="cuda"`
- **Model Size**: Currently uses "base" model for good speed/accuracy balance. Available models: tiny, base, small, medium, large
- **File Size**: Larger audio files will take longer to process

## 🔍 Troubleshooting

### "Transcription failed" Error
- Ensure Python 3.8+ is installed
- Verify faster-whisper is installed: `pip list | grep faster-whisper`
- Check that the audio file format is supported

### Backend Connection Issues
- Make sure the backend server is running on port 5000
- Check for CORS issues in browser console
- Verify no other services are using port 5000

### Python Path Issues
- The app uses `python3` command. On some systems, try changing to `python` in `server.js`

## 🚀 Future Enhancements

- [ ] Add audio playback with clickable timestamps
- [ ] Implement transcript summarization
- [ ] Add user accounts and transcript history
- [ ] Support for real-time audio streaming
- [ ] Export transcripts to different formats (PDF, DOCX, etc.)
- [ ] Add speaker diarization (identify different speakers)

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


# Backend dependencies
cd backend && npm install

# Frontend dependencies  
cd frontend && npm install

# Start backend
cd backend && node server.js

# Start frontend
cd frontend && npm run dev

# Already done - virtual environment is set up
source venv/bin/activate  # If you need to activate it manually# audiTranscribe
