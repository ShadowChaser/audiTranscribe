const mongoose = require('mongoose');

const transcriptSegmentSchema = new mongoose.Schema({
  start: {
    type: Number,
    required: true
  },
  end: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true
  }
});

const transcriptSchema = new mongoose.Schema({
  recordingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recording',
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  segments: [transcriptSegmentSchema],
  language: {
    type: String,
    default: null
  },
  languageProbability: {
    type: Number,
    default: null
  },
  processingTime: {
    type: Number, // in milliseconds
    default: null
  },
  wordCount: {
    type: Number,
    default: 0
  },
  summary: {
    type: String,
    default: null
  },
  tags: [{
    type: String
  }],
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Text search index for searching through transcript content
transcriptSchema.index({ content: 'text' });
transcriptSchema.index({ recordingId: 1 });
transcriptSchema.index({ createdAt: -1 });
transcriptSchema.index({ tags: 1 });

// Virtual for getting formatted duration
transcriptSchema.virtual('duration').get(function() {
  if (this.segments && this.segments.length > 0) {
    const lastSegment = this.segments[this.segments.length - 1];
    return lastSegment.end;
  }
  return 0;
});

module.exports = mongoose.model('Transcript', transcriptSchema);
