import React, { useRef, useState } from "react";

export default function ChatInput({
  onSendMessage,
  isLoading,
  onAttachFile,
  onOpenPasteModal,
  sources = [],
  onRemoveSource,
}) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && onAttachFile) {
      onAttachFile(file);
      e.target.value = "";
    }
  };

  return (
    <div className="chat-input-container" style={{
      position: 'fixed',
      bottom: '24px',
      left: 'calc(var(--sidebar-width) + 32px)',
      right: '32px',
      background: 'transparent',
      border: 'none',
      padding: 0,
      zIndex: 10
    }}>
      <div className="chat-input-wrapper" style={{
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        background: 'rgba(26, 27, 46, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-secondary)',
        borderRadius: '24px',
        padding: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
      }}>
        {sources && sources.length > 0 && (
          <div style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            padding: "0 12px 12px 12px",
            borderBottom: '1px solid var(--border-primary)',
            marginBottom: '12px'
          }}>
            {sources.map((src) => (
              <span key={src.id} style={{
                background: "rgba(99, 102, 241, 0.15)",
                color: "var(--text-accent)",
                border: "1px solid var(--border-accent)",
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: '0.8rem',
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {src.name}
                </span>
                <button type="button" onClick={() => onRemoveSource(src.id)} style={{ color: 'var(--text-accent)', opacity: 0.7 }}>✕</button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={handleFileClick} style={{ padding: '8px', width: '40px', height: '40px', borderRadius: '50%' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          
          <button type="button" className="btn btn-secondary" onClick={onOpenPasteModal} style={{ padding: '8px', width: '40px', height: '40px', borderRadius: '50%' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <input
            type="text"
            placeholder="Ask anything about your audio..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              boxShadow: 'none',
              fontSize: '1rem',
              padding: '8px 4px'
            }}
          />

          <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

          <button type="submit" className="btn btn-primary" disabled={!message.trim() || isLoading} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}>
            {isLoading ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
