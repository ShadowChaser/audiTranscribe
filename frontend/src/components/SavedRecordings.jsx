import React from "react";
import { copyToClipboard } from "../utils/clipboard";

export default function SavedRecordings({
  savedRecordings,
  deleteSavedRecording,
  fetchSavedRecordings,
  summarizeSavedRecording,
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">💾</div>
        <div>
          <h3 className="card-title">Saved Recordings</h3>
          <p className="card-description">
            All recordings and transcripts saved in the system
          </p>
        </div>
      </div>

      {savedRecordings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📂</div>
          <p>No saved recordings found</p>
        </div>
      ) : (
        <div>
          <div
            style={{ marginBottom: "1rem", fontSize: "0.9rem", opacity: 0.8 }}
          >
            Found {savedRecordings.length} saved recording
            {savedRecordings.length !== 1 ? "s" : ""}
          </div>
          {savedRecordings.map((recording, index) => (
            <div key={recording.filename} className="recorded-audio-section">
              <div className="recording-header">
                <div className="recording-meta">
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: recording.hasTranscript
                        ? "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)"
                        : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    }}
                  ></div>
                  <h5
                    style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600" }}
                  >
                    📁 Recording #{savedRecordings.length - index}
                  </h5>
                  <span className="badge">
                    {(recording.size / 1024).toFixed(1)} KB
                  </span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                    {new Date(recording.created).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => deleteSavedRecording(recording.filename)}
                  className="btn btn-secondary btn-icon"
                  style={{
                    background: "rgba(255, 107, 107, 0.2)",
                    border: "1px solid rgba(255, 107, 107, 0.3)",
                    color: "#ff6b6b",
                  }}
                  title="Delete saved recording"
                >
                  🗑️
                </button>
              </div>

              <audio
                controls
                src={`http://localhost:3001/uploads/${recording.filename}`}
                className="audio-player"
              />

              <div className="actions-row">
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `http://localhost:3001/uploads/${recording.filename}`;
                    link.download = recording.filename;
                    link.click();
                  }}
                  className="btn btn-secondary"
                  title="Download recording"
                >
                  💾 Download
                </button>
                {recording.hasTranscript && recording.transcript && (
                  <button
                    onClick={() => summarizeSavedRecording(recording.filename)}
                    className="btn btn-secondary"
                    disabled={recording.summarizing}
                    title="Summarize this saved recording's transcript"
                  >
                    {recording.summarizing ? "⏳ Summarizing" : "🧠 Summarize"}
                  </button>
                )}
                <button
                  onClick={fetchSavedRecordings}
                  className="btn btn-secondary"
                  title="Refresh recordings"
                >
                  🔄 Refresh
                </button>
              </div>

              {/* Show transcript if available */}
              {recording.hasTranscript && recording.transcript && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "8px",
                    padding: "1rem",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <h6
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "0.8rem",
                      opacity: 0.8,
                    }}
                  >
                    📝 Transcript:
                  </h6>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      lineHeight: "1.4",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {recording.transcript}
                  </p>
                  {recording.summary && (
                    <div
                      style={{
                        marginTop: "0.8rem",
                        background: "rgba(0, 0, 0, 0.2)",
                        borderRadius: "8px",
                        padding: "0.8rem",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <h6
                          style={{
                            margin: 0,
                            fontSize: "0.8rem",
                            opacity: 0.8,
                          }}
                        >
                          🧠 Summary:
                        </h6>
                        <button
                          onClick={() => copyToClipboard(recording.summary)}
                          className="btn btn-outline btn-sm"
                          title="Copy summary"
                        >
                          📋 Copy Summary
                        </button>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.9rem",
                          lineHeight: "1.4",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {recording.summary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!recording.hasTranscript && (
                <div
                  style={{
                    background: "rgba(255, 193, 7, 0.1)",
                    borderRadius: "8px",
                    padding: "0.8rem",
                    border: "1px solid rgba(255, 193, 7, 0.2)",
                    textAlign: "center",
                    fontSize: "0.85rem",
                    opacity: 0.8,
                  }}
                >
                  ⚠️ No transcript available for this recording
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
