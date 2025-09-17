import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import RecordPanel from "./components/RecordPanel";
import UploadPanel from "./components/UploadPanel";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Modal from "./components/Modal";
import ChatInput from "./components/ChatInput";
import TranscriptView from "./views/TranscriptView";
import ImportView from "./views/ImportView";
import ChatView from "./views/ChatView";

import { useRecording } from "./hooks/useRecording";
import { useTranscript } from "./hooks/useTranscript";
import { useSummary } from "./hooks/useSummary";
import { useChat } from "./hooks/useChat";

function App() {
  // Global state
  const [currentView, setCurrentView] = useState("chat");
  const [error, setError] = useState("");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteModalText, setPasteModalText] = useState("");

  // Custom hooks
  const recording = useRecording({ enableAutoSave: true });
  const transcript = useTranscript();
  const summary = useSummary();
  const chat = useChat();

  // Set global error from any source
  useEffect(() => {
    const newError = transcript.error || summary.error || chat.error;
    setError(newError);
  }, [transcript.error, summary.error, chat.error]);

  return (
    <div className="app-shell">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <Topbar
        onImportClick={() => setCurrentView("import")}
        onRecordClick={() => setShowRecordModal(true)}
      />

      <main className="app-main">
        <div className="feed-container">
          {error && (
            <div
              className="feed-card"
              style={{
                borderColor: "#fecaca",
                background: "#fff1f2",
                color: "#b91c1c",
                marginBottom: "16px",
              }}
            >
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {currentView === "transcripts" && (
            <TranscriptView
              recording={recording}
              transcript={transcript}
              summary={summary}
            />
          )}

          {currentView === "import" && (
            <ImportView transcript={transcript} summary={summary} />
          )}

          {currentView === "chat" && <ChatView chat={chat} />}
        </div>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {currentView === "chat" && (
        <ChatInput
          onSendMessage={chat.sendMessage}
          isLoading={chat.loading}
          onAttachFile={chat.attachFile}
          onOpenPasteModal={() => setShowPasteModal(true)}
          sources={chat.sources}
          onRemoveSource={chat.removeSource}
        />
      )}

      <Modal
        open={showRecordModal}
        title="Record"
        onClose={() => setShowRecordModal(false)}
        width={720}
      >
        <RecordPanel
          isRecording={recording.isRecording}
          isPaused={recording.isPaused}
          recordingType={recording.recordingType}
          setRecordingType={recording.setRecordingType}
          startRecording={recording.startRecording}
          stopRecording={recording.stopRecording}
          pauseRecording={recording.pauseRecording}
          resumeRecording={recording.resumeRecording}
          recordTimerMs={recording.recordTimerMs}
          loading={transcript.loading}
        />
      </Modal>

      <Modal
        open={showPasteModal}
        title="Add text source"
        onClose={() => {
          setShowPasteModal(false);
          setPasteModalText("");
        }}
        width={720}
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <textarea
            rows={8}
            placeholder="Paste text to chat over..."
            value={pasteModalText}
            onChange={(e) => setPasteModalText(e.target.value)}
            style={{ width: "100%" }}
          />
          <div
            style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
          >
            <button
              className="btn btn-primary"
              disabled={!pasteModalText.trim()}
              onClick={async () => {
                const text = pasteModalText.trim();
                if (!text) return;
                const success = await chat.addTextSource(text);
                if (success) {
                  setPasteModalText("");
                  setShowPasteModal(false);
                  toast.success("Text added as source successfully!");
                } else {
                  toast.error("Failed to add text as source");
                }
              }}
            >
              Add as Source
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowPasteModal(false);
                setPasteModalText("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
