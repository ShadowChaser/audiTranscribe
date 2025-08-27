import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import FeedCard from "../components/FeedCard";

const TranscriptView = ({ recording, transcript, summary }) => {
  const [currentRecordings, setCurrentRecordings] = useState([]);
  const [savedRecordings, setSavedRecordings] = useState([]);
  const [editingTitles, setEditingTitles] = useState({});
  const [customTitles, setCustomTitles] = useState({});

  useEffect(() => {
    fetchSavedRecordings();
  }, []);

  const fetchSavedRecordings = async () => {
    try {
      const response = await axios.get("http://localhost:3001/recordings");
      setSavedRecordings(response.data.recordings);
    } catch (err) {
      console.error("Failed to fetch saved recordings:", err);
    }
  };

  // Title management
  const generateSummaryTitle = (summaryText) => {
    if (!summaryText) return "Summary Results";
    const text = summaryText.toLowerCase();

    if (text.includes("lesson") || text.includes("chapter"))
      return "Learning Notes";
    if (text.includes("meeting") || text.includes("agenda"))
      return "Meeting Summary";
    if (text.includes("research") || text.includes("study"))
      return "Research Insights";
    if (text.includes("code") || text.includes("technical"))
      return "Technical Notes";
    if (text.includes("interview")) return "Interview Summary";
    if (text.includes("news") || text.includes("report")) return "News Brief";
    if (text.includes("business") || text.includes("strategy"))
      return "Business Summary";
    return "Content Summary";
  };

  const getSummaryTitle = (summaryText, id, type = "recording") => {
    const titleKey = `${type}_${id}`;
    return customTitles[titleKey] || generateSummaryTitle(summaryText);
  };

  const startEditingTitle = (id, type = "recording") => {
    const titleKey = `${type}_${id}`;
    setEditingTitles((prev) => ({ ...prev, [titleKey]: true }));
  };

  const saveTitle = (id, newTitle, type = "recording") => {
    const titleKey = `${type}_${id}`;
    setCustomTitles((prev) => ({
      ...prev,
      [titleKey]: newTitle.trim() || generateSummaryTitle(""),
    }));
    setEditingTitles((prev) => ({ ...prev, [titleKey]: false }));
    toast.success("Title updated!");
  };

  const cancelEditingTitle = (id, type = "recording") => {
    const titleKey = `${type}_${id}`;
    setEditingTitles((prev) => ({ ...prev, [titleKey]: false }));
  };

  // Export functionality
  const exportToPDF = async (summaryText, title) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      // Add logo or app name at the top
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(51, 48, 163); // Indigo color
      pdf.text("Audio Transcriber", margin, 20);

      // Add decorative line
      pdf.setDrawColor(51, 48, 163);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 25, pageWidth - margin, 25);

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text(title, margin, 40);

      // Add metadata
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(128, 128, 128); // Gray color
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, 50);

      // Add summary heading
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Summary", margin, 65);

      // Add the main summary text with proper wrapping
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const splitText = pdf.splitTextToSize(summaryText, contentWidth);

      // Calculate if we need a new page based on content length
      let yPosition = 75;
      const lineHeight = 7;
      const maxLinesPerPage = Math.floor(
        (pdf.internal.pageSize.height - yPosition) / lineHeight
      );

      splitText.forEach((line, index) => {
        if (index > 0 && index % maxLinesPerPage === 0) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Add footer with page numbers
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pdf.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName = `${title.replace(/\\s+/g, "_")}_${Date.now()}.pdf`;
      pdf.save(fileName);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF");
    }
  };

  // Helper functions
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error(
        "Failed to copy to clipboard. Please select and copy manually."
      );
    }
  };

  const clearAllTranscripts = () => {
    currentRecordings.forEach((recording) => {
      if (recording.url) {
        URL.revokeObjectURL(recording.url);
      }
    });
    setCurrentRecordings([]);
    toast.success("All transcripts cleared!");
  };

  const clearAllSummaries = () => {
    setCurrentRecordings((prev) => prev.map((r) => ({ ...r, summary: "" })));
    setSavedRecordings((prev) => prev.map((r) => ({ ...r, summary: "" })));
    toast.success("All summaries cleared!");
  };

  // Set up recording completion handler on mount and cleanup
  useEffect(() => {
    const handleNewRecording = async (newRecording) => {
      if (newRecording) {
        console.log("New recording received:", newRecording); // Debug log
        setCurrentRecordings((prev) => {
          console.log("Previous recordings:", prev); // Debug log
          return [...prev, newRecording];
        });
      }
    };

    if (recording && recording.onRecordingComplete) {
      console.log("Setting up recording completion handler"); // Debug log
      recording.onRecordingComplete(handleNewRecording);
    }

    // Cleanup function
    return () => {
      if (recording && recording.onRecordingComplete) {
        recording.onRecordingComplete(null);
      }
    };
  }, [recording]);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={clearAllTranscripts}
          title="Remove all in-session recordings"
        >
          🧹 Clear All Transcripts
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={clearAllSummaries}
          title="Remove all generated summaries"
        >
          🧽 Clear All Summaries
        </button>
      </div>

      {/* Current Session Recordings */}
      {currentRecordings.map((rec, index) => (
        <div key={rec.id}>
          <FeedCard
            avatar={
              rec.type === "system" ? "🔊" : rec.type === "import" ? "📥" : "🎤"
            }
            title={`Recording #${currentRecordings.length - index}`}
            subtitle={
              rec.timestamp instanceof Date
                ? rec.timestamp.toLocaleTimeString()
                : new Date(rec.timestamp).toLocaleTimeString()
            }
            fullText={rec.transcript || undefined}
            snippet={
              !rec.transcript
                ? "Click to transcribe"
                : rec.transcript === "Transcribing..."
                ? "Transcribing audio..."
                : undefined
            }
            metadata={[
              `${(rec.size / 1024).toFixed(1)} KB`,
              rec.type === "system" ? "System Audio" : "Microphone",
            ]}
            thumbnail={
              <audio
                controls
                src={rec.url}
                style={{ width: "100%", height: "32px" }}
              />
            }
            actions={
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    transcript.transcribeRecording(rec).then((result) => {
                      if (result) {
                        setCurrentRecordings((prev) =>
                          prev.map((r) =>
                            r.id === rec.id
                              ? {
                                  ...r,
                                  transcript: result.transcript,
                                  backendFilename: result.backendFilename,
                                }
                              : r
                          )
                        );
                        toast.success("Recording transcribed successfully!");
                      }
                    });
                  }}
                  className="btn btn-primary btn-sm"
                  disabled={transcript.loading}
                  title={
                    rec.transcript === "Transcribing..."
                      ? "Transcribing audio..."
                      : rec.transcript
                      ? "Transcription complete"
                      : "Start transcription"
                  }
                >
                  {rec.transcript === "Transcribing..."
                    ? "⏳"
                    : rec.transcript
                    ? "✅"
                    : "✨"}
                </button>
                {rec.transcript && rec.transcript !== "Transcribing..." && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        summary
                          .summarizeText(rec.transcript, false)
                          .then((result) => {
                            if (result) {
                              setCurrentRecordings((prev) =>
                                prev.map((r) =>
                                  r.id === rec.id
                                    ? { ...r, summary: result }
                                    : r
                                )
                              );
                              toast.success("Summary generated successfully!");
                            }
                          });
                      }}
                      className="btn btn-secondary btn-sm"
                      disabled={summary.summarizing}
                      title="Generate summary"
                    >
                      {summary.summarizing ? "⏳" : "🧠"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        summary
                          .summarizeText(rec.transcript, true)
                          .then((result) => {
                            if (result) {
                              setCurrentRecordings((prev) =>
                                prev.map((r) =>
                                  r.id === rec.id
                                    ? { ...r, summary: result }
                                    : r
                                )
                              );
                              toast.success(
                                "Study notes generated successfully!"
                              );
                            }
                          });
                      }}
                      className="btn btn-secondary btn-sm"
                      disabled={summary.summarizing}
                      title="Generate study notes"
                    >
                      {summary.summarizing ? "⏳" : "📘"}
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (rec.url) {
                      URL.revokeObjectURL(rec.url);
                    }
                    setCurrentRecordings((prev) =>
                      prev.filter((r) => r.id !== rec.id)
                    );
                    toast.success("Recording deleted!");
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#b91c1c" }}
                  title="Delete this recording"
                >
                  🗑️
                </button>
              </>
            }
          />
          {rec.summary && (
            <FeedCard
              avatar="🧠"
              title={
                editingTitles[`recording_${rec.id}`] ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      defaultValue={getSummaryTitle(rec.summary, rec.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveTitle(rec.id, e.target.value);
                        } else if (e.key === "Escape") {
                          cancelEditingTitle(rec.id);
                        }
                      }}
                      onBlur={(e) => saveTitle(rec.id, e.target.value)}
                      autoFocus
                      style={{
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "14px",
                        minWidth: "200px",
                      }}
                    />
                    <button
                      onClick={() => cancelEditingTitle(rec.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      title="Cancel editing"
                    >
                      ❌
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span>{getSummaryTitle(rec.summary, rec.id)}</span>
                    <button
                      onClick={() => startEditingTitle(rec.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      title="Edit title"
                    >
                      ✏️
                    </button>
                  </div>
                )
              }
              subtitle="Generated summary"
              fullText={rec.summary}
              actions={
                <>
                  <button
                    onClick={() => copyToClipboard(rec.summary)}
                    className="btn btn-outline btn-sm"
                    title="Copy summary to clipboard"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() =>
                      exportToPDF(
                        rec.summary,
                        getSummaryTitle(rec.summary, rec.id)
                      )
                    }
                    className="btn btn-primary btn-sm"
                    title="Export to PDF"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => {
                      setCurrentRecordings((prev) =>
                        prev.map((r) =>
                          r.id === rec.id ? { ...r, summary: "" } : r
                        )
                      );
                      toast.success("Summary cleared!");
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ color: "#b91c1c" }}
                    title="Clear this summary"
                  >
                    🗑️ Clear
                  </button>
                </>
              }
            />
          )}
        </div>
      ))}

      {/* Saved Recordings */}
      {savedRecordings.map((rec) => (
        <div key={rec.filename}>
          <FeedCard
            avatar="📁"
            title={rec.filename || "Saved Recording"}
            subtitle={new Date(rec.created).toLocaleString()}
            fullText={rec.transcript || undefined}
            snippet={!rec.transcript ? "No transcript available" : undefined}
            metadata={[
              `${(rec.size / 1024).toFixed(1)} KB`,
              rec.created
                ? new Date(rec.created).toLocaleDateString()
                : "Unknown date",
            ]}
            thumbnail={
              <div
                style={{
                  background: "#e0e7ff",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "#3730a3",
                }}
              >
                📄
              </div>
            }
            actions={
              <>
                {rec.hasTranscript && rec.transcript && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        summary
                          .summarizeText(rec.transcript, false)
                          .then((result) => {
                            if (result) {
                              setSavedRecordings((prev) =>
                                prev.map((r) =>
                                  r.filename === rec.filename
                                    ? { ...r, summary: result }
                                    : r
                                )
                              );
                              toast.success("Summary generated!");
                            }
                          });
                      }}
                      className="btn btn-secondary btn-sm"
                      disabled={summary.summarizing}
                      title="Generate summary"
                    >
                      {summary.summarizing ? "⏳" : "🧠"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        summary
                          .summarizeText(rec.transcript, true)
                          .then((result) => {
                            if (result) {
                              setSavedRecordings((prev) =>
                                prev.map((r) =>
                                  r.filename === rec.filename
                                    ? { ...r, summary: result }
                                    : r
                                )
                              );
                              toast.success("Study notes generated!");
                            }
                          });
                      }}
                      className="btn btn-secondary btn-sm"
                      disabled={summary.summarizing}
                      title="Generate study notes"
                    >
                      {summary.summarizing ? "⏳" : "📘"}
                    </button>
                  </>
                )}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await axios.delete(
                        `http://localhost:3001/recording/${rec.filename}`
                      );
                      fetchSavedRecordings();
                      toast.success("Recording deleted successfully!");
                    } catch (err) {
                      console.error("Failed to delete recording:", err);
                      toast.error("Failed to delete recording");
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#b91c1c" }}
                  title="Delete this saved recording"
                >
                  🗑️
                </button>
              </>
            }
          />
          {rec.summary && (
            <FeedCard
              avatar="🧠"
              title={
                editingTitles[`saved_${rec.filename}`] ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      defaultValue={getSummaryTitle(
                        rec.summary,
                        rec.filename,
                        "saved"
                      )}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveTitle(rec.filename, e.target.value, "saved");
                        } else if (e.key === "Escape") {
                          cancelEditingTitle(rec.filename, "saved");
                        }
                      }}
                      onBlur={(e) =>
                        saveTitle(rec.filename, e.target.value, "saved")
                      }
                      autoFocus
                      style={{
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "14px",
                        minWidth: "200px",
                      }}
                    />
                    <button
                      onClick={() => cancelEditingTitle(rec.filename, "saved")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      title="Cancel editing"
                    >
                      ❌
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      {getSummaryTitle(rec.summary, rec.filename, "saved")}
                    </span>
                    <button
                      onClick={() => startEditingTitle(rec.filename, "saved")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      title="Edit title"
                    >
                      ✏️
                    </button>
                  </div>
                )
              }
              subtitle="Generated summary"
              fullText={rec.summary}
              actions={
                <>
                  <button
                    onClick={() => copyToClipboard(rec.summary)}
                    className="btn btn-outline btn-sm"
                    title="Copy summary to clipboard"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() =>
                      exportToPDF(
                        rec.summary,
                        getSummaryTitle(rec.summary, rec.filename, "saved")
                      )
                    }
                    className="btn btn-primary btn-sm"
                    title="Export to PDF"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => {
                      setSavedRecordings((prev) =>
                        prev.map((r) =>
                          r.filename === rec.filename
                            ? { ...r, summary: "" }
                            : r
                        )
                      );
                      toast.success("Summary cleared!");
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ color: "#b91c1c" }}
                    title="Clear this summary"
                  >
                    🗑️ Clear
                  </button>
                </>
              }
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default TranscriptView;
