import React from 'react';

export default function Topbar({ onImportClick, onRecordClick }) {
  return (
    <div className="otter-topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">Home</h2>
      </div>
      <div className="topbar-actions">
        <button className="topbar-btn" onClick={onImportClick} title="Import">
          📤 <span>Import</span>
        </button>
        <button className="topbar-btn primary" onClick={onRecordClick} title="Record">
          ⏺️ <span>Record</span>
        </button>
      </div>
    </div>
  );
}
