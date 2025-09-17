# 📊 MongoDB Integration Guide

This guide documents the MongoDB integration added to the ScribeFlow transcription app, providing persistent data storage and advanced features.

## 🎯 Overview

The app now uses MongoDB to store:
- **Audio recordings** metadata and status
- **Transcripts** with segments and metadata
- **Ingested documents** (PDFs, DOCX, text)
- **Chat sessions** and message history

## 🏗️ Architecture

### Database Models

#### 1. Recording
Stores audio file metadata and transcription status.

```javascript
{
  filename: String,          // Unique filename
  originalName: String,      // Original uploaded filename
  mimeType: String,          // File MIME type
  size: Number,              // File size in bytes
  duration: Number,          // Audio duration in seconds
  filePath: String,          // Path to audio file
  hasTranscript: Boolean,    // Whether transcript exists
  transcriptionStatus: String, // 'pending'|'processing'|'completed'|'failed'
  transcriptionError: String, // Error message if failed
  language: String,          // Detected language
  languageProbability: Number // Language detection confidence
}
```

#### 2. Transcript
Stores transcription content with segments and metadata.

```javascript
{
  recordingId: ObjectId,     // Reference to Recording
  filename: String,          // Transcript filename
  content: String,           // Full transcript text
  segments: [{               // Timestamped segments
    start: Number,           // Start time in seconds
    end: Number,             // End time in seconds
    text: String             // Segment text
  }],
  language: String,          // Detected language
  languageProbability: Number,
  processingTime: Number,    // Processing time in ms
  wordCount: Number,         // Total word count
  summary: String,           // AI-generated summary
  tags: [String],            // User tags
  notes: String              // User notes
}
```

#### 3. IngestedDocument
Stores uploaded/pasted documents for chat context.

```javascript
{
  name: String,              // Document name
  type: String,              // Document type/MIME type
  size: Number,              // Document size in bytes
  text: String,              // Extracted text content
  originalFilename: String,  // Original filename if uploaded
  mimeType: String,          // MIME type
  wordCount: Number,         // Auto-calculated word count
  characterCount: Number,    // Auto-calculated character count
  source: String,            // 'upload'|'paste'|'transcript'
  tags: [String],            // User tags
  isActive: Boolean,         // Soft delete flag
  metadata: Mixed            // Additional metadata
}
```

#### 4. ChatSession
Stores chat conversations and context (prepared for future use).

```javascript
{
  title: String,             // Session title
  messages: [{               // Conversation messages
    role: String,            // 'user'|'assistant'
    content: String,         // Message content
    timestamp: Date,         // Message timestamp
    context: {               // Message context
      transcriptIds: [ObjectId],
      documentIds: [ObjectId]
    }
  }],
  isActive: Boolean,         // Session status
  lastActivity: Date,        // Last message timestamp
  summary: String,           // Session summary
  tags: [String],            // Session tags
  metadata: {                // Session metadata
    model: String,           // AI model used
    totalTokens: Number,     // Token usage
    averageResponseTime: Number
  }
}
```

## 🚀 Setup Instructions

### 1. Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### 2. Environment Configuration

The backend includes a `.env` file with MongoDB configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/transcribeapp
MONGODB_DB_NAME=transcribeapp

