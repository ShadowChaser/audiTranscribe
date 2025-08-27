import React from 'react';

export default function RecordPanel({
  isRecording,
  recordingType,
  setRecordingType,
  startRecording,
  stopRecording,
  loading
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">🎤</div>
        <div>
          <h3 className="card-title">Record Audio</h3>
          <p className="card-description">Record microphone or system audio for transcription</p>
        </div>
      </div>

      {!isRecording && (
        <div style={{marginBottom: '1rem'}}>
          <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
            <button 
              onClick={() => setRecordingType('microphone')}
              className={`btn ${recordingType === 'microphone' ? 'btn-primary' : 'btn-secondary'}`}
              style={{flex: 1}}
            >
              🎤 Microphone
            </button>
            <button 
              onClick={() => setRecordingType('system')}
              className={`btn ${recordingType === 'system' ? 'btn-primary' : 'btn-secondary'}`}
              style={{flex: 1}}
            >
              🔊 System Audio
            </button>
          </div>
        </div>
      )}

      {!isRecording && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9}}>
            📋 <strong>Instructions:</strong>
          </p>
          <p style={{margin: 0, fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.4'}}>
            Click "Start Recording" → Allow screen sharing with audio → Select your entire screen or specific app → 
            The system will continuously listen and capture all audio until you stop recording.
          </p>
        </div>
      )}

      <div className="recording-controls">
        {!isRecording ? (
          <button 
            onClick={() => startRecording(recordingType)}
            className="btn btn-danger btn-lg"
            disabled={loading}
          >
            🎙️ Start Recording
          </button>
        ) : (
          <div className="recording-active">
            <button 
              onClick={stopRecording}
              className="btn btn-secondary btn-lg"
            >
              ⏹️ Stop Recording
            </button>
            <div className="recording-indicator">
              <div className="pulse"></div>
              Recording in progress...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
