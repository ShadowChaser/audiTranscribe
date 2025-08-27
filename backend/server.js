const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
    methods: ["GET", "POST"],
  },
});

// Configure CORS to allow requests from frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// Chat endpoint using local Ollama
// In-memory store for ingested documents (PDF/DOCX/TXT/text)
// Structure: id -> { id, name, type, size, text, created }
const ingestedDocs = new Map();

app.post("/chat", async (req, res) => {
  try {
    const { message, context, docIds } = req.body || {};
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Build doc context from selected ingested docs
    let docsContext = "";
    if (Array.isArray(docIds) && docIds.length > 0) {
      const parts = [];
      for (const id of docIds) {
        const doc = ingestedDocs.get(id);
        if (doc && doc.text) {
          parts.push(`---\nTitle: ${doc.name} (${doc.type})\n---\n${doc.text}`);
        }
      }
      docsContext = parts.join("\n\n");
    }

    const systemPrompt = `You are AI Transcriber, a helpful assistant for audio transcription, meeting notes, and document Q&A. You help users understand and work with their recordings and uploaded documents.

Available context:
${context || "No transcripts available yet."}

Selected documents:\n${docsContext || "(none)"}

Respond conversationally and helpfully. If the user asks about transcripts or recordings, reference the context provided.`;

    const payload = {
      model: "llama3",
      prompt: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
      stream: false,
      options: {
        temperature: 0.7,
        max_tokens: 500,
      },
    };

    const ollamaUrl = "http://localhost:11434/api/generate";
    const doFetch = typeof fetch !== "undefined" ? fetch : null;
    if (!doFetch) {
      return res
        .status(500)
        .json({
          error:
            "fetch is not available in this Node runtime. Please use Node 18+ or install node-fetch.",
        });
    }

    const response = await doFetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return res
        .status(502)
        .json({
          error: "Ollama request failed",
          status: response.status,
          details: errText,
        });
    }

    const data = await response.json();
    return res.json({ response: data.response || "" });
  } catch (e) {
    console.error("Chat error:", e);
    return res
      .status(503)
      .json({
        error: "Chat service unavailable. Is Ollama running on port 11434?",
        details: e.message,
      });
  }
});

// Summarization endpoint using local Ollama
app.post("/summarize", async (req, res) => {
  try {
    const { text, style } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing text to summarize" });
    }

    // Debug: log inputs
    try {
      console.log("[SUMMARIZE] style:", style || "(none)");
      console.log("[SUMMARIZE] text length:", text.length);
    } catch {}

    const promptPrefix =
      style && typeof style === "string" && style.trim().length > 0
        ? `You are a world-class note-taker. Produce a polished, easy-to-skim MARKDOWN summary in the requested style: ${style}. 
Use proper Markdown headers, bold key terms, and bullet lists. Include actionable takeaways.

Format exactly as:

# Summary

## Key Points
- ...

## Action Items
- [ ] ...

## Important Details
- ...

## Glossary (if applicable)
- **Term**: definition

Summarize the following text:
"""
${text}
"""`
        : `You are a world-class note-taker. Produce a polished MARKDOWN study summary that is concise and structured.
Use clear section headers, bullet points, and bold emphasis for critical phrases. Prefer lists over paragraphs.

Format exactly as:

# Summary

## Key Points
- ...

## Action Items
- [ ] ...

## Important Details
- ...

## Glossary (if applicable)
- **Term**: definition

Summarize the following text:
"""
${text}
"""`;

    try {
      console.log("[SUMMARIZE] prompt length:", promptPrefix.length);
    } catch {}

    const payload = {
      model: "llama3",
      prompt: promptPrefix,
      stream: false,
      options: {
        temperature: 0.2,
      },
    };

    const ollamaUrl = "http://localhost:11434/api/generate";

    // Prefer global fetch (Node 18+)
    const doFetch = typeof fetch !== "undefined" ? fetch : null;
    if (!doFetch) {
      return res
        .status(500)
        .json({
          error:
            "fetch is not available in this Node runtime. Please use Node 18+ or install node-fetch.",
        });
    }

    const response = await doFetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return res
        .status(502)
        .json({
          error: "Ollama request failed",
          status: response.status,
          details: errText,
        });
    }

    const data = await response.json();
    try {
      console.log(
        "[SUMMARIZE] model response length:",
        (data.response || "").length
      );
    } catch {}
    return res.json({ summary: data.response || "" });
  } catch (e) {
    console.error("Summarization error:", e);
    // Common case: Ollama not running on 11434
    return res
      .status(503)
      .json({
        error:
          "Summarization service unavailable. Is Ollama running on port 11434?",
        details: e.message,
      });
  }
});

