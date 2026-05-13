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
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Logo: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  )
};

export default function Sidebar({
  currentView = "chat",
  onNavigate = () => {},
  chat = {}
}) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <Icons.Logo />
        <span>ScribeFlow</span>
      </div>

      <div style={{ padding: '0 12px 24px 12px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => {
            onNavigate("chat");
            chat.createNewSession();
          }}
          style={{ 
            width: '100%', 
            justifyContent: 'flex-start', 
            gap: '12px', 
            borderRadius: '12px',
            padding: '12px',
            fontSize: '0.9rem',
            fontWeight: '600',
            border: '1px solid var(--border-secondary)',
            background: 'rgba(255,255,255,0.03)'
          }}
        >
          <Icons.Plus />
          New chat
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${currentView === "chat" ? "active" : ""}`}
          onClick={() => onNavigate("chat")}
        >
          <Icons.Chat />
          <span>Assistant</span>
        </button>
        
        <button
          className={`nav-btn ${currentView === "transcripts" ? "active" : ""}`}
          onClick={() => onNavigate("transcripts")}
        >
          <Icons.Transcripts />
          <span>My Transcripts</span>
        </button>
        
        <button
          className={`nav-btn ${currentView === "import" ? "active" : ""}`}
          onClick={() => onNavigate("import")}
        >
          <Icons.Import />
          <span>Audio Import</span>
        </button>
      </nav>

      {/* Chat History Section */}
      {currentView === "chat" && chat.sessions && (
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '0 12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>History</span>
          </div>
          
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px' }}>
            {chat.sessions.length > 0 ? chat.sessions.map((session) => (
              <div key={session._id} style={{ position: 'relative' }} className="history-item-container">
                <button
                  className={`nav-btn ${chat.activeSessionId === session._id ? "active" : ""}`}
                  onClick={() => chat.switchSession(session._id)}
                  style={{ 
                    width: '100%', 
                    justifyContent: 'flex-start', 
                    fontSize: '0.85rem',
                    padding: '8px 12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingRight: '30px',
                    borderRadius: '8px',
                    border: 'none',
                    background: chat.activeSessionId === session._id ? 'rgba(255,255,255,0.05)' : 'transparent'
                  }}
                >
                  {session.title || "Untitled Chat"}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); chat.deleteSession(session._id); }}
                  style={{ 
                    position: 'absolute', 
                    right: '8px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    padding: '4px',
                    display: 'none'
                  }}
                  className="history-delete-btn"
                >
                  <Icons.Trash />
                </button>
              </div>
            )) : (
              <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                No recent chats
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto', padding: '12px' }}>
        <div style={{ 
          padding: '16px', 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}>
          <p style={{ marginBottom: '4px', fontWeight: '700', color: 'var(--text-primary)' }}>Nexus Pro</p>
          <p style={{ opacity: 0.7 }}>Unlimited processing & priority access.</p>
        </div>
      </div>

      <style>{`
        .history-item-container:hover .history-delete-btn { display: flex !important; }
        .history-delete-btn { color: var(--text-tertiary); transition: color 0.2s; }
        .history-delete-btn:hover { color: var(--color-danger); }
        .nav-btn.active::before { display: none; }
      `}</style>
    </aside>
  );
}
