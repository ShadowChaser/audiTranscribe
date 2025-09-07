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
      <div className="feed-card-avatar">
        {typeof avatar === 'string' ? (
          <div className="avatar-emoji">{avatar}</div>
        ) : (
          avatar
        )}
      </div>
      
      <div className="feed-card-content">
        <div className="feed-card-header">
          <div className="feed-card-title-section">
            <h3 className="feed-card-title">{title}</h3>
            {subtitle && <span className="feed-card-subtitle">{subtitle}</span>}
          </div>
          {metadata && (
            <div className="feed-card-metadata">
              {metadata.map((item, idx) => (
                <span key={idx} className="metadata-item">{item}</span>
              ))}
            </div>
          )}
        </div>
        
        {fullText ? (
          <div className="feed-card-fulltext">
            <MarkdownRenderer content={fullText} />
          </div>
        ) : (
          snippet && (
            <div className="feed-card-snippet">
              <MarkdownRenderer content={snippet} />
            </div>
          )
        )}
        
        {actions && (
          <div className="feed-card-actions">
            {actions}
          </div>
        )}
      </div>
      
      {thumbnail && (
        <div className="feed-card-thumbnail">
          {thumbnail}
        </div>
      )}
    </div>
  );
}
