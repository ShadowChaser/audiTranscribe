import React, { useRef, useState } from 'react';

export default function ChatInput({ onGetStarted, onSendMessage, isLoading, onAttachFile, onOpenPasteModal, sources = [], onRemoveSource }) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && onAttachFile) {
      onAttachFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        {/* Sources chips */}
        {sources && sources.length > 0 && (
          <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '8px 12px'}}>
            {sources.map(src => (
              <span key={src.id} className="badge" style={{background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '4px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px'}}>
                <span style={{maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{src.name}</span>
                {onRemoveSource && (
                  <button type="button" onClick={() => onRemoveSource(src.id)} style={{background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer'}}>✕</button>
                )}
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="chat-input">
          <div className="chat-input-icon">🤖</div>
          <input 
            type="text" 
            placeholder="Ask Otter anything about your conversations..." 
            className="chat-input-field"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
          <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileChange} accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" />
          <button type="button" className="chat-input-send" title="Attach file" onClick={handleFileClick} disabled={isLoading}>
            📎
          </button>
          <button type="button" className="chat-input-send" title="Paste text" onClick={onOpenPasteModal} disabled={isLoading}>
            ➕
          </button>
          <button type="submit" className="chat-input-send" disabled={!message.trim() || isLoading}>
            {isLoading ? (
              <div className="spinner" style={{width: '14px', height: '14px'}}></div>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </form>
        <button className="get-started-btn" onClick={onGetStarted}>
          <span className="get-started-fraction">0/3</span>
          <span>Get started</span>
        </button>
      </div>
    </div>
  );
}
