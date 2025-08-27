import React from 'react';

export default function RecordPanel({
  isRecording,
  isPaused,
  recordingType,
  setRecordingType,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  recordTimerMs,
  loading
}) {
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  return (
    <div className="card" style={{background: '#ffffff', color: '#111827'}}>
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
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid #e5e7eb',
          color: '#111827'
        }}>
          <p style={{margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#111827'}}>
            📋 <strong>Instructions:</strong>
          </p>
          <p style={{margin: 0, fontSize: '0.85rem', lineHeight: '1.4', color: '#4b5563'}}>
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
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <div className="recording-indicator" style={{color: '#111827'}}>
                <div className="pulse"></div>
                {isPaused ? 'Paused' : 'Recording'} • {formatTime(recordTimerMs)}
              </div>
            </div>
            <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
              {!isPaused ? (
                <button 
                  onClick={pauseRecording}
                  className="btn btn-secondary btn-lg"
                >
                  ⏸️ Pause
                </button>
              ) : (
                <button 
                  onClick={resumeRecording}
                  className="btn btn-secondary btn-lg"
                >
                  ▶️ Resume
                </button>
              )}
            <button 
              onClick={stopRecording}
              className="btn btn-secondary btn-lg"
            >
              ⏹️ Stop Recording
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
