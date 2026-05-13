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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const handleTranscribe = async () => {
    const result = await transcript.transcribeFile(file);
    if (result) {
      setCurrentTranscript(result);
      setImportSummary("");
    }
  };

  const clearImport = () => {
    setFile(null);
    setCurrentTranscript("");
    setImportSummary("");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <UploadPanel
        file={file}
        onFileChange={handleFileChange}
        onTranscribe={handleTranscribe}
        loading={transcript.loading}
      />

      {currentTranscript && (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          <FeedCard
            avatar="📝"
            title="Transcription Result"
            subtitle={file?.name || "Uploaded content"}
            fullText={currentTranscript}
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => copyToClipboard(currentTranscript)}>📋 Copy</button>
                <button 
                  className="btn btn-primary btn-sm" 
                  disabled={summary.summarizing}
                  onClick={async () => {
                    const res = await summary.summarizeText(currentTranscript, 'summary');
                    if (res) setImportSummary(res);
                  }}
                >
                  {summary.summarizing ? '⏳' : '🧠'} Summarize
                </button>
                <button className="btn btn-secondary btn-sm" onClick={clearImport} style={{ color: 'var(--color-danger)' }}>🗑️ Clear</button>
              </div>
            }
          />
        </div>
      )}

      {importSummary && (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          <FeedCard
            avatar="🧠"
            title="Insights & Summary"
            subtitle="AI Analysis"
            fullText={importSummary}
            actions={
              <>
                <button className="btn btn-outline btn-sm" onClick={() => copyToClipboard(importSummary)}>📋 Copy</button>
                <button className="btn btn-primary btn-sm" onClick={() => toast.info("PDF Export available in saved transcripts")}>📄 PDF</button>
              </>
            }
          />
        </div>
      )}
    </div>
  );
};

export default ImportView;
