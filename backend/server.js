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

// MongoDB imports
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/database");
const {
  Recording,
  Transcript,
  IngestedDocument,
  ChatSession,
} = require("./models");
const dbUtils = require("./utils/database");

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

// Import routes
const healthRoutes = require("./routes/health");
const markdownRoutes = require("./routes/markdown");

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

// Mount health check routes
app.use("/health", healthRoutes);
app.use("/api", markdownRoutes);

// Chat endpoint using local Ollama

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

    // Build doc context from selected ingested docs (updated for MongoDB)
    let docsContext = "";
    if (Array.isArray(docIds) && docIds.length > 0) {
      const parts = [];
      for (const id of docIds) {
        try {
          const doc = await dbUtils.getIngestedDocumentById(id);
          if (doc && doc.text) {
            parts.push(
              `---\nTitle: ${doc.name} (${doc.type})\n---\n${doc.text}`
            );
          }
        } catch (error) {
          console.error(`Error fetching document ${id}:`, error);
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
      return res.status(500).json({
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
      return res.status(502).json({
        error: "Ollama request failed",
        status: response.status,
        details: errText,
      });
    }

    const data = await response.json();
    return res.json({ response: data.response || "" });
  } catch (e) {
    console.error("Chat error:", e);
    return res.status(503).json({
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
      return res.status(500).json({
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
      return res.status(502).json({
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
    return res.status(503).json({
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

// List all recordings endpoint (updated for MongoDB)
app.get("/recordings", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const recordings = await dbUtils.getRecordingsWithTranscripts(
      limit,
      offset
    );

    // Convert MongoDB format to match frontend expectations
    const formattedRecordings = recordings.map((recording) => ({
      filename: recording.filename,
      size: recording.size,
      created: recording.createdAt,
      modified: recording.updatedAt,
      hasTranscript: recording.hasTranscript,
      transcript: recording.transcript,
      transcriptionStatus: recording.transcriptionStatus,
      language: recording.language,
      summary: recording.summary, // Include summary field
      _id: recording._id,
    }));

    res.json({
      recordings: formattedRecordings,
      pagination: {
        page,
        limit,
        total: await Recording.countDocuments(),
      },
    });
  } catch (error) {
    console.error("Error listing recordings:", error);
    res
      .status(500)
      .json({ error: "Failed to list recordings", details: error.message });
  }
});

// Delete recording files endpoint (updated for MongoDB)
app.delete("/recording/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const result = await dbUtils.deleteRecording(filename);
    res.json(result);
  } catch (error) {
    console.error("Error deleting recording:", error);
    res.status(500).json({
      error: "Failed to delete recording",
      details: error.message,
    });
  }
});

app.post("/upload", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  try {
    // Create recording record in database
    const recording = await dbUtils.createRecording(req.file);

    const filePath = path.join(__dirname, req.file.path);
    const outputFile = path.join(
      __dirname,
      `transcripts/${req.file.filename}.txt`
    );

    console.log(`📝 Processing audio file: ${filePath}`);
    console.log(`📊 Recording saved to database with ID: ${recording._id}`);

    // Update recording status to processing
    await Recording.findByIdAndUpdate(recording._id, {
      transcriptionStatus: "processing",
    });

    // Run Whisper via Python (using virtual environment)
    const pythonPath = path.join(__dirname, "../venv/bin/python");
    const startTime = Date.now();

    exec(
      `"${pythonPath}" whisper.py "${filePath}" "${outputFile}"`,
      async (err, stdout, stderr) => {
        const processingTime = Date.now() - startTime;

        if (err) {
          console.error("📛 Transcription error:", err);
          console.error("📛 stderr:", stderr);

          // Update recording with error status
          await Recording.findByIdAndUpdate(recording._id, {
            transcriptionStatus: "failed",
            transcriptionError: err.message,
          });

          return res
            .status(500)
            .json({ error: "Transcription failed", details: stderr });
        }

        try {
          // Parse transcription output for segments and metadata
          const transcriptContent = fs.readFileSync(outputFile, "utf8");
          const segments = [];
          const lines = transcriptContent
            .split("\n")
            .filter((line) => line.trim());

          // Extract language info from stdout if available
          let language = null;
          let languageProbability = null;

          const langMatch = stdout.match(
            /Detected language: (\w+) \(probability: ([\d.]+)\)/
          );
          if (langMatch) {
            language = langMatch[1];
            languageProbability = parseFloat(langMatch[2]);
          }

          // Parse segments with timestamps
          lines.forEach((line) => {
            const segmentMatch = line.match(
              /\[(\d+\.\d+)s - (\d+\.\d+)s\]: (.+)/
            );
            if (segmentMatch) {
              segments.push({
                start: parseFloat(segmentMatch[1]),
                end: parseFloat(segmentMatch[2]),
                text: segmentMatch[3].trim(),
              });
            }
          });

          // Create transcript record
          await dbUtils.createTranscript(recording._id, {
            filename: `${req.file.filename}.txt`,
            content: transcriptContent,
            segments: segments,
            language: language,
            languageProbability: languageProbability,
            processingTime: processingTime,
          });

          console.log(
            `✅ Transcription completed in ${processingTime}ms:`,
            stdout
          );
          res.json({
            transcriptFile: `transcripts/${req.file.filename}.txt`,
            message: "Transcription completed successfully",
            recordingId: recording._id,
            processingTime: processingTime,
            language: language,
          });
        } catch (transcriptError) {
          console.error("📛 Error saving transcript:", transcriptError);

          await Recording.findByIdAndUpdate(recording._id, {
            transcriptionStatus: "failed",
            transcriptionError: transcriptError.message,
          });

          return res.status(500).json({
            error: "Failed to save transcript",
            details: transcriptError.message,
          });
        }
      }
    );
  } catch (error) {
    console.error("📛 Upload error:", error);
    return res.status(500).json({
      error: "Failed to process upload",
      details: error.message,
    });
  }
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

// Endpoint to transcribe an existing recording by filename
app.post("/transcribe/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;

    // Find the recording in the database
    const recording = await Recording.findOne({ filename: filename });
    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    // Check if already has transcript
    const existingTranscript = await Transcript.findOne({
      recordingId: recording._id,
    });
    if (existingTranscript) {
      return res.status(200).json({
        message: "Transcript already exists",
        transcriptFile: `transcripts/${existingTranscript.filename}`,
        recordingId: recording._id,
      });
    }

    // For external recordings, find the actual file in uploads directory
    const originalFilename = filename.replace(/^external_\d+_/, "");
    const filePath = path.join(__dirname, "uploads", originalFilename);
    const outputFile = path.join(__dirname, `transcripts/${filename}.txt`);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Audio file not found: ${filePath}`);
      return res.status(404).json({ error: "Audio file not found" });
    }

    console.log(`📝 Transcribing existing recording: ${filename}`);

    // Update recording status to processing
    await Recording.findByIdAndUpdate(recording._id, {
      transcriptionStatus: "processing",
    });

    // Run Whisper via Python (using virtual environment)
    const pythonPath = path.join(__dirname, "../venv/bin/python");
    const startTime = Date.now();

    exec(
      `"${pythonPath}" whisper.py "${filePath}" "${outputFile}"`,
      async (err, stdout, stderr) => {
        const processingTime = Date.now() - startTime;

        if (err) {
          console.error("📛 Existing recording transcription error:", err);

          // Update recording with error status
          await Recording.findByIdAndUpdate(recording._id, {
            transcriptionStatus: "failed",
            transcriptionError: err.message,
          });

          return res.status(500).json({
            error: "Transcription failed",
            details: stderr,
          });
        }

        try {
          // Parse transcription output for segments and metadata
          const transcriptContent = fs.readFileSync(outputFile, "utf8");
          const segments = [];
          const lines = transcriptContent
            .split("\n")
            .filter((line) => line.trim());

          // Extract language info from stdout if available
          let language = null;
          let languageProbability = null;

          const langMatch = stdout.match(
            /Detected language: (\w+) \(probability: ([\d.]+)\)/
          );
          if (langMatch) {
            language = langMatch[1];
            languageProbability = parseFloat(langMatch[2]);
          }

          // Parse segments with timestamps
          lines.forEach((line) => {
            const segmentMatch = line.match(
              /\[(\d+\.\d+)s - (\d+\.\d+)s\]: (.+)/
            );
            if (segmentMatch) {
              segments.push({
                start: parseFloat(segmentMatch[1]),
                end: parseFloat(segmentMatch[2]),
                text: segmentMatch[3].trim(),
              });
            }
          });

          // Create transcript record
          await dbUtils.createTranscript(recording._id, {
            filename: `${filename}.txt`,
            content: transcriptContent,
            segments: segments,
            language: language,
            languageProbability: languageProbability,
            processingTime: processingTime,
          });

          console.log(
            `✅ Existing recording transcribed in ${processingTime}ms`
          );

          res.json({
            transcriptFile: `transcripts/${filename}.txt`,
            message: "Transcription completed successfully",
            recordingId: recording._id,
            processingTime: processingTime,
            language: language,
          });
        } catch (transcriptError) {
          console.error(
            "📛 Error saving transcript for existing recording:",
            transcriptError
          );

          await Recording.findByIdAndUpdate(recording._id, {
            transcriptionStatus: "failed",
            transcriptionError: transcriptError.message,
          });

          return res.status(500).json({
            error: "Failed to save transcript",
            details: transcriptError.message,
          });
        }
      }
    );
  } catch (error) {
    console.error("📛 Transcribe existing recording error:", error);
    return res.status(500).json({
      error: "Failed to transcribe existing recording",
      details: error.message,
    });
  }
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

// POST /ingest/file - accepts single file upload of PDF/DOCX/TXT (updated for MongoDB)
app.post("/ingest/file", ingestUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const text = await parseFileBufferToText(req.file);

    const documentData = {
      name: req.file.originalname,
      type:
        req.file.mimetype ||
        path.extname(req.file.originalname).slice(1) ||
        "text/plain",
      size: req.file.size || (req.file.buffer ? req.file.buffer.length : 0),
      text: text,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      source: "upload",
    };

    const savedDoc = await dbUtils.createIngestedDocument(documentData);

    return res.json({
      id: savedDoc._id,
      doc: {
        id: savedDoc._id,
        name: savedDoc.name,
        type: savedDoc.type,
        size: savedDoc.size,
        wordCount: savedDoc.wordCount,
        created: savedDoc.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("Ingest file error:", e);
    return res
      .status(500)
      .json({ error: "Failed to ingest file", details: e.message });
  }
});

// POST /ingest/text - accepts raw text to ingest as a document (updated for MongoDB)
app.post("/ingest/text", async (req, res) => {
  try {
    const { text, name } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing text" });
    }

    const documentData = {
      name: name || "Pasted Text",
      type: "text/plain",
      size: Buffer.byteLength(text, "utf8"),
      text: text,
      source: "paste",
    };

    const savedDoc = await dbUtils.createIngestedDocument(documentData);

    return res.json({
      id: savedDoc._id,
      doc: {
        id: savedDoc._id,
        name: savedDoc.name,
        type: savedDoc.type,
        size: savedDoc.size,
        wordCount: savedDoc.wordCount,
        created: savedDoc.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("Ingest text error:", e);
    return res
      .status(500)
      .json({ error: "Failed to ingest text", details: e.message });
  }
});

// GET /ingest/list - list all ingested docs (updated for MongoDB)
app.get("/ingest/list", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const documents = await dbUtils.getIngestedDocuments({}, limit, offset);

    // Format documents for frontend
    const formattedDocs = documents.map((doc) => ({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      wordCount: doc.wordCount,
      created: doc.createdAt.toISOString(),
      source: doc.source,
    }));

    res.json({
      docs: formattedDocs,
      pagination: {
        page,
        limit,
        total: await IngestedDocument.countDocuments({ isActive: true }),
      },
    });
  } catch (error) {
    console.error("Error listing ingested documents:", error);
    res.status(500).json({
      error: "Failed to list documents",
      details: error.message,
    });
  }
});

// DELETE /ingest/:id - remove ingested doc (updated for MongoDB)
app.delete("/ingest/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await IngestedDocument.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ success: true, message: "Document marked as inactive" });
  } catch (error) {
    console.error("Error deleting ingested document:", error);
    res.status(500).json({
      error: "Failed to delete document",
      details: error.message,
    });
  }
});

// ---------------------- Bulk Operations Endpoints ----------------------

// DELETE /recordings/bulk-clear-transcripts - Clear all transcripts from recordings
app.delete("/recordings/bulk-clear-transcripts", async (req, res) => {
  try {
    console.log("🧹 Bulk clearing all transcripts...");

    // Find all recordings that have transcripts
    const recordingsWithTranscripts = await Recording.find({
      hasTranscript: true,
    });

    const results = {
      cleared: [],
      failed: [],
      total: recordingsWithTranscripts.length,
    };

    // Clear transcripts from database
    for (const recording of recordingsWithTranscripts) {
      try {
        // Update transcript to remove content but keep summary if it exists
        await Transcript.findOneAndUpdate(
          { recordingId: recording._id },
          {
            $unset: { content: 1, language: 1 },
            $set: { transcriptionStatus: "pending" },
          }
        );

        // Update recording to reflect no transcript
        await Recording.findByIdAndUpdate(recording._id, {
          hasTranscript: false,
          transcriptionStatus: "pending",
          $unset: { transcript: 1, language: 1 },
        });

        // Delete physical transcript file
        const transcriptFilePath = path.join(
          __dirname,
          "transcripts",
          `${recording.filename}.txt`
        );
        try {
          if (fs.existsSync(transcriptFilePath)) {
            fs.unlinkSync(transcriptFilePath);
          }
        } catch (fileError) {
          console.warn(
            `⚠️ Could not delete transcript file for ${recording.filename}: ${fileError.message}`
          );
        }

        results.cleared.push({
          id: recording._id,
          filename: recording.filename,
        });
      } catch (error) {
        console.error(
          `❌ Error clearing transcript for ${recording.filename}:`,
          error
        );
        results.failed.push({
          id: recording._id,
          filename: recording.filename,
          error: error.message,
        });
      }
    }

    console.log(
      `🧹 Bulk clear transcripts completed: ${results.cleared.length} cleared, ${results.failed.length} failed`
    );

    res.json({
      success: true,
      message: `Bulk clear transcripts completed: ${results.cleared.length} cleared, ${results.failed.length} failed`,
      results,
    });
  } catch (error) {
    console.error("Bulk clear transcripts error:", error);
    res.status(500).json({
      error: "Failed to bulk clear transcripts",
      details: error.message,
    });
  }
});

// DELETE /recordings/bulk-clear-summaries - Clear all summaries from recordings
app.delete("/recordings/bulk-clear-summaries", async (req, res) => {
  try {
    console.log("🧽 Bulk clearing all summaries...");

    // Find all transcripts that have summaries
    const transcriptsWithSummaries = await Transcript.find({
      summary: { $exists: true, $ne: null, $ne: "" },
    });

    const results = {
      cleared: [],
      failed: [],
      total: transcriptsWithSummaries.length,
    };

    // Clear summaries from database
    for (const transcript of transcriptsWithSummaries) {
      try {
        // Remove summary field
        await Transcript.findByIdAndUpdate(transcript._id, {
          $unset: { summary: 1 },
        });

        // Get associated recording info for logging
        const recording = await Recording.findById(transcript.recordingId);

        results.cleared.push({
          transcriptId: transcript._id,
          recordingId: transcript.recordingId,
          filename: recording ? recording.filename : "unknown",
        });
      } catch (error) {
        console.error(
          `❌ Error clearing summary for transcript ${transcript._id}:`,
          error
        );
        results.failed.push({
          transcriptId: transcript._id,
          recordingId: transcript.recordingId,
          error: error.message,
        });
      }
    }

    console.log(
      `🧽 Bulk clear summaries completed: ${results.cleared.length} cleared, ${results.failed.length} failed`
    );

    res.json({
      success: true,
      message: `Bulk clear summaries completed: ${results.cleared.length} cleared, ${results.failed.length} failed`,
      results,
    });
  } catch (error) {
    console.error("Bulk clear summaries error:", error);
    res.status(500).json({
      error: "Failed to bulk clear summaries",
      details: error.message,
    });
  }
});

// POST /recordings/bulk-delete - Delete multiple recordings at once
app.post("/recordings/bulk-delete", async (req, res) => {
  try {
    const { identifiers } = req.body;

    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      return res.status(400).json({
        error: "Identifiers array is required",
        received: identifiers,
      });
    }

    const results = {
      deleted: [],
      failed: [],
      total: identifiers.length,
    };

    for (const identifier of identifiers) {
      try {
        // Find the recording by filename or MongoDB ID
        let recording;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
          recording = await Recording.findById(identifier);
        } else {
          recording = await Recording.findOne({ filename: identifier });
        }

        if (!recording) {
          results.failed.push({ identifier, error: "Recording not found" });
          continue;
        }

        const filename = recording.filename;
        const recordingId = recording._id;

        // Delete associated transcript
        await Transcript.deleteOne({ recordingId: recordingId });

        // Delete the recording from database
        await Recording.deleteOne({ _id: recordingId });

        // Delete physical files (non-blocking, errors are logged but don't fail the operation)
        const audioFilePath = path.join(
          __dirname,
          "uploads",
          filename.replace(/^external_\d+_/, "")
        );
        const transcriptFilePath = path.join(
          __dirname,
          "transcripts",
          `${filename}.txt`
        );

        try {
          if (fs.existsSync(audioFilePath)) {
            fs.unlinkSync(audioFilePath);
          }
        } catch (fileError) {
          console.warn(
            `⚠️ Could not delete audio file for ${filename}: ${fileError.message}`
          );
        }

        try {
          if (fs.existsSync(transcriptFilePath)) {
            fs.unlinkSync(transcriptFilePath);
          }
        } catch (fileError) {
          console.warn(
            `⚠️ Could not delete transcript file for ${filename}: ${fileError.message}`
          );
        }

        results.deleted.push({
          identifier,
          filename,
          id: recordingId.toString(),
        });
      } catch (error) {
        console.error(`❌ Error deleting recording ${identifier}:`, error);
        results.failed.push({
          identifier,
          error: error.message,
        });
      }
    }

    console.log(
      `🗑️ Bulk delete completed: ${results.deleted.length} deleted, ${results.failed.length} failed`
    );

    res.json({
      success: true,
      message: `Bulk delete completed: ${results.deleted.length} deleted, ${results.failed.length} failed`,
      results,
    });
  } catch (error) {
    console.error("Bulk delete recordings error:", error);
    res.status(500).json({
      error: "Failed to bulk delete recordings",
      details: error.message,
    });
  }
});

// PUT /recordings/bulk-update - Update multiple recordings at once
app.put("/recordings/bulk-update", async (req, res) => {
  try {
    const { operations } = req.body;

    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        error: "Operations array is required",
      });
    }

    const results = {
      updated: [],
      failed: [],
      total: operations.length,
    };

    for (const operation of operations) {
      try {
        const { identifier, updates } = operation;

        if (!identifier || !updates) {
          results.failed.push({
            identifier: identifier || "unknown",
            error: "Identifier and updates are required",
          });
          continue;
        }

        // Find the recording
        let recording;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
          recording = await Recording.findByIdAndUpdate(identifier, updates, {
            new: true,
            runValidators: true,
          });
        } else {
          recording = await Recording.findOneAndUpdate(
            { filename: identifier },
            updates,
            { new: true, runValidators: true }
          );
        }

        if (!recording) {
          results.failed.push({ identifier, error: "Recording not found" });
          continue;
        }

        results.updated.push({
          identifier,
          recording: {
            id: recording._id,
            filename: recording.filename,
            status: recording.transcriptionStatus,
          },
        });
      } catch (error) {
        console.error(
          `❌ Error updating recording ${operation.identifier}:`,
          error
        );
        results.failed.push({
          identifier: operation.identifier || "unknown",
          error: error.message,
        });
      }
    }

    console.log(
      `📝 Bulk update completed: ${results.updated.length} updated, ${results.failed.length} failed`
    );

    res.json({
      success: true,
      message: `Bulk update completed: ${results.updated.length} updated, ${results.failed.length} failed`,
      results,
    });
  } catch (error) {
    console.error("Bulk update recordings error:", error);
    res.status(500).json({
      error: "Failed to bulk update recordings",
      details: error.message,
    });
  }
});

// ---------------------- New MongoDB-specific Endpoints ----------------------

// GET /search - Search through transcripts and documents
app.get("/search", async (req, res) => {
  try {
    const {
      q: query,
      types = "documents,transcripts",
      page = 1,
      limit = 10,
    } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchTypes = types.split(",").map((t) => t.trim());
    const results = await dbUtils.searchContent(query, searchTypes);

    res.json({
      query,
      results,
      pagination: { page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Search failed",
      details: error.message,
    });
  }
});

// GET /analytics/dashboard - Get dashboard analytics
app.get("/analytics/dashboard", async (req, res) => {
  try {
    const [
      recordingsCount,
      transcriptsCount,
      documentsCount,
      recentRecordings,
    ] = await Promise.all([
      Recording.countDocuments(),
      Transcript.countDocuments(),
      IngestedDocument.countDocuments({ isActive: true }),
      Recording.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // Get processing stats
    const processingStats = await Recording.aggregate([
      {
        $group: {
          _id: "$transcriptionStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get language distribution
    const languageStats = await Recording.aggregate([
      {
        $match: { language: { $ne: null } },
      },
      {
        $group: {
          _id: "$language",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json({
      totals: {
        recordings: recordingsCount,
        transcripts: transcriptsCount,
        documents: documentsCount,
      },
      processingStats,
      languageStats,
      recentRecordings: recentRecordings.map((r) => ({
        filename: r.filename,
        size: r.size,
        created: r.createdAt,
        status: r.transcriptionStatus,
      })),
    });
  } catch (error) {
    console.error("Analytics dashboard error:", error);
    res.status(500).json({
      error: "Failed to load analytics",
      details: error.message,
    });
  }
});

// POST /recordings/external - Save external recordings (from other screens/apps)
app.post("/recordings/external", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  try {
    console.log(`📱 External recording received: ${req.file.originalname}`);

    // Create recording record in database
    const recording = await dbUtils.createRecording({
      ...req.file,
      // Override filename to include external prefix
      filename: `external_${Date.now()}_${req.file.filename}`,
      originalname: req.file.originalname || `External_Recording_${Date.now()}`,
    });

    const filePath = path.join(__dirname, req.file.path);
    const outputFile = path.join(
      __dirname,
      `transcripts/${recording.filename}.txt`
    );

    console.log(
      `📊 External recording saved to database with ID: ${recording._id}`
    );

    // Check if auto-transcribe is requested
    const autoTranscribe =
      req.body.autoTranscribe === "true" || req.query.autoTranscribe === "true";

    if (autoTranscribe) {
      console.log(`🤖 Auto-transcribing external recording...`);

      // Update recording status to processing
      await Recording.findByIdAndUpdate(recording._id, {
        transcriptionStatus: "processing",
      });

      // Run Whisper via Python (using virtual environment)
      const pythonPath = path.join(__dirname, "../venv/bin/python");
      const startTime = Date.now();

      exec(
        `"${pythonPath}" whisper.py "${filePath}" "${outputFile}"`,
        async (err, stdout, stderr) => {
          const processingTime = Date.now() - startTime;

          if (err) {
            console.error("📛 External transcription error:", err);
            await Recording.findByIdAndUpdate(recording._id, {
              transcriptionStatus: "failed",
              transcriptionError: err.message,
            });
          } else {
            try {
              // Parse transcription output
              const transcriptContent = fs.readFileSync(outputFile, "utf8");
              const segments = [];
              const lines = transcriptContent
                .split("\n")
                .filter((line) => line.trim());

              // Extract language info
              let language = null;
              let languageProbability = null;

              const langMatch = stdout.match(
                /Detected language: (\w+) \(probability: ([\d.]+)\)/
              );
              if (langMatch) {
                language = langMatch[1];
                languageProbability = parseFloat(langMatch[2]);
              }

              // Parse segments
              lines.forEach((line) => {
                const segmentMatch = line.match(
                  /\[(\d+\.\d+)s - (\d+\.\d+)s\]: (.+)/
                );
                if (segmentMatch) {
                  segments.push({
                    start: parseFloat(segmentMatch[1]),
                    end: parseFloat(segmentMatch[2]),
                    text: segmentMatch[3].trim(),
                  });
                }
              });

              // Create transcript record
              await dbUtils.createTranscript(recording._id, {
                filename: `${recording.filename}.txt`,
                content: transcriptContent,
                segments: segments,
                language: language,
                languageProbability: languageProbability,
                processingTime: processingTime,
              });

              console.log(
                `✅ External recording transcribed in ${processingTime}ms`
              );
            } catch (transcriptError) {
              console.error(
                "📛 Error saving external transcript:",
                transcriptError
              );
              await Recording.findByIdAndUpdate(recording._id, {
                transcriptionStatus: "failed",
                transcriptionError: transcriptError.message,
              });
            }
          }
        }
      );
    }

    res.json({
      success: true,
      message: autoTranscribe
        ? "External recording saved and queued for transcription"
        : "External recording saved successfully",
      recordingId: recording._id,
      filename: recording.filename,
      autoTranscribe: autoTranscribe,
    });
  } catch (error) {
    console.error("📛 External recording save error:", error);
    return res.status(500).json({
      error: "Failed to save external recording",
      details: error.message,
    });
  }
});

// GET /recordings/:id - Get detailed recording info
app.get("/recordings/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findById(id).lean();
    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    // Get associated transcript
    const transcript = await Transcript.findOne({ recordingId: id }).lean();

    res.json({
      recording,
      transcript,
    });
  } catch (error) {
    console.error("Get recording error:", error);
    res.status(500).json({
      error: "Failed to get recording",
      details: error.message,
    });
  }
});

// PUT /transcripts/:id/tags - Update transcript tags
app.put("/transcripts/:id/tags", async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: "Tags must be an array" });
    }

    const transcript = await Transcript.findByIdAndUpdate(
      id,
      { tags: tags.filter((tag) => typeof tag === "string" && tag.trim()) },
      { new: true }
    );

    if (!transcript) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    res.json({ success: true, transcript });
  } catch (error) {
    console.error("Update tags error:", error);
    res.status(500).json({
      error: "Failed to update tags",
      details: error.message,
    });
  }
});

// PUT /transcripts/:id/summary - Update transcript summary
app.put("/transcripts/:id/summary", async (req, res) => {
  try {
    const { id } = req.params;
    const { summary } = req.body;

    if (!summary || typeof summary !== "string") {
      return res.status(400).json({ error: "Summary must be a string" });
    }

    const transcript = await Transcript.findByIdAndUpdate(
      id,
      { summary: summary.trim() },
      { new: true }
    );

    if (!transcript) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    res.json({ success: true, transcript });
  } catch (error) {
    console.error("Update summary error:", error);
    res.status(500).json({
      error: "Failed to update summary",
      details: error.message,
    });
  }
});

// POST /recordings/:id/summary - Save summary for a recording (creates or updates transcript summary)
app.post("/recordings/:id/summary", async (req, res) => {
  try {
    const { id } = req.params;
    const { summary } = req.body;

    if (!summary || typeof summary !== "string") {
      return res.status(400).json({ error: "Summary must be a string" });
    }

    // Find recording by filename or MongoDB ID
    let recording;
    if (mongoose.Types.ObjectId.isValid(id)) {
      recording = await Recording.findById(id);
    } else {
      recording = await Recording.findOne({ filename: id });
    }

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    // Find or create transcript for this recording
    let transcript = await Transcript.findOne({ recordingId: recording._id });

    if (transcript) {
      // Update existing transcript
      transcript.summary = summary.trim();
      await transcript.save();
    } else {
      // Create new transcript with just summary (no content yet)
      transcript = new Transcript({
        recordingId: recording._id,
        filename: `${recording.filename}_summary.txt`,
        content: "", // Empty content, just storing summary
        summary: summary.trim(),
      });
      await transcript.save();
    }

    console.log(`📝 Summary saved for recording: ${recording.filename}`);

    res.json({
      success: true,
      message: "Summary saved successfully",
      transcript: {
        id: transcript._id,
        summary: transcript.summary,
        recordingId: recording._id,
      },
    });
  } catch (error) {
    console.error("Save summary error:", error);
    res.status(500).json({
      error: "Failed to save summary",
      details: error.message,
    });
  }
});

// DELETE /recordings/:id/transcript - Delete transcript content for a recording
app.delete("/recordings/:id/transcript", async (req, res) => {
  try {
    const { id } = req.params;

    // Find recording by filename or MongoDB ID
    let recording;
    if (mongoose.Types.ObjectId.isValid(id)) {
      recording = await Recording.findById(id);
    } else {
      recording = await Recording.findOne({ filename: id });
    }

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    // Find and update transcript to remove content but keep summary if it exists
    const transcript = await Transcript.findOneAndUpdate(
      { recordingId: recording._id },
      {
        $unset: { content: 1, language: 1 }, // Remove transcript content and language
        $set: {
          transcriptionStatus: "pending",
        },
      },
      { new: true }
    );

    // Also update the recording to reflect no transcript
    await Recording.findByIdAndUpdate(recording._id, {
      hasTranscript: false,
      transcriptionStatus: "pending",
      language: null,
      $unset: { transcript: 1 },
    });

    // Delete physical transcript file if it exists
    const transcriptFilePath = path.join(
      __dirname,
      "transcripts",
      `${recording.filename}.txt`
    );
    try {
      if (fs.existsSync(transcriptFilePath)) {
        fs.unlinkSync(transcriptFilePath);
        console.log(`🗑️ Deleted transcript file: ${transcriptFilePath}`);
      }
    } catch (fileError) {
      console.warn(`⚠️ Could not delete transcript file: ${fileError.message}`);
    }

    console.log(`🗑️ Transcript deleted for recording: ${recording.filename}`);

    res.json({
      success: true,
      message: "Transcript deleted successfully",
    });
  } catch (error) {
    console.error("Delete transcript error:", error);
    res.status(500).json({
      error: "Failed to delete transcript",
      details: error.message,
    });
  }
});

// DELETE /recordings/:id/summary - Delete summary for a recording
app.delete("/recordings/:id/summary", async (req, res) => {
  try {
    const { id } = req.params;

    // Find recording by filename or MongoDB ID
    let recording;
    if (mongoose.Types.ObjectId.isValid(id)) {
      recording = await Recording.findById(id);
    } else {
      recording = await Recording.findOne({ filename: id });
    }

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    // Find and update transcript
    const transcript = await Transcript.findOneAndUpdate(
      { recordingId: recording._id },
      { $unset: { summary: 1 } }, // Remove summary field
      { new: true }
    );

    if (!transcript) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    console.log(`🗑️ Summary deleted for recording: ${recording.filename}`);

    res.json({
      success: true,
      message: "Summary deleted successfully",
    });
  } catch (error) {
    console.error("Delete summary error:", error);
    res.status(500).json({
      error: "Failed to delete summary",
      details: error.message,
    });
  }
});

// DELETE /recordings/:identifier - Delete entire recording and associated data
// Accepts either filename or MongoDB ID as identifier
app.delete("/recordings/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    console.log(`🗑️ DELETE request for identifier: ${identifier}`);

    // Find the recording by filename or MongoDB ID
    let recording;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      console.log(`📋 Searching by MongoDB ID: ${identifier}`);
      recording = await Recording.findById(identifier);
    } else {
      console.log(`📋 Searching by filename: ${identifier}`);
      recording = await Recording.findOne({ filename: identifier });
    }

    if (!recording) {
      console.log(`❌ Recording not found for identifier: ${identifier}`);
      return res.status(404).json({
        error: "Recording not found",
        identifier: identifier,
      });
    }

    console.log(
      `✅ Found recording: ${recording.filename} (ID: ${recording._id})`
    );
    const filename = recording.filename;
    const recordingId = recording._id;

    // Start transaction-like cleanup
    try {
      // Delete associated transcript first
      const transcriptResult = await Transcript.deleteOne({
        recordingId: recordingId,
      });
      console.log(`🗑️ Deleted ${transcriptResult.deletedCount} transcript(s)`);

      // Delete the recording from database
      const recordingResult = await Recording.deleteOne({ _id: recordingId });
      console.log(`🗑️ Deleted ${recordingResult.deletedCount} recording(s)`);

      // Delete physical files (non-blocking)
      const audioFilePath = path.join(
        __dirname,
        "uploads",
        filename.replace(/^external_\d+_/, "")
      );
      const transcriptFilePath = path.join(
        __dirname,
        "transcripts",
        `${filename}.txt`
      );

      // Remove audio file if it exists
      try {
        if (fs.existsSync(audioFilePath)) {
          fs.unlinkSync(audioFilePath);
          console.log(`🗑️ Deleted audio file: ${audioFilePath}`);
        }
      } catch (fileError) {
        console.warn(`⚠️ Could not delete audio file: ${fileError.message}`);
      }

      // Remove transcript file if it exists
      try {
        if (fs.existsSync(transcriptFilePath)) {
          fs.unlinkSync(transcriptFilePath);
          console.log(`🗑️ Deleted transcript file: ${transcriptFilePath}`);
        }
      } catch (fileError) {
        console.warn(
          `⚠️ Could not delete transcript file: ${fileError.message}`
        );
      }

      console.log(`✅ Recording deleted successfully: ${filename}`);

      res.json({
        success: true,
        message: "Recording deleted successfully",
        deletedRecording: {
          id: recordingId,
          filename: filename,
        },
      });
    } catch (dbError) {
      console.error(`❌ Database deletion error: ${dbError.message}`);
      throw dbError;
    }
  } catch (error) {
    console.error("Delete recording error:", error);
    res.status(500).json({
      error: "Failed to delete recording",
      details: error.message,
      identifier: req.params.identifier,
    });
  }
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

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("📡 Live transcription WebSocket server ready");
  console.log(
    "🐍 Make sure you have faster-whisper installed: pip install faster-whisper"
  );
  console.log(
    "🤖 Make sure Ollama is running on port 11434 for chat functionality"
  );
});
