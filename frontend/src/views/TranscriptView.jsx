import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import FeedCard from "../components/FeedCard";

const TranscriptView = ({ recording, transcript, summary }) => {
  const [savedRecordings, setSavedRecordings] = useState([]);
  const [editingTitles, setEditingTitles] = useState({});
  const [customTitles, setCustomTitles] = useState({});

  useEffect(() => {
    // Only fetch saved recordings once when component mounts (page first loads)
    console.log('🔄 Fetching saved recordings on page load...');
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

  // Helper functions to handle markdown to HTML conversion
  const markdownToHtml = (markdown) => {
    // First, handle headers with proper spacing
    let html = markdown
      // Headers with proper spacing
      .replace(/^#\s+(.+?)(\n|$)/gm, '<h1 style="font-size: 1.5em; font-weight: bold; margin: 1em 0 0.5em 0;">$1</h1>\n')
      .replace(/^##\s+(.+?)(\n|$)/gm, '<h2 style="font-size: 1.3em; font-weight: bold; margin: 1em 0 0.5em 0;">$1</h2>\n')
      .replace(/^###\s+(.+?)(\n|$)/gm, '<h3 style="font-size: 1.1em; font-weight: bold; margin: 1em 0 0.5em 0;">$1</h3>\n')
      
      // Bold and italic with proper spacing
      .replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*([^*]+?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
      .replace(/\*([^*\n]+?)\*/g, '<em style="font-style: italic;">$1</em>')
      .replace(/__([^_]+?)__/g, '<strong style="font-weight: bold;">$1</strong>')
      .replace(/_([^_\n]+?)_/g, '<em style="font-style: italic;">$1</em>')
      
      // Code blocks with proper formatting
      .replace(/```([\s\S]*?)```/g, '<pre style="background: #f4f4f4; padding: 1em; border-radius: 4px; overflow-x: auto;"><code style="font-family: monospace;">$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace;">$1</code>')
      
      // Lists with proper indentation
      .replace(/^\*\s+(.+?)(?=\n\s*\n|$)/gm, '<li style="margin-bottom: 0.5em;">$1</li>')
      .replace(/^\d+\.\s+(.+?)(?=\n\s*\n|$)/gm, '<li style="margin-bottom: 0.5em;">$1</li>')
      
      // Links and images
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" style="max-width: 100%;">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3b82f6; text-decoration: underline;">$1</a>');

    // Handle lists by wrapping consecutive <li> in <ul> or <ol>
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, function(match) {
      // Check if it's an ordered list (starts with number)
      if (/^<li[^>]*>\s*\d+\./.test(match)) {
        return '<ol style="padding-left: 2em; margin: 1em 0;">' + match + '</ol>';
      } else {
        return '<ul style="padding-left: 2em; margin: 1em 0; list-style-type: disc;">' + match + '</ul>';
      }
    });

    // Handle paragraphs - split by double newlines
    html = html.split('\n\n').map(paragraph => {
      // Skip if already wrapped in a block element
      if (/^<(h[1-6]|ul|ol|li|p|div|pre|blockquote|hr)/i.test(paragraph.trim()) || 
          /<\/(h[1-6]|ul|ol|li|p|div|pre|blockquote|hr)>/i.test(paragraph.trim())) {
        return paragraph;
      }
      // Skip empty paragraphs
      if (!paragraph.trim()) return '';
      return `<p style="margin: 1em 0; line-height: 1.6;">${paragraph.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
  };

  const copyToClipboard = async (content) => {
    try {
      // Check if content is markdown (contains markdown syntax)
      const isMarkdown = /[#*_`[]]/.test(content);
      
      if (isMarkdown) {
        // Convert markdown to HTML
        const html = markdownToHtml(content);
        
        // Try to copy as rich text (HTML)
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          const blob = new Blob([html], { type: 'text/html' });
          const textBlob = new Blob([content], { type: 'text/plain' });
          const data = new ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob
          });
          await navigator.clipboard.write([data]);
          toast.success("Copied to clipboard with formatting!");
          return;
        }
      }
      
      // Fallback to plain text
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard!");
      
    } catch (err) {
      console.error("Failed to copy:", err);
      // Last resort: show the text in a prompt for manual copy
      try {
        window.prompt("Copy to clipboard: Ctrl+C, Enter", content);
        toast.info("Please copy the text from the prompt");
      } catch (e) {
        console.error("Failed to show copy prompt:", e);
        toast.error("Failed to copy. Please select and copy manually.");
      }
    }
  };

  const clearAllRecordings = async () => {
    if (!window.confirm('Are you sure you want to delete all recordings? This action cannot be undone.')) {
      return;
    }
    
    try {
      // First, get all recording IDs
      const response = await axios.get('http://localhost:3001/recordings');
      const recordingIds = response.data.recordings.map(rec => rec._id);
      
      if (recordingIds.length === 0) {
        toast.info('No recordings found to delete');
        return;
      }
      
      // Delete all recordings
      const deleteResponse = await axios.post('http://localhost:3001/recordings/bulk-delete', {
        identifiers: recordingIds
      });
      
      if (deleteResponse.data.success) {
        // Refresh the saved recordings list
        await fetchSavedRecordings();
        toast.success(`Successfully deleted ${deleteResponse.data.results.deleted.length} recordings`);
      } else {
        throw new Error(deleteResponse.data.message || 'Failed to delete recordings');
      }
    } catch (error) {
      console.error('Error deleting recordings:', error);
      toast.error(error.response?.data?.error || 'Failed to delete recordings');
    }
  };

  const clearAllSummaries = async () => {
    try {
      // Use bulk clear endpoint for summaries
      const response = await axios.delete('http://localhost:3001/recordings/bulk-clear-summaries');
      
      if (response.data.success) {
        // Update local state to reflect cleared summaries
        setSavedRecordings((prev) => prev.map((r) => ({ ...r, summary: "" })));
        toast.success(`All summaries cleared! ${response.data.results.cleared.length} summaries removed.`);
      } else {
        throw new Error(response.data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error clearing summaries:', error);
      toast.error(error.response?.data?.error || "Failed to clear all summaries");
    }
  };

  // Set up recording completion handler on mount and cleanup
  useEffect(() => {
    const handleNewOrUpdatedRecording = async (newRecording) => {
      if (newRecording) {
        console.log("Recording completed:", newRecording); // Debug log
        
        // Show auto-save status messages and refresh saved recordings
        if (newRecording.autoSaveStatus === 'saved') {
          toast.success(`✅ Recording auto-saved to database!`);
          // Refresh saved recordings list when a new recording is successfully saved
          console.log('🔄 New recording saved, refreshing saved recordings list...');
          fetchSavedRecordings();
        } else if (newRecording.autoSaveStatus === 'failed') {
          toast.warn(`⚠️ Auto-save failed: ${newRecording.saveError || 'Unknown error'}`);
        }
      }
    };

    if (recording && recording.onRecordingComplete) {
      console.log("Setting up recording completion handler"); // Debug log
      recording.onRecordingComplete(handleNewOrUpdatedRecording);
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
          className="btn btn-outline btn-sm btn-error"
          onClick={clearAllRecordings}
          title="Permanently delete all recordings and their transcripts"
        >
          🗑️ Delete All Recordings
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={clearAllSummaries}
          title="Clear all summaries from saved recordings"
        >
          🧽 Clear All Summaries
        </button>
      </div>

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
                {!rec.hasTranscript && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Create a recording-like object for the transcript hook
                      const recordingForTranscription = {
                        audio: null, // We don't have the blob for saved recordings
                        backendFilename: rec.filename,
                        id: rec._id,
                        filename: rec.filename
                      };
                      
                      transcript.transcribeRecording(recordingForTranscription).then((result) => {
                        if (result) {
                          // Refresh the saved recordings to show the new transcript
                          fetchSavedRecordings();
                          toast.success("Recording transcribed successfully!");
                        }
                      });
                    }}
                    className="btn btn-primary btn-sm"
                    disabled={transcript.loading}
                    title="Start transcription"
                  >
                    {transcript.loading ? "⏳" : "✨"}
                  </button>
                )}
                {rec.hasTranscript && rec.transcript && (
                  <>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const result = await summary.summarizeText(rec.transcript, false);
                        if (result) {
                          // Update local state
                          setSavedRecordings((prev) =>
                            prev.map((r) =>
                              r.filename === rec.filename
                                ? { ...r, summary: result }
                                : r
                            )
                          );
                          
                          // Save to database using the recording ID
                          try {
                            await axios.post(`http://localhost:3001/recordings/${rec._id}/summary`, {
                              summary: result
                            });
                            console.log('✅ Summary saved to database for saved recording:', rec._id);
                          } catch (error) {
                            console.error('❌ Failed to save summary to database:', error);
                            toast.warn('Summary generated but failed to save to database');
                          }
                          
                          toast.success("Summary generated!");
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      disabled={summary.summarizing}
                      title="Generate summary"
                    >
                      {summary.summarizing ? "⏳" : "🧠"}
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const result = await summary.summarizeText(rec.transcript, true);
                        if (result) {
                          // Update local state
                          setSavedRecordings((prev) =>
                            prev.map((r) =>
                              r.filename === rec.filename
                                ? { ...r, summary: result }
                                : r
                            )
                          );
                          
                          // Save to database using the recording ID
                          try {
                            await axios.post(`http://localhost:3001/recordings/${rec._id}/summary`, {
                              summary: result
                            });
                            console.log('✅ Study notes saved to database for saved recording:', rec._id);
                          } catch (error) {
                            console.error('❌ Failed to save study notes to database:', error);
                            toast.warn('Study notes generated but failed to save to database');
                          }
                          
                          toast.success("Study notes generated!");
                        }
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
                      console.log('🗑️ Attempting to delete recording:', {
                        filename: rec.filename,
                        _id: rec._id,
                        fullRecord: rec
                      });
                      
                      await axios.delete(
                        `http://localhost:3001/recordings/${rec.filename}`
                      );
                      fetchSavedRecordings();
                      toast.success("Recording deleted successfully!");
                    } catch (err) {
                      console.error("Failed to delete recording:", err);
                      console.error("Error details:", {
                        status: err.response?.status,
                        data: err.response?.data,
                        url: err.config?.url
                      });
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
                    onClick={async () => {
                      // Clear from UI immediately
                      setSavedRecordings((prev) =>
                        prev.map((r) =>
                          r.filename === rec.filename
                            ? { ...r, summary: "" }
                            : r
                        )
                      );
                      
                      // Delete from database
                      try {
                        await axios.delete(`http://localhost:3001/recordings/${rec._id}/summary`);
                        console.log('✅ Summary deleted from database for saved recording:', rec._id);
                      } catch (error) {
                        console.error('❌ Failed to delete summary from database:', error);
                        toast.warn('Summary cleared from UI but failed to delete from database');
                      }
                      
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
