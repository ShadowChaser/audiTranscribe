const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST']
  }
});

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Storage setup
const upload = multer({ dest: "uploads/" });

// Serve transcript files
app.use('/transcripts', express.static(path.join(__dirname, 'transcripts')));

app.post("/upload", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  const filePath = path.join(__dirname, req.file.path);
  const outputFile = path.join(__dirname, `transcripts/${req.file.filename}.txt`);
  
  console.log(`Processing audio file: ${filePath}`);
  
  // Run Whisper via Python (using virtual environment)
  const pythonPath = path.join(__dirname, '../venv/bin/python');
  exec(`"${pythonPath}" whisper.py "${filePath}" "${outputFile}"`, (err, stdout, stderr) => {
    if (err) {
      console.error("Transcription error:", err);
      console.error("stderr:", stderr);
      return res.status(500).json({ error: "Transcription failed", details: stderr });
    }
    
    console.log("Transcription completed:", stdout);
    res.json({ 
      transcriptFile: `transcripts/${req.file.filename}.txt`,
      message: "Transcription completed successfully"
    });
  });
});

// Endpoint to get transcript content
app.get("/transcript/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "transcripts", filename);
  
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(404).json({ error: "Transcript not found" });
    }
    res.json({ content: data });
  });
});

// WebSocket connection for live transcription
let clientSessions = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Initialize session for this client
  clientSessions.set(socket.id, {
    audioChunks: [],
    isTranscribing: false,
    lastProcessTime: 0
  });
  console.log(`📝 Session initialized for ${socket.id}`);
  
  socket.on('start-live-transcription', () => {
    console.log(`🎙️ START: Live transcription requested by ${socket.id}`);
    const session = clientSessions.get(socket.id);
    if (!session) {
      console.error(`❌ ERROR: No session found for ${socket.id}`);
      return;
    }
    session.audioChunks = [];
    session.isTranscribing = true;
    session.lastProcessTime = Date.now();
    console.log(`✅ START: Session ${socket.id} is now transcribing`);
  });
  
  socket.on('audio-blob', (audioBuffer) => {
    const session = clientSessions.get(socket.id);
    console.log(`🎵 AUDIO: Received ${audioBuffer.byteLength} bytes from ${socket.id}`);
    
    if (!session) {
      console.error(`❌ AUDIO ERROR: No session found for ${socket.id}`);
      return;
    }
    
    if (!session.isTranscribing) {
      console.warn(`⚠️ AUDIO WARNING: Session ${socket.id} not transcribing, ignoring audio`);
      return;
    }
    
    // Accumulate chunks
    session.audioChunks.push(Buffer.from(audioBuffer));
    console.log(`📊 AUDIO: Session ${socket.id} now has ${session.audioChunks.length} chunks`);
    
    // Process every 4 seconds worth of audio (2 chunks)
    const now = Date.now();
    const timeSinceLastProcess = now - session.lastProcessTime;
    console.log(`⏱️ TIMING: ${timeSinceLastProcess}ms since last process, need 3000ms`);
    
    if (session.audioChunks.length >= 2 && timeSinceLastProcess >= 3000) {
      console.log(`🚀 PROCESSING: Triggering audio processing for ${socket.id}`);
      processAccumulatedAudio(socket, session);
      session.lastProcessTime = now;
    } else {
      console.log(`⏳ WAITING: Need ${2 - session.audioChunks.length} more chunks or ${3000 - timeSinceLastProcess}ms more time`);
    }
  });
  
  socket.on('stop-live-transcription', () => {
    console.log(`🛑 STOP: Live transcription stop requested by ${socket.id}`);
    const session = clientSessions.get(socket.id);
    if (session) {
      console.log(`📊 STOP: Session ${socket.id} has ${session.audioChunks.length} remaining chunks`);
      // Process any remaining chunks
      if (session.audioChunks.length > 0) {
        console.log(`🔄 STOP: Processing remaining chunks for ${socket.id}`);
        processAccumulatedAudio(socket, session);
      }
      session.isTranscribing = false;
      session.audioChunks = [];
      console.log(`✅ STOP: Session ${socket.id} stopped and cleaned`);
    } else {
      console.error(`❌ STOP ERROR: No session found for ${socket.id}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 DISCONNECT: Client ${socket.id} disconnected`);
    const session = clientSessions.get(socket.id);
    if (session) {
      console.log(`🧹 CLEANUP: Removing session for ${socket.id}`);
      clientSessions.delete(socket.id);
    }
  });
});

