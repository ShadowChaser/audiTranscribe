import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { copyToClipboard } from "../utils/clipboard";

export default function SummaryCard({ summary }) {
  if (!summary) return null;
  return (
    <div className="card col-12" style={{ marginTop: "1rem" }}>
      <div className="card-header">
        <div className="card-icon">🧠</div>
        <div style={{ flex: 1 }}>
          <h3 className="card-title">Summary</h3>
          <p className="card-description">
            Concise study notes generated locally via Ollama
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(summary);
          }}
          className="btn btn-outline btn-sm"
          style={{ marginLeft: "auto" }}
        >
          📋 Copy
        </button>
      </div>
      <div
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "12px",
          padding: "1.5rem",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            color: "#ffffff",
            margin: 0,
            fontFamily: "inherit",
            fontSize: "1rem",
            lineHeight: "1.6",
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
