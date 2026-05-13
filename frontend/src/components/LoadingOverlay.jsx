import React from 'react';

export const LoadingOverlay = ({ progress, message = 'Processing...' }) => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 17, 23, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: 'white',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{ 
        width: '60px', 
        height: '60px', 
        border: '4px solid rgba(99, 102, 241, 0.1)', 
        borderTop: '4px solid var(--text-accent)', 
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-glow)'
      }}></div>
      
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '700', 
        marginBottom: '16px',
        letterSpacing: '-0.5px'
      }}>
        {message}
      </h3>
      
      {progress !== undefined && (
        <div style={{ width: '80%', maxWidth: '400px' }}>
          <div style={{ 
            height: '8px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '10px', 
            overflow: 'hidden',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${progress}%`, 
              background: 'var(--accent-gradient)',
              transition: 'width 0.3s ease',
              boxShadow: 'var(--shadow-glow)'
            }}></div>
          </div>
          <p style={{ 
            marginTop: '12px', 
            fontSize: '0.85rem', 
            color: 'var(--text-tertiary)',
            textAlign: 'center'
          }}>
            {Math.round(progress)}% Complete
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;