function processAccumulatedAudio(socket, session) {
  console.log(`🔄 PROCESS START: Processing audio for ${socket.id}`);
  
  if (session.audioChunks.length === 0) {
    console.log(`❌ PROCESS ERROR: No audio chunks to process for ${socket.id}`);
    return;
  }
  
  try {
    // Combine all accumulated chunks
    const combinedBuffer = Buffer.concat(session.audioChunks);
    console.log(`📦 COMBINE: Combined ${combinedBuffer.length} bytes from ${session.audioChunks.length} chunks for ${socket.id}`);
    
    const tempId = Date.now() + Math.random().toString(36).substring(2);
    const tempFile = path.join(__dirname, `uploads/live_${tempId}.wav`);
    
    console.log(`💾 FILE: Writing WAV audio to ${tempFile}`);
    fs.writeFileSync(tempFile, combinedBuffer);
    console.log(`✅ FILE: WAV file written successfully`);
    
    // Transcribe the WAV file directly (no FFmpeg conversion needed)
    const pythonPath = path.join(__dirname, '../venv/bin/python');
    console.log(`🐍 PYTHON: Starting transcription with ${pythonPath}`);
    
    const startTime = Date.now();
    exec(`"${pythonPath}" -c "from faster_whisper import WhisperModel; model = WhisperModel('tiny', device='cpu', compute_type='int8'); segments, info = model.transcribe('${tempFile}', beam_size=1, best_of=1, temperature=0); print(''.join([segment.text for segment in segments]))"`, { timeout: 15000 }, (err, stdout, stderr) => {
      const processingTime = Date.now() - startTime;
      console.log(`⏱️ TRANSCRIPTION: Completed in ${processingTime}ms`);
      
      if (err) {
        console.error(`❌ TRANSCRIPTION ERROR: ${err.message}`);
        console.error(`❌ STDERR: ${stderr}`);
        socket.emit('transcription-error', { error: 'Transcription failed', details: err.message });
      } else {
        const text = stdout.trim();
        console.log(`📝 RAW OUTPUT: "${stdout}"`);
        console.log(`📝 TRIMMED: "${text}"`);
        
        if (text && text.length > 0) {
          console.log(`✅ SUCCESS: Sending transcription result to ${socket.id}: "${text}"`);
          socket.emit('live-transcription', { text: text });
        } else {
          console.log(`🔇 SILENCE: No speech detected in audio`);
          socket.emit('live-transcription', { text: '', status: 'no_speech' });
        }
      }
      
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
        console.log(`✅ CLEANUP: File removed successfully`);
      } catch (cleanupErr) {
        console.log(`⚠️ CLEANUP WARNING: ${cleanupErr.message}`);
      }
    });
    
    // Clear processed chunks but keep the last one for continuity
    const beforeCount = session.audioChunks.length;
    session.audioChunks = session.audioChunks.slice(-1);
    console.log(`🔄 CHUNKS: Cleared ${beforeCount - session.audioChunks.length} chunks, kept ${session.audioChunks.length} for continuity`);
    
  } catch (error) {
    console.error(`❌ PROCESS ERROR: ${error.message}`);
    console.error(`❌ STACK: ${error.stack}`);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Live transcription WebSocket server ready");
  console.log("Make sure you have faster-whisper installed: pip install faster-whisper");
});
