import React from 'react';

export default function UploadPanel({ file, onFileChange, onTranscribe, loading }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">📁</div>
        <div>
          <h3 className="card-title">Upload File</h3>
          <p className="card-description">Upload audio files (WAV, MP3, M4A, OGG, FLAC)</p>
        </div>
      </div>

      <div className="file-upload-area" onClick={() => document.getElementById('file-input').click()}>
        <div className="upload-icon">📤</div>
        <div className="upload-text">
          {file ? file.name : 'Click to select audio file'}
        </div>
        <div className="upload-subtext">
          Supports WAV, MP3, M4A, OGG, FLAC formats
        </div>
        <input
          id="file-input"
          type="file"
          onChange={onFileChange}
          accept="audio/*"
          className="file-input"
        />
      </div>

      {file && (
        <button 
          onClick={onTranscribe}
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{marginTop: '1rem', width: '100%'}}
        >
          {loading ? '⏳ Transcribing...' : '✨ Transcribe File'}
        </button>
      )}
    </div>
  );
}