// (moved CORS and express.json above)

// Storage setup
const upload = multer({ dest: "uploads/" });

// Serve transcript files
app.use("/transcripts", express.static(path.join(__dirname, "transcripts")));

// Serve audio files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// List all recordings endpoint
app.get("/recordings", (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "uploads");
    const transcriptsDir = path.join(__dirname, "transcripts");

    if (!fs.existsSync(uploadsDir)) {
      return res.json({ recordings: [] });
    }

    const uploadFiles = fs.readdirSync(uploadsDir);
    const recordings = uploadFiles.map((filename) => {
      const uploadPath = path.join(uploadsDir, filename);
      const transcriptPath = path.join(transcriptsDir, `${filename}.txt`);

      const stats = fs.statSync(uploadPath);
      let transcript = "";
      let hasTranscript = false;

      if (fs.existsSync(transcriptPath)) {
        try {
          transcript = fs.readFileSync(transcriptPath, "utf8");
          hasTranscript = true;
        } catch (err) {
          console.error(`Error reading transcript ${filename}:`, err);
        }
      }

      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        hasTranscript,
        transcript,
      };
    });

    // Sort by creation time (newest first)
    recordings.sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ recordings });
  } catch (error) {
    console.error("Error listing recordings:", error);
    res.status(500).json({ error: "Failed to list recordings" });
  }
});

// Delete recording files endpoint
app.delete("/recording/:filename", (req, res) => {
  const filename = req.params.filename;
  const uploadPath = path.join(__dirname, "uploads", filename);
  const transcriptPath = path.join(__dirname, "transcripts", `${filename}.txt`);

  try {
    // Delete upload file if it exists
    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
      console.log(`Deleted upload file: ${uploadPath}`);
    }

    // Delete transcript file if it exists
    if (fs.existsSync(transcriptPath)) {
      fs.unlinkSync(transcriptPath);
      console.log(`Deleted transcript file: ${transcriptPath}`);
    }

    res.json({ success: true, message: "Files deleted successfully" });
  } catch (error) {
    console.error("Error deleting files:", error);
    res.status(500).json({ error: "Failed to delete files" });
  }
});

app.post("/upload", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  const filePath = path.join(__dirname, req.file.path);
  const outputFile = path.join(
    __dirname,
    `transcripts/${req.file.filename}.txt`
  );

  console.log(`Processing audio file: ${filePath}`);

  // Run Whisper via Python (using virtual environment)
  const pythonPath = path.join(__dirname, "../venv/bin/python");
  exec(
    `"${pythonPath}" whisper.py "${filePath}" "${outputFile}"`,
    (err, stdout, stderr) => {
      if (err) {
        console.error("Transcription error:", err);
        console.error("stderr:", stderr);
        return res
          .status(500)
          .json({ error: "Transcription failed", details: stderr });
      }

      console.log("Transcription completed:", stdout);
      res.json({
        transcriptFile: `transcripts/${req.file.filename}.txt`,
        message: "Transcription completed successfully",
      });
    }
  );
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

// ---------------------- Ingestion Endpoints (PDF/DOCX/TXT/Text) ----------------------
// Separate multer storage for ingestion uploads (memory)
const ingestUpload = multer({ storage: multer.memoryStorage() });

// Helper: parse buffer by mimetype or filename
async function parseFileBufferToText(file) {
  const { buffer, mimetype, originalname } = file;
  const nameLower = (originalname || "").toLowerCase();
  if (mimetype === "application/pdf" || nameLower.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    return data.text || "";
  }
  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    nameLower.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }
  // Fallback: treat as text
  return buffer.toString("utf8");
}

