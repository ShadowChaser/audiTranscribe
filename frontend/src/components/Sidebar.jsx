import React from 'react';

export default function Sidebar({ currentView = 'chat', onNavigate = () => {} }) {
  return (
    <aside className="otter-sidebar">
      <div className="sidebar-header">Oll+</div>
      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${currentView === 'chat' ? 'active' : ''}`}
          title="Chat"
          onClick={() => onNavigate('chat')}
        >
          💬 <span>Chat</span>
        </button>
        <button
          className={`nav-btn ${currentView === 'transcripts' ? 'active' : ''}`}
          title="Transcripts"
          onClick={() => onNavigate('transcripts')}
        >
          📝 <span>Transcripts</span>
        </button>
        <button className="nav-btn" title="Settings">⚙️ <span>Settings</span></button>
      </nav>
    </aside>
  );
}
