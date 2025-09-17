const { Recording, Transcript, IngestedDocument, ChatSession } = require('../models');
const fs = require('fs');
const path = require('path');

/**
 * Create a new recording record in the database with validation
 */
async function createRecording(fileData) {
  try {
    // Validate required fields
    if (!fileData || !fileData.filename) {
      throw new Error('Missing required file data: filename');
    }
    
    if (!fileData.originalname) {
      console.warn(`No originalname provided for ${fileData.filename}, using filename as fallback`);
    }
    
    // Check for duplicate filenames
    const existingRecording = await Recording.findOne({ filename: fileData.filename });
    if (existingRecording) {
      console.warn(`Recording with filename ${fileData.filename} already exists, ID: ${existingRecording._id}`);
      return existingRecording; // Return existing instead of creating duplicate
    }
    
    const recording = new Recording({
      filename: fileData.filename,
      originalName: fileData.originalname || fileData.filename,
      mimeType: fileData.mimetype || 'audio/webm',
      size: fileData.size || 0,
      filePath: fileData.path || `uploads/${fileData.filename}`,
      transcriptionStatus: 'pending'
    });
    
    const savedRecording = await recording.save();
    console.log(`📊 Recording created successfully: ${savedRecording.filename} (ID: ${savedRecording._id})`);
    return savedRecording;
  } catch (error) {
    console.error('Error creating recording:', error);
    throw new Error(`Failed to create recording: ${error.message}`);
  }
}

/**
 * Create a new transcript record linked to a recording
 */
async function createTranscript(recordingId, transcriptData) {
  try {
    const transcript = new Transcript({
      recordingId,
      filename: transcriptData.filename,
      content: transcriptData.content,
      segments: transcriptData.segments || [],
      language: transcriptData.language,
      languageProbability: transcriptData.languageProbability,
      processingTime: transcriptData.processingTime
    });

    const savedTranscript = await transcript.save();

    // Update recording to mark it as having a transcript
    await Recording.findByIdAndUpdate(recordingId, {
      hasTranscript: true,
      transcriptionStatus: 'completed',
      language: transcriptData.language,
      languageProbability: transcriptData.languageProbability
    });

    return savedTranscript;
  } catch (error) {
    console.error('Error creating transcript:', error);
    // Mark recording as failed if transcript creation fails
    await Recording.findByIdAndUpdate(recordingId, {
      transcriptionStatus: 'failed',
      transcriptionError: error.message
    });
    throw error;
  }
}

/**
 * Get recordings with their transcripts
 */
async function getRecordingsWithTranscripts(limit = 50, offset = 0) {
  try {
    const recordings = await Recording.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    // Get transcripts for each recording
    const recordingsWithTranscripts = await Promise.all(
      recordings.map(async (recording) => {
        let transcript = null;
        if (recording.hasTranscript) {
          transcript = await Transcript.findOne({ recordingId: recording._id }).lean();
        }
        
        return {
          ...recording,
          transcript: transcript ? transcript.content : null,
          transcriptId: transcript ? transcript._id : null,
          summary: transcript ? transcript.summary : null
        };
      })
    );

    return recordingsWithTranscripts;
  } catch (error) {
    console.error('Error getting recordings with transcripts:', error);
    throw error;
  }
}

/**
 * Delete recording and associated transcript
 */
async function deleteRecording(filename) {
  try {
    const recording = await Recording.findOne({ filename });
    if (!recording) {
      throw new Error('Recording not found');
    }

    // Delete associated transcript
    await Transcript.findOneAndDelete({ recordingId: recording._id });

    // Delete files
    const uploadPath = path.join(__dirname, '../uploads', filename);
    const transcriptPath = path.join(__dirname, '../transcripts', `${filename}.txt`);

    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }
    if (fs.existsSync(transcriptPath)) {
      fs.unlinkSync(transcriptPath);
    }

    // Delete recording record
    await Recording.findByIdAndDelete(recording._id);

    return { success: true, message: 'Recording and transcript deleted successfully' };
  } catch (error) {
    console.error('Error deleting recording:', error);
    throw error;
  }
}

/**
 * Create an ingested document
 */
async function createIngestedDocument(documentData) {
  try {
    const document = new IngestedDocument(documentData);
    return await document.save();
  } catch (error) {
    console.error('Error creating ingested document:', error);
    throw error;
  }
}

/**
 * Get ingested documents with optional filtering
 */
async function getIngestedDocuments(filter = {}, limit = 50, offset = 0) {
  try {
    const query = { isActive: true, ...filter };
    const documents = await IngestedDocument.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('-text') // Exclude text content for list view
      .lean();

    return documents;
  } catch (error) {
    console.error('Error getting ingested documents:', error);
    throw error;
  }
}

/**
 * Get ingested document by ID with full text
 */
async function getIngestedDocumentById(id) {
  try {
    return await IngestedDocument.findById(id).lean();
  } catch (error) {
    console.error('Error getting ingested document by ID:', error);
    throw error;
  }
}

/**
 * Search through documents and transcripts
 */
async function searchContent(query, types = ['documents', 'transcripts']) {
  try {
    const results = {};

    if (types.includes('documents')) {
      results.documents = await IngestedDocument.find(
        { 
          $text: { $search: query },
          isActive: true 
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .select('-text')
      .lean();
    }

    if (types.includes('transcripts')) {
      results.transcripts = await Transcript.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .populate('recordingId', 'filename originalName createdAt')
      .select('-content')
      .lean();
    }

    return results;
  } catch (error) {
    console.error('Error searching content:', error);
    throw error;
  }
}

module.exports = {
  createRecording,
  createTranscript,
  getRecordingsWithTranscripts,
  deleteRecording,
  createIngestedDocument,
  getIngestedDocuments,
  getIngestedDocumentById,
  searchContent
};