// POST /ingest/file - accepts single file upload of PDF/DOCX/TXT
app.post("/ingest/file", ingestUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const text = await parseFileBufferToText(req.file);
    const id = uuidv4();
    const doc = {
      id,
      name: req.file.originalname,
      type:
        req.file.mimetype ||
        path.extname(req.file.originalname).slice(1) ||
        "text/plain",
      size: req.file.size || (req.file.buffer ? req.file.buffer.length : 0),
      text,
      created: new Date().toISOString(),
    };
    ingestedDocs.set(id, doc);
    return res.json({ id, doc });
  } catch (e) {
    console.error("Ingest file error:", e);
    return res
      .status(500)
      .json({ error: "Failed to ingest file", details: e.message });
  }
});

// POST /ingest/text - accepts raw text to ingest as a document
app.post("/ingest/text", async (req, res) => {
  try {
    const { text, name } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing text" });
    }
    const id = uuidv4();
    const doc = {
      id,
      name: name || "Pasted Text",
      type: "text/plain",
      size: Buffer.byteLength(text, "utf8"),
      text,
      created: new Date().toISOString(),
    };
    ingestedDocs.set(id, doc);
    return res.json({ id, doc });
  } catch (e) {
    console.error("Ingest text error:", e);
    return res
      .status(500)
      .json({ error: "Failed to ingest text", details: e.message });
  }
});

// GET /ingest/list - list all ingested docs
app.get("/ingest/list", (req, res) => {
  const list = Array.from(ingestedDocs.values()).map(
    ({ text, ...meta }) => meta
  );
  res.json({ docs: list });
});

// DELETE /ingest/:id - remove ingested doc
app.delete("/ingest/:id", (req, res) => {
  const { id } = req.params;
  if (!ingestedDocs.has(id))
    return res.status(404).json({ error: "Not found" });
  ingestedDocs.delete(id);
  res.json({ success: true });
});

