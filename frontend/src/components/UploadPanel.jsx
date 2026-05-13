import React from 'react';

export default function UploadPanel({ file, onFileChange, onTranscribe, loading }) {
  return (
    <div className="card" style={{ padding: '32px' }}>
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div className="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div>
          <h3 className="card-title">Upload Audio</h3>
          <p className="card-description">Transform any recording into structured notes</p>
        </div>
      </div>

      <div 
        className="upload-dropzone" 
        onClick={() => document.getElementById('file-input').click()}
        style={{
          border: '2px dashed var(--border-secondary)',
          borderRadius: '20px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)',
          transition: 'all 0.3s ease',
          marginBottom: file ? '24px' : '0'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
          e.currentTarget.style.borderColor = 'var(--text-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          e.currentTarget.style.borderColor = 'var(--border-secondary)';
        }}
      >
        <div style={{ 
          width: '64px', 
          height: '64px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: 'var(--text-accent)'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        
        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>
          {file ? file.name : 'Select or drag audio file'}
        </h4>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
          MP3, WAV, M4A or FLAC (Max 50MB)
        </p>
        
        <input
          id="file-input"
          type="file"
          onChange={onFileChange}
          accept="audio/*"
          style={{ display: 'none' }}
        />
      </div>

      {file && (
        <button 
          onClick={onTranscribe}
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} />
              <span>Processing Audio...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              <span>Start Transcription</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
