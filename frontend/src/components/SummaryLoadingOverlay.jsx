import React from 'react';

const SummaryLoadingOverlay = ({ progress, estimatedTimeRemaining }) => {
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    if (seconds < 60) return `${seconds}s remaining`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s remaining`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 17, 23, 0.8)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWdith: '400px', 
        margin: '0 24px', 
        textAlign: 'center',
        padding: '40px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-secondary)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          border: '4px solid rgba(99, 102, 241, 0.1)', 
          borderTop: '4px solid var(--text-accent)', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 24px auto',
          boxShadow: 'var(--shadow-glow)'
        }}></div>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '8px' }}>
          Generating Summary
        </h3>
        
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '32px' }}>
          {estimatedTimeRemaining !== null 
            ? `Estimated time: ${formatTime(estimatedTimeRemaining)}`
            : 'Analyzing transcript content...'}
        </p>
        
        <div style={{ 
          height: '10px', 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '20px', 
          overflow: 'hidden',
          border: '1px solid var(--border-primary)',
          marginBottom: '12px'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${Math.min(100, Math.max(0, progress))}%`, 
            background: 'var(--accent-gradient)',
            transition: 'width 0.4s ease-out',
            boxShadow: 'var(--shadow-glow)'
          }}></div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.75rem', 
          color: 'var(--text-tertiary)',
          fontWeight: '600'
        }}>
          <span>{Math.round(progress)}%</span>
          <span>Analyzing</span>
        </div>
        
        <p style={{ 
          marginTop: '24px', 
          fontSize: '0.8rem', 
          color: 'var(--text-tertiary)',
          fontStyle: 'italic'
        }}>
          "AI is distilling your conversation into key insights..."
        </p>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default SummaryLoadingOverlay;
