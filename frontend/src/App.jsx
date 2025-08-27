import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import RecordPanel from './components/RecordPanel.jsx';
import UploadPanel from './components/UploadPanel.jsx';
import SavedRecordings from './components/SavedRecordings.jsx';
import TranscriptCard from './components/TranscriptCard.jsx';
import SummaryCard from './components/SummaryCard.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Modal from './components/Modal.jsx';
import FeedCard from './components/FeedCard.jsx';
import ChatInput from './components/ChatInput.jsx';

function App() {
  // Study-focused summarization template
  const STUDY_NOTES_STYLE = `You are an assistant that creates clear, structured study notes.\n\nInput: A transcript of a lecture, book chapter, or video.\n\nOutput: Summarized notes that are concise, organized, and easy to revise later.\n\nFormatting Rules:\n- Use short bullet points, not long paragraphs.\n- Capture only the key ideas, arguments, or facts.\n- Highlight definitions, formulas, or important terms in **bold**.\n- If a process or sequence is explained, number the steps (1, 2, 3...).\n- For comparisons, use a table format.\n- Add a short “Key Takeaways” section at the end with the 3–5 most important insights.\n\nKeep the language simple and direct.`;
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [importSummary, setImportSummary] = useState(''); // For Import view only
  const [importSummarizing, setImportSummarizing] = useState(false);
  // Removed unused transcriptsSummary and transcriptsSummarizing states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTimerMs, setRecordTimerMs] = useState(0);
  const [recordings, setRecordings] = useState([]); // Array to store multiple recordings
  const [savedRecordings, setSavedRecordings] = useState([]); // Array to store saved recordings from backend
  const [recordingType, setRecordingType] = useState('microphone'); // 'microphone' or 'system'
  const [showImportModal, setShowImportModal] = useState(false); // legacy; import now uses its own tab
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'transcripts'
  const [sources, setSources] = useState([]); // [{id, name, type}]
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteModalText, setPasteModalText] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedAccumulatedRef = useRef(0);

  // Session recordings are kept in-memory only (no localStorage to avoid large payloads)

  // Fetch saved recordings on component mount
  useEffect(() => {
    fetchSavedRecordings();
  }, []);

  const fetchSavedRecordings = async () => {
    try {
      const response = await axios.get('http://localhost:3001/recordings');
      setSavedRecordings(response.data.recordings);
    } catch (err) {
      console.error('Failed to fetch saved recordings:', err);
    }
  };

  // Transcripts management helpers
  const clearAllTranscripts = () => {
    setRecordings([]);
    toast.success('All transcripts cleared!');
  };

  const clearRecordingSummary = (recordingId) => {
    setRecordings(prev => prev.map(r => r.id === recordingId ? { ...r, summary: '' } : r));
    toast.success('Summary cleared!');
  };

  const clearSavedRecordingSummary = (filename) => {
    setSavedRecordings(prev => prev.map(r => r.filename === filename ? { ...r, summary: '' } : r));
    toast.success('Summary cleared!');
  };

  const clearAllSummaries = () => {
    setRecordings(prev => prev.map(r => ({ ...r, summary: '' })));
    setSavedRecordings(prev => prev.map(r => ({ ...r, summary: '' })));
    toast.success('All summaries cleared!');
  };

  const clearImportSummary = () => {
    setImportSummary('');
    toast.success('Import summary cleared!');
  };

  // Clear current imported file/transcript/summary
  const clearImportedTranscript = () => {
    setFile(null);
    setTranscript('');
    setImportSummary('');
    toast.success('Import cleared!');
  };

  // Ingest: attach file for chat
  const attachFileToChat = async (fileObj) => {
    try {
      const form = new FormData();
      form.append('file', fileObj);
      const res = await axios.post('http://localhost:3001/ingest/file', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
      const { id, doc } = res.data;
      setSources(prev => [...prev, { id, name: doc.name, type: doc.type }]);
      setError('');
      toast.success(`File "${doc.name}" attached successfully!`);
    } catch (e) {
      console.error('Attach file error:', e);
      const errorMsg = e.response?.data?.error || 'Failed to attach file for chat';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Ingest: paste text for chat
  const pasteTextToChat = async (text) => {
    try {
      const res = await axios.post('http://localhost:3001/ingest/text', { text }, { timeout: 120000 });
      const { id, doc } = res.data;
      setSources(prev => [...prev, { id, name: doc.name, type: doc.type }]);
      setError('');
      toast.success('Text added as source successfully!');
    } catch (e) {
      console.error('Paste text error:', e);
      const errorMsg = e.response?.data?.error || 'Failed to add pasted text for chat';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const removeSource = async (id) => {
    try {
      setSources(prev => prev.filter(s => s.id !== id));
      // Best-effort delete on backend (ok if it fails)
      await axios.delete(`http://localhost:3001/ingest/${id}`).catch(() => {});
      toast.success('Source removed successfully!');
    } catch (e) {
      // no-op: removing source locally is sufficient
      console.warn('Failed to remove source on backend:', e?.message || e);
      toast.error('Failed to remove source');
    }
  };

  // Internal helper to call backend summarize
  const _summarizeText = async (text, style = '') => {
    const res = await axios.post('http://localhost:3001/summarize', { text, style }, { timeout: 120000 });
    return res.data.summary || '';
  };

  // Chat with local AI
  const handleChatMessage = async (message) => {
    setChatLoading(true);
    try {
      // Add user message to chat
      const userMessage = { role: 'user', content: message, timestamp: new Date() };
      setChatMessages(prev => [...prev, userMessage]);

      // Build context from available transcripts
      const context = [
        transcript ? `Current transcript: ${transcript}` : '',
        recordings.length > 0 ? `Session recordings: ${recordings.map(r => r.transcript || 'No transcript').join('; ')}` : '',
        savedRecordings.length > 0 ? `Saved recordings: ${savedRecordings.map(r => r.transcript || 'No transcript').join('; ')}` : ''
      ].filter(Boolean).join('\n\n');
      
      // Send to dedicated chat endpoint
      const response = await axios.post('http://localhost:3001/chat', { 
        message,
        context,
        docIds: sources.map(s => s.id)
      }, { timeout: 60000 });
      
      const aiMessage = { role: 'assistant', content: response.data.response, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMessage]);
      
      // Show AI response as feed card
      setError(''); // Clear any previous errors
      
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = { role: 'assistant', content: 'Sorry, I\'m having trouble connecting to the AI. Please make sure Ollama is running.', timestamp: new Date() };
      setChatMessages(prev => [...prev, errorMessage]);
      setError('Chat service unavailable. Please ensure Ollama is running.');
    } finally {
      setChatLoading(false);
    }
  };

  // Summarize current top-level transcript using backend /summarize (Ollama) - Import view
  const summarizeImportTranscript = async (style = '') => {
    if (!transcript || transcript.trim() === '') {
      setError('No transcript to summarize');
      return;
    }
    try {
      setImportSummarizing(true);
      setError('');
      const s = await _summarizeText(transcript, style);
      setImportSummary(s); // Import view summary
      toast.success('Summary generated successfully!');
    } catch (err) {
      console.error('Summarization error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to summarize. Ensure Ollama is running (port 11434) and model is available.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setImportSummarizing(false);
    }
  };

  // Summarize a specific in-session recording's transcript
  const summarizeRecordingTranscript = async (recordingId, style = '') => {
    const rec = recordings.find(r => r.id === recordingId);
    if (!rec || !rec.transcript || rec.transcript === 'Transcribing...') return;
    try {
      // mark summarizing state on this recording
      setRecordings(prev => prev.map(r => r.id === recordingId ? { ...r, summarizing: true } : r));
      const s = await _summarizeText(rec.transcript, style);
      setRecordings(prev => prev.map(r => r.id === recordingId ? { ...r, summary: s, summarizing: false } : r));
      toast.success('Recording summary generated!');
    } catch (err) {
      console.error('Summarization error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to summarize recording.';
      setError(errorMsg);
      toast.error(errorMsg);
      setRecordings(prev => prev.map(r => r.id === recordingId ? { ...r, summarizing: false } : r));
    }
  };

  // Summarize a saved recording's transcript
  const summarizeSavedRecording = async (filename, style = '') => {
    const item = savedRecordings.find(r => r.filename === filename);
    if (!item || !item.hasTranscript || !item.transcript) return;
    try {
      setSavedRecordings(prev => prev.map(r => r.filename === filename ? { ...r, summarizing: true } : r));
      const s = await _summarizeText(item.transcript, style);
      setSavedRecordings(prev => prev.map(r => r.filename === filename ? { ...r, summary: s, summarizing: false } : r));
      toast.success('Saved recording summary generated!');
    } catch (err) {
      console.error('Summarization error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to summarize saved recording.';
      setError(errorMsg);
      toast.error(errorMsg);
      setSavedRecordings(prev => prev.map(r => r.filename === filename ? { ...r, summarizing: false } : r));
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const audioTypes = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/flac"];
      if (audioTypes.includes(selectedFile.type) || selectedFile.name.match(/\.(wav|mp3|m4a|ogg|flac)$/i)) {
        setFile(selectedFile);
        setError("");
        // Ensure user is on Import view when a file is chosen
        setCurrentView('import');
        toast.success(`File "${selectedFile.name}" selected successfully!`);
      } else {
        const errorMsg = "Please select a valid audio file (wav, mp3, m4a, ogg, flac)";
        setError(errorMsg);
        setFile(null);
        toast.error(errorMsg);
      }
    }
  };

  const startRecording = async (type = recordingType) => {
    try {
      setError('');
      console.log('Starting recording with type:', type);
      
      let stream;
      if (type === 'system') {
        console.log('Requesting system audio with getDisplayMedia...');
        // Request system audio capture with screen sharing popup
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true, // Need video: true to trigger screen sharing dialog
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
        
        console.log('Got display media stream:', stream);
        console.log('Audio tracks:', stream.getAudioTracks());
        console.log('Video tracks:', stream.getVideoTracks());
        
        // Remove video track if we only want audio
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach(track => {
          console.log('Stopping video track:', track);
          track.stop();
          stream.removeTrack(track);
        });
      } else {
        // Request microphone access
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 44100,
            channelCount: 2
          }
        });
      }

      setIsRecording(true);
      setIsPaused(false);
      setRecordTimerMs(0);
      pausedAccumulatedRef.current = 0;
      startTimeRef.current = Date.now();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordTimerMs(pausedAccumulatedRef.current + (Date.now() - startTimeRef.current));
      }, 200);
      audioChunksRef.current = [];

      const options = { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`Audio chunk captured: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const newRecording = {
          id: Date.now(),
          blob: audioBlob,
          url: audioUrl,
          type: type,
          timestamp: new Date(),
          size: audioBlob.size,
          transcript: '',
          backendFilename: null // Will be set after upload
        };
        setRecordings(prev => [...prev, newRecording]);
        console.log(`Recording stopped. Total size: ${audioBlob.size} bytes`);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setRecordTimerMs(0);
        setIsPaused(false);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording error: ' + event.error.message);
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setIsPaused(false);
        setRecordTimerMs(0);
      };

      // Start recording with continuous data collection
      mediaRecorder.start(1000); // Collect data every second for continuous listening
      console.log(`${type === 'system' ? 'System audio' : 'Microphone'} recording started`);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError') {
        if (type === 'system') {
          setError('System audio access denied. Please allow screen sharing with audio to record system sounds.');
        } else {
          setError('Microphone access denied. Please allow microphone permissions to record audio.');
        }
      } else if (err.name === 'NotSupportedError') {
        if (type === 'system') {
          setError('System audio recording not supported in this browser. Try Chrome or Edge.');
        } else {
          setError('Audio recording not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
        }
      } else {
        setError('Failed to start recording: ' + err.message);
      }
      setIsRecording(false);
    }
  };

  // (Unused _createWAVFile helper removed earlier to reduce lint warnings)

  // Copy transcript to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy to clipboard. Please select and copy manually.');
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (!mediaRecorderRef.current || !isRecording || isPaused) return;
    try {
      mediaRecorderRef.current.pause();
      pausedAccumulatedRef.current += Date.now() - startTimeRef.current;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsPaused(true);
    } catch (e) {
      console.error('Pause error:', e);
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (!mediaRecorderRef.current || !isRecording || !isPaused) return;
    try {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordTimerMs(pausedAccumulatedRef.current + (Date.now() - startTimeRef.current));
      }, 200);
      setIsPaused(false);
    } catch (e) {
      console.error('Resume error:', e);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks to release the microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        track.stop();
      });
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsPaused(false);
      setRecordTimerMs(0);
    }
  };

  // Transcribe a specific recording
  const transcribeRecording = async (recordingId) => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) {
      setError('Recording not found');
      return;
    }

    setLoading(true);
    setError('');
    
    // Update the specific recording's transcript status
    setRecordings(prev => prev.map(r => 
      r.id === recordingId ? { ...r, transcript: 'Transcribing...' } : r
    ));

    const formData = new FormData();
    formData.append('audio', recording.blob, 'recording.webm');

    try {
      const response = await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.transcriptFile) {
        const transcriptResponse = await axios.get(`http://localhost:3001/transcript/${response.data.transcriptFile.split('/').pop()}`);
        const backendFilename = response.data.transcriptFile.split('/').pop().replace('.txt', '');
        // Update the specific recording's transcript and backend filename
        setRecordings(prev => prev.map(r => 
          r.id === recordingId ? { 
            ...r, 
            transcript: transcriptResponse.data.content,
            backendFilename: backendFilename
          } : r
        ));
        toast.success('Recording transcribed successfully!');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      const errorMsg = 'Failed to transcribe audio: ' + (err.response?.data?.error || err.message);
      setError(errorMsg);
      toast.error(errorMsg);
      // Update recording with error state
      setRecordings(prev => prev.map(r => 
        r.id === recordingId ? { ...r, transcript: 'Transcription failed' } : r
      ));
    } finally {
      setLoading(false);
    }
  };

  // Delete recording and backend files
  const deleteRecording = async (recordingId) => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) return;

    // Remove from frontend immediately
    setRecordings(prev => prev.filter(r => r.id !== recordingId));
    toast.success('Recording deleted successfully!');

    // Clean up backend files if they exist
    if (recording.backendFilename) {
      try {
        await axios.delete(`http://localhost:3001/recording/${recording.backendFilename}`);
        console.log(`Backend files deleted for: ${recording.backendFilename}`);
      } catch (err) {
        console.error('Failed to delete backend files:', err);
        // Don't show error to user since frontend cleanup already happened
      }
    }

    // Clean up blob URL to prevent memory leaks
    if (recording.url) {
      URL.revokeObjectURL(recording.url);
    }

    // Refresh saved recordings list
    fetchSavedRecordings();
  };

  // Delete saved recording from backend
  const deleteSavedRecording = async (filename) => {
    try {
      await axios.delete(`http://localhost:3001/recording/${filename}`);
      fetchSavedRecordings(); // Refresh the list
      toast.success('Saved recording deleted successfully!');
    } catch (err) {
      console.error('Failed to delete saved recording:', err);
      const errorMsg = 'Failed to delete recording';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const transcribeFile = async () => {
    if (!file) {
      setError("Please select an audio file first");
      return;
    }

    setLoading(true);
    setError("");
    setTranscript("");
    // Make sure we are on the Import view during import flow
    setCurrentView('import');

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const uploadRes = await axios.post('http://localhost:3001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000
      });

      const transcriptRes = await axios.get(`http://localhost:3001/transcript/${uploadRes.data.transcriptFile.split('/').pop()}`, {
        timeout: 300000
      });
      
      setTranscript(transcriptRes.data.content);
      setImportSummary(''); // clear previous import summary
      toast.success('File transcribed successfully!');
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg = err.response?.data?.error || "Failed to transcribe audio. Make sure the backend is running.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otter-shell">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <Topbar 
        onImportClick={() => setCurrentView('import')}
        onRecordClick={() => setShowRecordModal(true)}
      />
      <main className="otter-main">
        <div className="feed-container">
          {/* Error Message */}
          {error && (
            <div className="feed-card" style={{borderColor: '#fecaca', background: '#fff1f2', color: '#b91c1c', marginBottom: '16px'}}>
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {currentView === 'transcripts' && (
            <>
              {/* Toolbar for transcripts management */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
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
              {/* In-session recordings as feed cards */}
              {recordings.map((recording, index) => (
                <>
                  <FeedCard
                    key={recording.id}
                    avatar={recording.type === 'system' ? '🔊' : '🎤'}
                    title={`Recording #${recordings.length - index}`}
                    subtitle={recording.timestamp.toLocaleTimeString()}
                    fullText={recording.transcript && recording.transcript !== 'Transcribing...' ? recording.transcript : undefined}
                    snippet={(!recording.transcript || recording.transcript === 'Transcribing...')
                      ? (recording.transcript === 'Transcribing...' ? 'Transcribing audio...' : 'Click to transcribe')
                      : undefined}
                    metadata={[
                      `${(recording.size / 1024).toFixed(1)} KB`,
                      recording.type === 'system' ? 'System Audio' : 'Microphone'
                    ]}
                    thumbnail={
                      <audio controls src={recording.url} style={{width: '100%', height: '32px'}} />
                    }
                    actions={
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); transcribeRecording(recording.id); }}
                          className="btn btn-primary btn-sm"
                          disabled={loading}
                          title={recording.transcript === 'Transcribing...' ? 'Transcribing audio...' : 
                                 recording.transcript && recording.transcript !== '' ? 'Transcription complete' : 'Start transcription'}
                        >
                          {recording.transcript === 'Transcribing...' ? '⏳' : 
                           recording.transcript && recording.transcript !== '' ? '✅' : '✨'}
                        </button>
                        {recording.transcript && recording.transcript !== '' && recording.transcript !== 'Transcribing...' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); summarizeRecordingTranscript(recording.id); }}
                              className="btn btn-secondary btn-sm"
                              disabled={recording.summarizing}
                              title="Generic summary"
                            >
                              {recording.summarizing ? '⏳' : '🧠'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); summarizeRecordingTranscript(recording.id, STUDY_NOTES_STYLE); }}
                              className="btn btn-secondary btn-sm"
                              disabled={recording.summarizing}
                              title="Study Notes"
                            >
                              {recording.summarizing ? '⏳' : '📘'}
                            </button>
                          </>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteRecording(recording.id); }}
                          className="btn btn-secondary btn-sm"
                          style={{color: '#b91c1c'}}
                          title="Delete this recording"
                        >
                          🗑️
                        </button>
                      </>
                    }
                  />
                  {recording.summary && (
                    <FeedCard
                      avatar="🧠"
                      title={`Summary for Recording #${recordings.length - index}`}
                      subtitle="Concise notes"
                      fullText={recording.summary}
                      actions={
                        <>
                          <button 
                            onClick={() => copyToClipboard(recording.summary)}
                            className="btn btn-outline btn-sm"
                            title="Copy summary to clipboard"
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={() => clearRecordingSummary(recording.id)}
                            className="btn btn-secondary btn-sm"
                            style={{color: '#b91c1c'}}
                            title="Clear this summary"
                          >
                            🗑️ Clear
                          </button>
                        </>
                      }
                    />
                  )}
                </>
              ))}

              {/* Saved Recordings as feed cards */}
              {savedRecordings.map((recording) => (
                <>
                  <FeedCard
                    key={recording.filename}
                    avatar="📁"
                    title={recording.filename || 'Saved Recording'}
                    subtitle={`${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m • ${Math.floor(Math.random() * 60)} minutes • General`}
                    fullText={recording.transcript || undefined}
                    snippet={!recording.transcript ? 'No transcript available for this recording' : undefined}
                    metadata={[
                      `${(recording.size / 1024).toFixed(1)} KB`,
                      new Date(recording.created).toLocaleDateString()
                    ]}
                    thumbnail={
                      <div style={{background: '#e0e7ff', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#3730a3'}}>
                        📄 {Math.floor(Math.random() * 10)}
                      </div>
                    }
                    actions={
                      <>
                        {recording.hasTranscript && recording.transcript && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); summarizeSavedRecording(recording.filename); }}
                              className="btn btn-secondary btn-sm"
                              disabled={recording.summarizing}
                              title="Generic summary"
                            >
                              {recording.summarizing ? '⏳' : '🧠'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); summarizeSavedRecording(recording.filename, STUDY_NOTES_STYLE); }}
                              className="btn btn-secondary btn-sm"
                              disabled={recording.summarizing}
                              title="Study Notes"
                            >
                              {recording.summarizing ? '⏳' : '📘'}
                            </button>
                          </>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteSavedRecording(recording.filename); }}
                          className="btn btn-secondary btn-sm"
                          style={{color: '#b91c1c'}}
                          title="Delete this saved recording"
                        >
                          🗑️
                        </button>
                      </>
                    }
                  />
                  {recording.summary && (
                    <FeedCard
                      avatar="🧠"
                      title={`Summary for ${recording.filename}`}
                      subtitle="Concise notes"
                      fullText={recording.summary}
                      actions={
                        <>
                          <button 
                            onClick={() => copyToClipboard(recording.summary)}
                            className="btn btn-outline btn-sm"
                            title="Copy summary to clipboard"
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={() => clearSavedRecordingSummary(recording.filename)}
                            className="btn btn-secondary btn-sm"
                            style={{color: '#b91c1c'}}
                            title="Clear this summary"
                          >
                            🗑️ Clear
                          </button>
                        </>
                      }
                    />
                  )}
                </>
              ))}

              

              
            </>
          )}

          {currentView === 'import' && (
            <>
              {/* Upload panel for importing audio and transcribing */}
              <UploadPanel 
                file={file}
                onFileChange={handleFileChange}
                onTranscribe={transcribeFile}
                loading={loading}
              />

              {/* Quick clear of current import */}
              {(file || transcript) && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={clearImportedTranscript}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#b91c1c' }}
                    title="Delete imported file/transcript"
                  >
                    🗑️ Clear Import
                  </button>
                </div>
              )}

              {/* Import Transcript as feed card */}
              {transcript && transcript !== 'Transcribing...' && (
                <FeedCard
                  avatar="📥"
                  title="Import Transcript"
                  subtitle={file ? `Imported: ${file.name}` : 'Imported file'}
                  fullText={transcript}
                  metadata={[
                    file ? `${(file.size / 1024).toFixed(1)} KB` : undefined,
                    new Date().toLocaleString()
                  ].filter(Boolean)}
                  thumbnail={
                    <div style={{background: '#e0f2fe', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#0369a1'}}>
                      📄
                    </div>
                  }
                  actions={
                    <>
                      <button 
                        onClick={() => copyToClipboard(transcript)}
                        className="btn btn-outline btn-sm"
                        title="Copy transcript to clipboard"
                      >
                        📋 Copy
                      </button>
                      <button 
                        onClick={clearImportedTranscript}
                        className="btn btn-secondary btn-sm"
                        style={{color: '#b91c1c'}}
                        title="Delete imported transcript"
                      >
                        🗑️ Delete
                      </button>
                      <button
                        onClick={() => summarizeImportTranscript()}
                        className="btn btn-primary btn-sm"
                        disabled={importSummarizing}
                        title="Generic summary"
                      >
                        {importSummarizing ? '⏳' : '🧠'} Summarize
                      </button>
                      <button
                        onClick={() => summarizeImportTranscript(STUDY_NOTES_STYLE)}
                        className="btn btn-secondary btn-sm"
                        disabled={importSummarizing}
                        title="Study Notes"
                      >
                        {importSummarizing ? '⏳' : '📘'} Study Notes
                      </button>
                    </>
                  }
                />
              )}

              {/* Show summary as feed card in Import view */}
              {importSummary && (
                <FeedCard
                  avatar="🧠"
                  title="Summary Results"
                  subtitle="Concise study notes"
                  fullText={importSummary}
                  actions={
                    <>
                      <button 
                        onClick={() => copyToClipboard(importSummary)}
                        className="btn btn-outline btn-sm"
                        title="Copy summary to clipboard"
                      >
                        📋 Copy
                      </button>
                      <button 
                        onClick={clearImportSummary}
                        className="btn btn-secondary btn-sm"
                        style={{color: '#b91c1c'}}
                        title="Clear summary"
                      >
                        🗑️ Clear
                      </button>
                    </>
                  }
                />
              )}
            </>
          )}

          {currentView === 'chat' && (
            <>
              {/* Show chat messages as feed cards */}
              {chatMessages.map((msg, index) => (
                <FeedCard
                  key={index}
                  avatar={msg.role === 'user' ? '👤' : '🤖'}
                  title={msg.role === 'user' ? 'You' : 'Scribe AI'}
                  subtitle={msg.timestamp.toLocaleTimeString()}
                  fullText={msg.content}
                  actions={
                    <button 
                      onClick={() => copyToClipboard(msg.content)}
                      className="btn btn-outline btn-sm"
                      title="Copy message to clipboard"
                    >
                      📋 Copy
                    </button>
                  }
                />
              ))}

              {/* Shimmer loader while waiting for AI response */}
              {chatLoading && (
                <div className="feed-card-item" aria-busy="true" aria-live="polite">
                  <div className="feed-card-avatar skeleton skeleton-avatar" />
                  <div className="feed-card-content">
                    <div className="feed-card-header">
                      <div className="feed-card-title-section">
                        <div className="skeleton skeleton-title" />
                        <div className="skeleton skeleton-subtitle" />
                      </div>
                      <div className="feed-card-metadata">
                        <span className="skeleton skeleton-meta" />
                        <span className="skeleton skeleton-meta" />
                      </div>
                    </div>
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line sm" />
                    <div className="feed-card-actions">
                      <div className="skeleton skeleton-btn" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Toast Container for notifications */}
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

      {/* Bottom chat input - only in Chat view */}
      {currentView === 'chat' && (
        <ChatInput 
          onGetStarted={() => setShowRecordModal(true)} 
          onSendMessage={handleChatMessage}
          isLoading={chatLoading}
          onAttachFile={attachFileToChat}
          onOpenPasteModal={() => setShowPasteModal(true)}
          sources={sources}
          onRemoveSource={removeSource}
        />
      )}

      {/* Import Modal */}
      <Modal open={showImportModal} title="Import audio" onClose={() => setShowImportModal(false)} width={720}>
        <UploadPanel 
          file={file}
          onFileChange={handleFileChange}
          onTranscribe={async () => { await transcribeFile(); setShowImportModal(false); }}
          loading={loading}
        />
      </Modal>

      {/* Paste Text as Source Modal */}
      <Modal open={showPasteModal} title="Add text source" onClose={() => { setShowPasteModal(false); setPasteModalText(''); }} width={720}>
        <div style={{display: 'grid', gap: '12px'}}>
          <textarea
            rows={8}
            placeholder="Paste text to chat over..."
            value={pasteModalText}
            onChange={(e) => setPasteModalText(e.target.value)}
            style={{width: '100%'}}
          />
          <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
            <button
              className="btn btn-primary"
              disabled={!pasteModalText.trim()}
              onClick={async () => {
                const text = pasteModalText.trim();
                if (!text) return;
                await pasteTextToChat(text);
                setPasteModalText('');
                setShowPasteModal(false);
              }}
            >
              Add as Source
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowPasteModal(false); setPasteModalText(''); }}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Record Modal */}
      <Modal open={showRecordModal} title="Record" onClose={() => setShowRecordModal(false)} width={720}>
        <RecordPanel 
          isRecording={isRecording}
          isPaused={isPaused}
          recordingType={recordingType}
          setRecordingType={setRecordingType}
          startRecording={startRecording}
          stopRecording={stopRecording}
          pauseRecording={pauseRecording}
          resumeRecording={resumeRecording}
          recordTimerMs={recordTimerMs}
          loading={loading}
        />
      </Modal>
    </div>
  );
}

export default App;