// WebSocket connection for live transcription
let clientSessions = new Map();

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Initialize session for this client
  clientSessions.set(socket.id, {
    audioChunks: [],
    isTranscribing: false,
    lastProcessTime: 0,
  });
  console.log(`📝 Session initialized for ${socket.id}`);

  socket.on("start-live-transcription", () => {
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

  socket.on("audio-blob", (audioBuffer) => {
    const session = clientSessions.get(socket.id);
    console.log(
      `🎵 AUDIO: Received ${audioBuffer.byteLength} bytes from ${socket.id}`
    );

    if (!session) {
      console.error(`❌ AUDIO ERROR: No session found for ${socket.id}`);
      return;
    }

    if (!session.isTranscribing) {
      console.warn(
        `⚠️ AUDIO WARNING: Session ${socket.id} not transcribing, ignoring audio`
      );
      return;
    }

    // Accumulate chunks
    session.audioChunks.push(Buffer.from(audioBuffer));
    console.log(
      `📊 AUDIO: Session ${socket.id} now has ${session.audioChunks.length} chunks`
    );

    // Process every 4 seconds worth of audio (2 chunks)
    const now = Date.now();
    const timeSinceLastProcess = now - session.lastProcessTime;
    console.log(
      `⏱️ TIMING: ${timeSinceLastProcess}ms since last process, need 3000ms`
    );

    if (session.audioChunks.length >= 2 && timeSinceLastProcess >= 3000) {
      console.log(
        `🚀 PROCESSING: Triggering audio processing for ${socket.id}`
      );
      processAccumulatedAudio(socket, session);
      session.lastProcessTime = now;
    } else {
      console.log(
        `⏳ WAITING: Need ${2 - session.audioChunks.length} more chunks or ${
          3000 - timeSinceLastProcess
        }ms more time`
      );
    }
  });

  socket.on("stop-live-transcription", () => {
    console.log(`🛑 STOP: Live transcription stop requested by ${socket.id}`);
    const session = clientSessions.get(socket.id);
    if (session) {
      console.log(
        `📊 STOP: Session ${socket.id} has ${session.audioChunks.length} remaining chunks`
      );
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

  socket.on("disconnect", () => {
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
    console.log(
      `❌ PROCESS ERROR: No audio chunks to process for ${socket.id}`
    );
    return;
  }

  try {
    // Combine all accumulated chunks
    const combinedBuffer = Buffer.concat(session.audioChunks);
    console.log(
      `📦 COMBINE: Combined ${combinedBuffer.length} bytes from ${session.audioChunks.length} chunks for ${socket.id}`
    );

    const tempId = Date.now() + Math.random().toString(36).substring(2);
    const tempFile = path.join(__dirname, `uploads/live_${tempId}.wav`);

    console.log(`💾 FILE: Writing WAV audio to ${tempFile}`);
    fs.writeFileSync(tempFile, combinedBuffer);
    console.log(`✅ FILE: WAV file written successfully`);

    // Transcribe the WAV file directly (no FFmpeg conversion needed)
    const pythonPath = path.join(__dirname, "../venv/bin/python");
    console.log(`🐍 PYTHON: Starting transcription with ${pythonPath}`);

    const startTime = Date.now();
    exec(
      `"${pythonPath}" -c "from faster_whisper import WhisperModel; model = WhisperModel('tiny', device='cpu', compute_type='int8'); segments, info = model.transcribe('${tempFile}', beam_size=1, best_of=1, temperature=0); print(''.join([segment.text for segment in segments]))"`,
      { timeout: 15000 },
      (err, stdout, stderr) => {
        const processingTime = Date.now() - startTime;
        console.log(`⏱️ TRANSCRIPTION: Completed in ${processingTime}ms`);

        if (err) {
          console.error(`❌ TRANSCRIPTION ERROR: ${err.message}`);
          console.error(`❌ STDERR: ${stderr}`);
          socket.emit("transcription-error", {
            error: "Transcription failed",
            details: err.message,
          });
        } else {
          const text = stdout.trim();
          console.log(`📝 RAW OUTPUT: "${stdout}"`);
          console.log(`📝 TRIMMED: "${text}"`);

          if (text && text.length > 0) {
            console.log(
              `✅ SUCCESS: Sending transcription result to ${socket.id}: "${text}"`
            );
            socket.emit("live-transcription", { text: text });
          } else {
            console.log(`🔇 SILENCE: No speech detected in audio`);
            socket.emit("live-transcription", {
              text: "",
              status: "no_speech",
            });
          }
        }

        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
          console.log(`✅ CLEANUP: File removed successfully`);
        } catch (cleanupErr) {
          console.log(`⚠️ CLEANUP WARNING: ${cleanupErr.message}`);
        }
      }
    );

    // Clear processed chunks but keep the last one for continuity
    const beforeCount = session.audioChunks.length;
    session.audioChunks = session.audioChunks.slice(-1);
    console.log(
      `🔄 CHUNKS: Cleared ${
        beforeCount - session.audioChunks.length
      } chunks, kept ${session.audioChunks.length} for continuity`
    );
  } catch (error) {
    console.error(`❌ PROCESS ERROR: ${error.message}`);
    console.error(`❌ STACK: ${error.stack}`);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Live transcription WebSocket server ready");
  console.log(
    "Make sure you have faster-whisper installed: pip install faster-whisper"
  );
});
