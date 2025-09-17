const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  context: {
    transcriptIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transcript'
    }],
    documentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IngestedDocument'
    }]
  }
});

const chatSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'New Chat Session'
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  summary: {
    type: String,
    default: null
  },
  tags: [{
    type: String
  }],
  metadata: {
    model: {
      type: String,
      default: 'llama3'
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatSessionSchema.index({ createdAt: -1 });
chatSessionSchema.index({ lastActivity: -1 });
chatSessionSchema.index({ isActive: 1 });
chatSessionSchema.index({ tags: 1 });

// Pre-save middleware to update lastActivity
chatSessionSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

// Virtual for getting message count
chatSessionSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
