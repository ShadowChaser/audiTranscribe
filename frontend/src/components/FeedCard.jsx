import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{fullText}</ReactMarkdown>
          </div>
        ) : (
          snippet && (
            <p className="feed-card-snippet">{snippet}</p>
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
