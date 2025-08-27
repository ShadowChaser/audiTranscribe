import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import RecordPanel from './components/RecordPanel.jsx';
import UploadPanel from './components/UploadPanel.jsx';
import SavedRecordings from './components/SavedRecordings.jsx';
import TranscriptCard from './components/TranscriptCard.jsx';
import SummaryCard from './components/SummaryCard.jsx';

function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]); // Array to store multiple recordings
  const [savedRecordings, setSavedRecordings] = useState([]); // Array to store saved recordings from backend
  const [recordingType, setRecordingType] = useState('microphone'); // 'microphone' or 'system'
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  // Internal helper to call backend summarize
  const _summarizeText = async (text, style = '') => {
    const res = await axios.post('http://localhost:3001/summarize', { text, style }, { timeout: 120000 });
    return res.data.summary || '';
  };

  // Summarize current top-level transcript using backend /summarize (Ollama)
  const summarizeTranscript = async (style = '') => {
    if (!transcript || transcript.trim() === '') {
      setError('No transcript to summarize');
      return;
    }
    try {
      setSummarizing(true);
      setError('');
      const s = await _summarizeText(transcript, style);
      setSummary(s);
    } catch (err) {
      console.error('Summarization error:', err);
      setError(err.response?.data?.error || 'Failed to summarize. Ensure Ollama is running (port 11434) and model is available.');
    } finally {
      setSummarizing(false);
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
    } catch (err) {
      console.error('Summarization error:', err);
      setError(err.response?.data?.error || 'Failed to summarize recording.');
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
    } catch (err) {
      console.error('Summarization error:', err);
      setError(err.response?.data?.error || 'Failed to summarize saved recording.');
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
      } else {
        setError("Please select a valid audio file (wav, mp3, m4a, ogg, flac)");
        setFile(null);
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
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording error: ' + event.error.message);
        setIsRecording(false);
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
      // Show temporary success message
      const originalError = error;
      setError('✅ Transcript copied to clipboard!');
      setTimeout(() => setError(originalError), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setError('Failed to copy to clipboard. Please select and copy manually.');
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
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio: ' + (err.response?.data?.error || err.message));
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
    } catch (err) {
      console.error('Failed to delete saved recording:', err);
      setError('Failed to delete recording');
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
      setSummary(''); // clear previous summary
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "Failed to transcribe audio. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="container">
        <div className="content-grid">
          {/* Recording Panel */}
          <div className="col-6">
            <RecordPanel 
              isRecording={isRecording}
              recordingType={recordingType}
              setRecordingType={setRecordingType}
              startRecording={startRecording}
              stopRecording={stopRecording}
              loading={loading}
            />

            {/* Multiple Recordings Display */}
            {recordings.length > 0 && (
              <div style={{marginTop: '1.5rem'}}>
                <h4 className="section-title">🎵 Recordings ({recordings.length})</h4>
                {recordings.map((recording, index) => (
                  <div key={recording.id} className="recorded-audio-section">
                    <div className="recording-header">
                      <div className="recording-meta">
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: recording.type === 'system' ? 
                            'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                            'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                        }}></div>
                        <h5 style={{margin: 0, fontSize: '0.9rem', fontWeight: '600'}}>
                          {recording.type === 'system' ? '🔊' : '🎤'} Recording #{recordings.length - index}
                        </h5>
                        <span className="badge">{(recording.size / 1024).toFixed(1)} KB</span>
                        <span style={{fontSize: '0.75rem', opacity: 0.6}}>{recording.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <button 
                        onClick={() => deleteRecording(recording.id)}
                        className="btn btn-secondary btn-icon"
                        style={{background: 'rgba(255, 107, 107, 0.2)', border: '1px solid rgba(255, 107, 107, 0.3)', color: '#ff6b6b'}}
                        title="Delete recording and backend files"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <audio controls src={recording.url} className="audio-player" />
                    
                    <div className="actions-row">
                      <button 
                        onClick={() => transcribeRecording(recording.id)}
                        className="btn btn-primary"
                        disabled={loading}
                        style={{width: '100%'}}
                      >
                        {recording.transcript === 'Transcribing...' ? '⏳ Transcribing...' : 
                         recording.transcript && recording.transcript !== '' ? '✅ Transcribed' : '✨ Transcribe'}
                      </button>
                      {recording.transcript && recording.transcript !== '' && recording.transcript !== 'Transcribing...' && (
                        <button
                          onClick={() => summarizeRecordingTranscript(recording.id)}
                          className="btn btn-secondary"
                          disabled={recording.summarizing}
                          title="Summarize this recording's transcript"
                        >
                          {recording.summarizing ? '⏳ Summarizing' : '🧠 Summarize'}
                        </button>
                      )}
                      {recording.transcript && recording.transcript !== '' && recording.transcript !== 'Transcribing...' && (
                        <button
                          onClick={() => copyToClipboard(recording.transcript)}
                          className="btn btn-outline"
                          title="Copy transcript"
                        >
                          📋 Copy Transcript
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = recording.url;
                          link.download = `recording-${recording.id}.webm`;
                          link.click();
                        }}
                        className="btn btn-secondary"
                        title="Download recording"
                      >
                        💾
                      </button>
                    </div>

                    {/* Show transcript if available */}
                    {recording.transcript && recording.transcript !== '' && recording.transcript !== 'Transcribing...' && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        padding: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <h6 style={{margin: '0 0 0.5rem 0', fontSize: '0.8rem', opacity: 0.8}}>📝 Transcript:</h6>
                        <p style={{margin: 0, fontSize: '0.9rem', lineHeight: '1.4', whiteSpace: 'pre-wrap'}}>
                          {recording.transcript}
                        </p>
                        {recording.summary && (
                          <div style={{
                            marginTop: '0.8rem',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '8px',
                            padding: '0.8rem',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}>
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                              <h6 style={{margin: 0, fontSize: '0.8rem', opacity: 0.8}}>🧠 Summary:</h6>
                              <button
                                onClick={() => copyToClipboard(recording.summary)}
                                className="btn btn-outline btn-sm"
                                title="Copy summary"
                              >
                                📋 Copy Summary
                              </button>
                            </div>
                            <p style={{margin: 0, fontSize: '0.9rem', lineHeight: '1.4', whiteSpace: 'pre-wrap'}}>
                              {recording.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Panel */}
          <div className="col-6">
            <UploadPanel 
              file={file}
              onFileChange={handleFileChange}
              onTranscribe={transcribeFile}
              loading={loading}
            />
          </div>

          {/* Saved Recordings from System */}
          <div className="col-12">
            <SavedRecordings 
              savedRecordings={savedRecordings}
              deleteSavedRecording={deleteSavedRecording}
              fetchSavedRecordings={fetchSavedRecordings}
              summarizeSavedRecording={summarizeSavedRecording}
            />
          </div>
        </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.3)'}}>
          <div className="card-header">
            <div className="card-icon" style={{background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'}}>⚠️</div>
            <div>
              <h3 className="card-title" style={{color: '#ff6b6b'}}>Error</h3>
            </div>
          </div>
          <p style={{color: '#ff6b6b', margin: 0}}>{error}</p>
        </div>
      )}
      
      {/* Transcript Results */}
      <TranscriptCard 
        transcript={transcript}
        onCopy={() => copyToClipboard(transcript)}
        onSummarize={() => summarizeTranscript()}
        summarizing={summarizing}
      />

      {/* Summary Results */}
      <SummaryCard 
        summary={summary}
        onCopy={() => copyToClipboard(summary)}
      />
      </main>
      <Footer />
    </div>
  );
}

export default App;
