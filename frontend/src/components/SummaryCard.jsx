import React from 'react';

export default function SummaryCard({ summary, onCopy }) {
  if (!summary) return null;
  return (
    <div className="card col-12" style={{marginTop: '1rem'}}>
      <div className="card-header">
        <div className="card-icon">🧠</div>
        <div style={{flex: 1}}>
          <h3 className="card-title">Summary</h3>
          <p className="card-description">Concise study notes generated locally via Ollama</p>
        </div>
        <button 
          onClick={onCopy}
          className="btn btn-outline btn-sm"
          style={{marginLeft: 'auto'}}
        >
          📋 Copy
        </button>
      </div>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
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
          {summary}
        </pre>
      </div>
    </div>
  );
}
