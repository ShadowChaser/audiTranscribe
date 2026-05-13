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
    <div className="record-panel" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: isRecording ? 'rgba(248, 113, 113, 0.1)' : 'rgba(99, 102, 241, 0.1)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: isRecording ? 'var(--color-danger)' : 'var(--text-accent)',
          border: `2px solid ${isRecording ? 'rgba(248, 113, 113, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
          transition: 'all 0.3s ease'
        }}>
          {isRecording ? <div className="pulse" style={{ width: '24px', height: '24px' }}></div> : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>
          {isRecording ? formatTime(recordTimerMs) : 'Ready to record'}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {isRecording ? (isPaused ? 'Recording paused' : 'Capturing audio...') : 'Choose your source and start capturing'}
        </p>
      </div>

      {!isRecording && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' }}>
          <button 
            onClick={() => setRecordingType('microphone')}
            className={`btn ${recordingType === 'microphone' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, maxWidth: '200px' }}
          >
            🎤 Microphone
          </button>
          <button 
            onClick={() => setRecordingType('system')}
            className={`btn ${recordingType === 'system' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, maxWidth: '200px' }}
          >
            🔊 System Audio
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        {!isRecording ? (
          <button 
            onClick={() => startRecording(recordingType)}
            className="btn btn-primary btn-lg"
            style={{ minWidth: '240px', borderRadius: 'var(--radius-full)' }}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Recording'}
          </button>
        ) : (
          <>
            <button 
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="btn btn-secondary btn-lg"
              style={{ width: '64px', height: '64px', borderRadius: '50%', padding: 0 }}
            >
              {isPaused ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              )}
            </button>
            <button 
              onClick={stopRecording}
              className="btn btn-danger btn-lg"
              style={{ padding: '0 32px', borderRadius: 'var(--radius-full)' }}
            >
              Stop & Save
            </button>
          </>
        )}
      </div>

      {!isRecording && (
        <div style={{ 
          marginTop: '40px', 
          padding: '20px', 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '16px', 
          textAlign: 'left',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-primary)'
        }}>
          <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Pro Tip:</p>
          <p>For system audio, select "Entire Screen" and check "Share System Audio" in the browser prompt for best results.</p>
        </div>
      )}
    </div>
  );
}
