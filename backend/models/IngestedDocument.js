const mongoose = require('mongoose');

const ingestedDocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['pdf', 'docx', 'txt', 'text/plain', 'application/pdf', 
           'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  size: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    default: null
  },
  mimeType: {
    type: String,
    default: null
  },
  wordCount: {
    type: Number,
    default: 0
  },
  characterCount: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['upload', 'paste', 'transcript'],
    default: 'upload'
  },
  tags: [{
    type: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Text search index for searching through document content
ingestedDocumentSchema.index({ text: 'text', name: 'text' });
ingestedDocumentSchema.index({ createdAt: -1 });
ingestedDocumentSchema.index({ type: 1 });
ingestedDocumentSchema.index({ source: 1 });
ingestedDocumentSchema.index({ tags: 1 });
ingestedDocumentSchema.index({ isActive: 1 });

// Pre-save middleware to calculate word and character counts
ingestedDocumentSchema.pre('save', function(next) {
  if (this.isModified('text')) {
    this.characterCount = this.text.length;
    this.wordCount = this.text.split(/\s+/).filter(word => word.length > 0).length;
  }
  next();
});

module.exports = mongoose.model('IngestedDocument', ingestedDocumentSchema);
