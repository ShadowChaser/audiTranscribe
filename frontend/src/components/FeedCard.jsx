import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

export default function FeedCard({ 
  avatar = '🎤', 
  title, 
  subtitle, 
  snippet, 
  fullText,
  metadata, 
  thumbnail, 
  actions,
  onClick 
}) {
  return (
    <div className="feed-card-item" onClick={onClick}>
      <div className="feed-card-avatar" style={{
        background: avatar === '🤖' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
        boxShadow: avatar === '🤖' ? 'var(--shadow-glow)' : 'none'
      }}>
        {typeof avatar === 'string' ? (
          <div className="avatar-emoji" style={{ filter: avatar === '🤖' ? 'brightness(0) invert(1)' : 'none' }}>
            {avatar}
          </div>
        ) : (
          avatar
        )}
      </div>
      
      <div className="feed-card-content">
        <div className="feed-card-header">
          <div className="feed-card-title-section">
            <h3 className="feed-card-title">{title}</h3>
            {subtitle && <span className="feed-card-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '0' }}>{subtitle}</span>}
          </div>
          {metadata && (
            <div className="feed-card-metadata" style={{ display: 'flex', gap: '8px' }}>
              {metadata.map((item, idx) => (
                <span key={idx} className="metadata-tag" style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  color: 'var(--text-tertiary)',
                  border: '1px solid var(--border-primary)'
                }}>{item}</span>
              ))}
            </div>
          )}
        </div>
        
        {fullText ? (
          <div className="feed-card-body" style={{ marginTop: '16px' }}>
            <MarkdownRenderer content={fullText} />
          </div>
        ) : (
          snippet && (
            <div className="feed-card-snippet" style={{ marginTop: '8px', opacity: 0.8 }}>
              <MarkdownRenderer content={snippet} />
            </div>
          )
        )}
        
        {actions && (
          <div className="feed-card-actions" style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            {actions}
          </div>
        )}
      </div>
      
      {thumbnail && (
        <div className="feed-card-thumbnail" style={{
          width: '100px',
          height: '60px',
          borderRadius: '8px',
          overflow: 'hidden',
          marginLeft: '16px',
          flexShrink: 0
        }}>
          {thumbnail}
        </div>
      )}
    </div>
  );
}
