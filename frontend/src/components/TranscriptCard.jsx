import React from 'react';

export default function TranscriptCard({ transcript, onCopy, onSummarize, summarizing }) {
  if (!transcript || transcript === 'Transcribing...') return null;
  return (
    <div className="card col-12" style={{marginTop: '1rem'}}>
      <div className="card-header">
        <div className="card-icon">📝</div>
        <div style={{flex: 1}}>
          <h3 className="card-title">Transcript</h3>
          <p className="card-description">AI-generated transcription results</p>
        </div>
        <button 
          onClick={onCopy}
          className="btn btn-outline btn-sm"
          style={{marginLeft: 'auto'}}
        >
          📋 Copy
        </button>
        <button
          onClick={onSummarize}
          className="btn btn-primary btn-sm"
          style={{marginLeft: '0.5rem'}}
          disabled={summarizing}
          title="Summarize transcript into study notes"
        >
          {summarizing ? '⏳ Summarizing...' : '🧠 Summarize'}
        </button>
      </div>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxHeight: '400px',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <pre style={{
          color: '#ffffff',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          fontFamily: 'inherit',
          fontSize: '1rem',
          lineHeight: '1.6'
        }}>
          {transcript}
        </pre>
      </div>
    </div>
  );
}
