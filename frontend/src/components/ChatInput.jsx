import { useState, useRef, useEffect } from "react";

export default function ChatInput({
  onSendMessage,
  isLoading,
  onAttachFile,
  onOpenPasteModal,
  sources = [],
  onRemoveSource = () => {}
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        {/* Sources Chips */}
        {sources.length > 0 && (
          <div className="chat-sources-row">
            {sources.map((src) => (
              <div key={src.id} className="source-chip">
                <span>{src.name}</span>
                <button onClick={() => onRemoveSource(src.id)}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="chat-input-bar">
          <button className="input-action-btn" onClick={onOpenPasteModal} title="Add Knowledge Source">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
          />

          <button 
            className={`send-btn ${text.trim() ? 'active' : ''}`} 
            onClick={handleSend}
            disabled={!text.trim() || isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        
        <div className="input-footer">
          Nexus AI can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
}