# Other configurations...
```

### 3. Dependencies

The required packages are already added to `package.json`:
- `mongoose`: MongoDB object modeling
- `dotenv`: Environment variable management

## 📡 API Endpoints

### Core Endpoints (Updated)

#### Recordings
- `GET /recordings` - List recordings with pagination
- `GET /recordings/:id` - Get detailed recording info
- `DELETE /recording/:filename` - Delete recording and transcript
- `POST /upload` - Upload audio (now saves to database)

#### Transcripts
- `GET /transcript/:filename` - Get transcript content
- `PUT /transcripts/:id/tags` - Update transcript tags
- `PUT /transcripts/:id/summary` - Update transcript summary

#### Document Ingestion
- `POST /ingest/file` - Upload document (now saves to database)
- `POST /ingest/text` - Ingest pasted text (now saves to database)
- `GET /ingest/list` - List ingested documents with pagination
- `DELETE /ingest/:id` - Soft-delete document

### New MongoDB-Specific Endpoints

#### Search
```http
GET /search?q=search_term&types=documents,transcripts&page=1&limit=10
```
Full-text search across documents and transcripts.

#### Analytics Dashboard
```http
GET /analytics/dashboard
```
Returns:
- Total counts (recordings, transcripts, documents)
- Processing statistics
- Language distribution
- Recent recordings

## 🔍 Key Features

### 1. Persistent Data Storage
- All data survives server restarts
- Structured data with relationships
- Efficient querying and indexing

### 2. Full-Text Search
- Search across transcript content
- Search through ingested documents
- Relevance scoring with MongoDB text search

### 3. Analytics and Insights
- Processing statistics
- Language detection analytics
- Usage patterns and trends

### 4. Enhanced Metadata
- Detailed file information
- Processing timestamps and duration
- Language detection with confidence scores
- Word/character counts

### 5. Tagging and Organization
- Add tags to transcripts
- Categorize documents
- Soft delete for data retention

### 6. Status Tracking
- Real-time transcription status
- Error tracking and reporting
- Processing time metrics

## 🛠️ Database Operations

### Connection Management
The app uses Mongoose for MongoDB connections with:
- Automatic reconnection
- Connection pooling
- Graceful shutdown handling

### Data Migration
When upgrading from the file-based version:

1. **Existing transcripts** remain as files initially
2. **New uploads** are stored in MongoDB
3. **Frontend** works with both storage methods
4. **Migration script** can be created to move old data

### Indexing
Optimized indexes for:
- Text search (`content` field)
- Timestamp queries (`createdAt`)
- Status filtering (`transcriptionStatus`)
- File lookups (`filename`)

## 🔧 Development Notes

### Database Utilities
The `utils/database.js` file provides helper functions:
- `createRecording(fileData)` - Create recording record
- `createTranscript(recordingId, data)` - Create transcript record
- `getRecordingsWithTranscripts(limit, offset)` - Fetch recordings with transcripts
- `searchContent(query, types)` - Full-text search
- And more...

### Error Handling
Enhanced error handling for:
- Database connection failures
- Validation errors
- Duplicate entry prevention
- Transaction rollbacks

### Performance Considerations
- Pagination for large datasets
- Selective field queries
- Efficient aggregation pipelines
- Text search optimization

## 🚦 Testing

### Verify MongoDB Integration

1. **Start MongoDB service**
2. **Start the backend server**
3. **Check console for connection messages**
4. **Upload an audio file** - should see database logs
5. **Check /analytics/dashboard** - should return data

### Database Inspection

Use MongoDB Compass or CLI to inspect data:

```bash
# Connect to MongoDB
mongosh

# Switch to transcribeapp database
use transcribeapp

# View collections
show collections

# Query recordings
db.recordings.find().pretty()

# Query transcripts
db.transcripts.find().pretty()
```

## 🔄 Migration Path

For existing installations:

1. **Install MongoDB** and dependencies
2. **Update environment** configuration
3. **Restart backend** - new uploads use database
4. **Optional:** Run migration script for existing files

## 🛡️ Production Considerations

- **Database Backups:** Regular MongoDB backups
- **Index Optimization:** Monitor query performance
- **Connection Limits:** Configure connection pooling
- **Security:** Enable authentication for production
- **Monitoring:** Set up MongoDB monitoring

## 📈 Future Enhancements

The MongoDB integration enables:
- **User authentication** and multi-user support
- **Advanced search** with filters and facets  
- **Data analytics** and usage insights
- **API rate limiting** based on usage
- **Collaboration features** with shared transcripts
- **Webhook integrations** for external systems

This foundation provides a scalable, production-ready backend for the transcription application.
