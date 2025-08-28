# 🎙️ ScribeFlow - AI Transcription & Chat Platform

A comprehensive local web application that transcribes audio files using OpenAI's Whisper model and provides intelligent chat capabilities. Upload audio files, get accurate AI-powered transcriptions, and chat with your content using Scribe AI.

## ✨ Features

- **Local Processing**: All transcription happens on your machine - no cloud services needed
- **Multiple Audio Formats**: Supports WAV, MP3, M4A, OGG, and FLAC files
- **Timestamped Output**: Get transcriptions with precise timestamps
- **AI Chat**: Chat with Scribe AI about your transcripts and documents
- **Study Notes**: Generate structured study notes with dedicated templates
- **Document Ingestion**: Upload PDFs, DOCX files, or paste text for chat context
- **Modern UI**: Beautiful, responsive React frontend with organized tabs
- **Fast Processing**: Uses faster-whisper for optimized performance

## 🛠️ Tech Stack

- **Backend**: Node.js + Express with Ollama integration
- **Frontend**: React + Vite
- **AI Models**: OpenAI Whisper (via faster-whisper) + Ollama for chat/summarization
- **Storage**: Local file system

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python 3.8+**
- **pip** (Python package manager)

## 📦 Version Control & Environments

- Do not commit local environments or bulky artifacts.
- This repo includes a root `.gitignore` that excludes:
  - `venv/`, `__pycache__/`, `*.pyc`
  - `frontend/node_modules/`, `backend/node_modules/`
  - `backend/uploads/`, `backend/transcripts/`
  - `.env`, `*.env`, logs, and `frontend/dist/`

Setup Python env locally:

```powershell
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install faster-whisper  # or pip install -r requirements.txt if available

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # or pip install faster-whisper
```

## 🚀 Setup Instructions

### 0. Start Ollama (Required for Chat)

Ollama is required for chat and summarization features.

**Install Ollama (Windows):**

1. Download and install Ollama from https://ollama.com/download
2. Open PowerShell and run:

```powershell
ollama serve
```

3. Keep Ollama running while using ScribeFlow.

If Ollama is not running, chat features will show an error: "Chat service unavailable. Please ensure Ollama is running."

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
ollama pull llama2

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
The backend will run on `http://localhost:3001`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📱 How to Use

### Transcription

1. Open your browser and go to `http://localhost:5173`
2. Navigate to the "Import Transcript" tab
3. Click "Choose Audio File" and select an audio file
4. Click "Transcribe File" to start the transcription process
5. View your transcription and generate summaries with study notes

### Recording

1. Go to the "Transcripts" tab
2. Click "Record" in the top bar
3. Choose microphone or system audio recording
4. Transcribe and summarize your recordings

### Chat

1. Navigate to the "Chat" tab
2. Upload documents or paste text as sources
3. Chat with Scribe AI about your content

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

### Transcription

- `POST /upload` - Upload audio file and start transcription
- `GET /transcript/:filename` - Get transcription content
- `GET /transcripts/:filename` - Serve transcript files
- `GET /recordings` - List saved recordings
- `DELETE /recording/:filename` - Delete recording

### Chat & Summarization

- `POST /chat` - Chat with AI using context from transcripts/documents
- `POST /summarize` - Generate summaries with custom styles
- `POST /ingest/file` - Upload documents for chat context
- `POST /ingest/text` - Add text for chat context
- `GET /ingest/list` - List ingested documents
- `DELETE /ingest/:id` - Remove ingested document

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

source venv/bin/activate # If you need to activate it manually# audiTranscribe

python -m venv venv
source venv/bin/activate # macOS/Linux
pip install -r requirements.txt

cd backend && npm install
cd ../frontend && npm install

1. Install Ollama

macOS:

brew install ollama

Linux:

curl -fsSL https://ollama.com/install.sh | sh

2. Enable & Start Ollama Service

After installation, make sure the service is running:

sudo systemctl enable ollama
sudo systemctl start ollama
sudo systemctl status ollama

Check logs if needed:

journalctl -u ollama -f

3. Verify Ollama Installation

Check version:

ollama --version

Check running process:

ps aux | grep ollama

4. Run Models

Pull a model:

ollama pull llama3

Run a model interactively:

ollama run llama3

5. Check Available Models
   ollama list

6. Test API Endpoint

Default API runs on http://localhost:11434

Test with curl:

curl http://localhost:11434/api/tags

7. Enable Remote Access (Optional)

If you want to access Ollama from other devices:

Edit Ollama service config:

sudo systemctl edit ollama.service

Add:

[Service]
Environment="OLLAMA_HOST=0.0.0.0"

Reload & restart:

sudo systemctl daemon-reexec
sudo systemctl restart ollama

Confirm:

curl http://<server-ip>:11434/api/tags

8. Useful Commands

Stop service:

sudo systemctl stop ollama

Restart service:

sudo systemctl restart ollama

Remove a model:

ollama rm <model-name>
