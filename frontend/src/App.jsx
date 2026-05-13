import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import RecordPanel from "./components/RecordPanel";
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
  const [currentView, setCurrentView] = useState("chat");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteModalText, setPasteModalText] = useState("");

  const recording = useRecording({ enableAutoSave: true });
  const transcript = useTranscript();
  const summary = useSummary();
  const chat = useChat();

  useEffect(() => {
    const error = transcript.error || summary.error || chat.error;
    if (error) toast.error(error);
  }, [transcript.error, summary.error, chat.error]);

  return (
    <div className="app-shell">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} chat={chat} />
      
      <Topbar
        currentView={currentView}
        onImportClick={() => setCurrentView("import")}
        onRecordClick={() => setShowRecordModal(true)}
      />

      <main className="app-main">
        <div className="feed-container">
          {currentView === "transcripts" && (
            <TranscriptView recording={recording} transcript={transcript} summary={summary} />
          )}

          {currentView === "import" && (
            <ImportView transcript={transcript} summary={summary} />
          )}

          {currentView === "chat" && <ChatView chat={chat} />}
        </div>
      </main>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme="dark"
        hideProgressBar
        newestOnTop
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
        title="Capture New Session"
        onClose={() => setShowRecordModal(false)}
        width={560}
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
        title="Add Knowledge Source"
        onClose={() => {
          setShowPasteModal(false);
          setPasteModalText("");
        }}
        width={560}
      >
        <div style={{ display: "grid", gap: "20px" }}>
          <textarea
            rows={10}
            placeholder="Paste text, notes, or articles to chat over..."
            value={pasteModalText}
            onChange={(e) => setPasteModalText(e.target.value)}
            style={{ width: "100%", background: 'var(--bg-input)' }}
          />
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setShowPasteModal(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={!pasteModalText.trim()}
              onClick={async () => {
                const text = pasteModalText.trim();
                if (await chat.addTextSource(text)) {
                  setPasteModalText("");
                  setShowPasteModal(false);
                  toast.success("Source added!");
                }
              }}
            >
              Add to Context
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
