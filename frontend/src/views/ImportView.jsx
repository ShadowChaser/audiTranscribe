import { useState } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { copyToClipboard, preprocessMarkdown, processConversationSummary, markdownToPDFText } from "../utils/clipboard";
import FeedCard from "../components/FeedCard";
import UploadPanel from "../components/UploadPanel";

const ImportView = ({ transcript, summary }) => {
  const [file, setFile] = useState(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [importSummary, setImportSummary] = useState("");
  const [editingTitles, setEditingTitles] = useState({});
  const [customTitles, setCustomTitles] = useState({});

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

  const getSummaryTitle = (summaryText, id, type = "import") => {
    const titleKey = `${type}_${id}`;
    return customTitles[titleKey] || generateSummaryTitle(summaryText);
  };

  const startEditingTitle = (id, type = "import") => {
    const titleKey = `${type}_${id}`;
    setEditingTitles((prev) => ({ ...prev, [titleKey]: true }));
  };

  const saveTitle = (id, newTitle, type = "import") => {
    const titleKey = `${type}_${id}`;
    setCustomTitles((prev) => ({
      ...prev,
      [titleKey]: newTitle.trim() || generateSummaryTitle(""),
    }));
    setEditingTitles((prev) => ({ ...prev, [titleKey]: false }));
    toast.success("Title updated!");
  };

  const cancelEditingTitle = (id, type = "import") => {
    const titleKey = `${type}_${id}`;
    setEditingTitles((prev) => ({ ...prev, [titleKey]: false }));
  };

  // Export functionality
  const exportToPDF = async (summaryText, title) => {
    try {
      // Process the summary text using the same functions as clipboard.js
      let processedText = summaryText;
      
      // Check if it's a conversation summary and process accordingly
      if (
        summaryText.includes("- The assistant") ||
        summaryText.includes("- The user") ||
        summaryText.includes("Summary of the conversation") ||
        summaryText.match(/^- .*$/m) // Any line starting with "- "
      ) {
        processedText = processConversationSummary(summaryText);
      } else {
        processedText = preprocessMarkdown(summaryText);
      }
      
      // Convert markdown to properly formatted plain text for PDF
      processedText = markdownToPDFText(processedText);
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
  
      // Add title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, margin, 20);
  
      // Add the main summary text with proper wrapping
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const splitText = pdf.splitTextToSize(processedText, contentWidth);
  
      // Calculate if we need a new page based on content length
      let yPosition = 30;
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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const audioTypes = [
        "audio/wav",
        "audio/mpeg",
        "audio/mp4",
        "audio/ogg",
        "audio/flac",
      ];
      if (
        audioTypes.includes(selectedFile.type) ||
        selectedFile.name.match(/\\.(wav|mp3|m4a|ogg|flac)$/i)
      ) {
        setFile(selectedFile);
        toast.success(`File "${selectedFile.name}" selected successfully!`);
      } else {
        toast.error(
          "Please select a valid audio file (wav, mp3, m4a, ogg, flac)"
        );
        setFile(null);
      }
    }
  };

  const handleTranscribe = async () => {
    const result = await transcript.transcribeFile(file);
    if (result) {
      setCurrentTranscript(result);
      setImportSummary("");
      toast.success("File transcribed successfully!");
    }
  };

  const clearImport = () => {
    setFile(null);
    setCurrentTranscript("");
    setImportSummary("");
    toast.success("Import cleared!");
  };

  return (
    <>
      {/* Upload Panel */}
      <UploadPanel
        file={file}
        onFileChange={handleFileChange}
        onTranscribe={handleTranscribe}
        loading={transcript.loading}
      />

      {/* Clear Import Button */}
      {(file || currentTranscript) && (
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button
            onClick={clearImport}
            className="btn btn-secondary btn-sm"
            style={{ color: "#b91c1c" }}
            title="Delete imported file/transcript"
          >
            🗑️ Clear Import
          </button>
        </div>
      )}

      {/* Transcript Card */}
      {currentTranscript && (
        <FeedCard
          avatar="📥"
          title="Import Transcript"
          subtitle={file ? `Imported: ${file.name}` : "Imported file"}
          fullText={currentTranscript}
          metadata={[
            file ? `${(file.size / 1024).toFixed(1)} KB` : undefined,
            new Date().toLocaleString(),
          ].filter(Boolean)}
          thumbnail={
            <div
              style={{
                background: "#e0f2fe",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "#0369a1",
              }}
            >
              📄
            </div>
          }
          actions={[
            <button
              key="copy"
              onClick={() => copyToClipboard(currentTranscript)}
              className="btn btn-outline btn-sm"
              title="Copy transcript to clipboard"
            >
              📋 Copy
            </button>,
            <button
              key="delete"
              onClick={clearImport}
              className="btn btn-secondary btn-sm"
              style={{ color: "#b91c1c" }}
              title="Delete imported transcript"
            >
              🗑️ Delete
            </button>,
            <button
              key="summarize"
              onClick={async () => {
                const result = await summary.summarizeText(
                  currentTranscript,
                  false
                );
                if (result) {
                  setImportSummary(result);
                  toast.success("Summary generated successfully!");
                }
              }}
              className="btn btn-primary btn-sm"
              disabled={summary.summarizing}
              title="Generate summary"
            >
              {summary.summarizing ? "⏳" : "🧠"} Summarize
            </button>,
            <button
              key="study"
              onClick={async () => {
                const result = await summary.summarizeText(
                  currentTranscript,
                  true
                );
                if (result) {
                  setImportSummary(result);
                  toast.success("Study notes generated successfully!");
                }
              }}
              className="btn btn-secondary btn-sm"
              disabled={summary.summarizing}
              title="Generate study notes"
            >
              {summary.summarizing ? "⏳" : "📘"} Study Notes
            </button>,
          ]}
        />
      )}

      {/* Summary Card */}
      {importSummary && (
        <FeedCard
          avatar="🧠"
          title={
            editingTitles["import_summary"] ? (
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  type="text"
                  defaultValue={getSummaryTitle(importSummary, "summary")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveTitle("summary", e.target.value);
                    } else if (e.key === "Escape") {
                      cancelEditingTitle("summary");
                    }
                  }}
                  onBlur={(e) => saveTitle("summary", e.target.value)}
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
                  onClick={() => cancelEditingTitle("summary")}
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
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <span>{getSummaryTitle(importSummary, "summary")}</span>
                <button
                  onClick={() => startEditingTitle("summary")}
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
          subtitle="Concise study notes"
          fullText={importSummary}
          actions={[
            <button
              key="copy"
              onClick={() => copyToClipboard(importSummary)}
              className="btn btn-outline btn-sm"
              title="Copy summary to clipboard"
            >
              📋 Copy
            </button>,
            <button
              key="pdf"
              onClick={() =>
                exportToPDF(
                  importSummary,
                  getSummaryTitle(importSummary, "summary")
                )
              }
              className="btn btn-primary btn-sm"
              title="Export to PDF"
            >
              📄 PDF
            </button>,
            <button
              key="clear"
              onClick={() => setImportSummary("")}
              className="btn btn-secondary btn-sm"
              style={{ color: "#b91c1c" }}
              title="Clear this summary"
            >
              🗑️ Clear
            </button>,
          ]}
        />
      )}
    </>
  );
};

export default ImportView;
