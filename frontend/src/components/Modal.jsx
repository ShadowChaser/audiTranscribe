import React from "react";

export default function Modal({ open, title, onClose, children, width = 720 }) {
  if (!open) return null;
  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div
        className="app-modal"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="app-modal-body">{children}</div>
      </div>
    </div>
  );
}
