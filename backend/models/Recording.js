const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: null
  },
  filePath: {
    type: String,
    required: true
  },
  hasTranscript: {
    type: Boolean,
    default: false
  },
  transcriptionStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  transcriptionError: {
    type: String,
    default: null
  },
  language: {
    type: String,
    default: null
  },
  languageProbability: {
    type: Number,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for efficient queries
recordingSchema.index({ createdAt: -1 });
recordingSchema.index({ filename: 1 });
recordingSchema.index({ transcriptionStatus: 1 });

module.exports = mongoose.model('Recording', recordingSchema);
