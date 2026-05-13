import React from "react";

const Icons = {
  Chat: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Transcripts: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Import: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Logo: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  )
};

export default function Sidebar({
  currentView = "chat",
  onNavigate = () => {},
}) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <Icons.Logo />
        <span>ScribeFlow</span>
      </div>
      
      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${currentView === "chat" ? "active" : ""}`}
          onClick={() => onNavigate("chat")}
        >
          <Icons.Chat />
          <span>Chat</span>
        </button>
        
        <button
          className={`nav-btn ${currentView === "transcripts" ? "active" : ""}`}
          onClick={() => onNavigate("transcripts")}
        >
          <Icons.Transcripts />
          <span>Transcripts</span>
        </button>
        
        <button
          className={`nav-btn ${currentView === "import" ? "active" : ""}`}
          onClick={() => onNavigate("import")}
        >
          <Icons.Import />
          <span>Import</span>
        </button>
      </nav>

      <div style={{ marginTop: 'auto', padding: '12px' }}>
        <div style={{ 
          padding: '16px', 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)'
        }}>
          <p style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)' }}>Pro Plan</p>
          <p>Unlimited transcriptions & premium AI models.</p>
        </div>
      </div>
    </aside>
  );
}
