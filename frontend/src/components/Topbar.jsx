import React from "react";

export default function Topbar({ currentView, onImportClick, onRecordClick }) {
  const getTitle = () => {
    switch (currentView) {
      case "chat": return "Nexus AI Chat";
      case "transcripts": return "My Transcripts";
      case "import": return "Import Audio";
      default: return "ScribeFlow";
    }
  };

  return (
    <div className="app-topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{getTitle()}</h2>
      </div>
      
      <div className="topbar-actions">
        <button className="btn btn-secondary" onClick={onImportClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Upload</span>
        </button>
        
        <button className="btn btn-primary" onClick={onRecordClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          <span>Record</span>
        </button>
      </div>
    </div>
  );
}
