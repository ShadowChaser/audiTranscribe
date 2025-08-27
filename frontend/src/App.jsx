import { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [recordingType, setRecordingType] = useState('microphone'); // 'microphone' or 'system'
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
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

  // Convert audio chunks to WAV format
  const _createWAVFile = (audioChunks, sampleRate) => {
    const audioData = new Uint8Array(audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0));
    let offset = 0;
    for (let i = 0; i < audioChunks.length; i++) {
      const chunk = audioChunks[i];
      audioData.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    const length = audioData.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Audio data
    let dataOffset = 44;
    for (let i = 0; i < length; i++) {
      view.setInt16(dataOffset, audioData[i], true);
      dataOffset += 2;
    }
    
    return buffer;
  };

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

  // Transcribe the recorded audio
  const transcribeRecording = async () => {
    if (!audioBlob) {
      setError('No audio recording available');
      return;
    }

    setLoading(true);
    setError('');
    setTranscript('Transcribing...');

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.transcriptFile) {
        const transcriptResponse = await axios.get(`http://localhost:3001/transcript/${response.data.transcriptFile.split('/').pop()}`);
        setTranscript(transcriptResponse.data.content);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
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
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "Failed to transcribe audio. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1 className="title">Audio Transcriber</h1>
        <p className="subtitle">Transform your audio into text with AI-powered transcription</p>
      </div>
      
      <div className="cards-grid">
        {/* Recording Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon">🎤</div>
            <div>
              <h3 className="card-title">Record Audio</h3>
              <p className="card-description">Record microphone or system audio for transcription</p>
            </div>
          </div>
          
          {!isRecording && (
            <div style={{marginBottom: '1rem'}}>
              <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
                <button 
                  onClick={() => setRecordingType('microphone')}
                  className={`btn ${recordingType === 'microphone' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{flex: 1}}
                >
                  🎤 Microphone
                </button>
                <button 
                  onClick={() => setRecordingType('system')}
                  className={`btn ${recordingType === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{flex: 1}}
                >
                  🔊 System Audio
                </button>
              </div>
            </div>
          )}
          
          {!isRecording && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9}}>
                📋 <strong>Instructions:</strong>
              </p>
              <p style={{margin: 0, fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.4'}}>
                Click "Start Recording" → Allow screen sharing with audio → Select your entire screen or specific app → 
                The system will continuously listen and capture all audio until you stop recording.
              </p>
            </div>
          )}
          
          <div className="recording-controls">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                className="btn btn-danger btn-lg"
                disabled={loading}
              >
                🎙️ Start Recording
              </button>
            ) : (
              <div className="recording-active">
                <button 
                  onClick={stopRecording}
                  className="btn btn-secondary btn-lg"
                >
                  ⏹️ Stop Recording
                </button>
                <div className="recording-indicator">
                  <div className="pulse"></div>
                  Recording in progress...
                </div>
              </div>
            )}
          </div>
          
          {audioBlob && (
            <div style={{marginTop: '1rem'}}>
              <audio controls src={audioUrl} style={{width: '100%', marginBottom: '1rem'}} />
              <button 
                onClick={transcribeRecording}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '⏳ Transcribing...' : '✨ Transcribe Recording'}
              </button>
            </div>
          )}
        </div>

        {/* Upload Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon">📁</div>
            <div>
              <h3 className="card-title">Upload File</h3>
              <p className="card-description">Upload audio files (WAV, MP3, M4A, OGG, FLAC)</p>
            </div>
          </div>
          
          <div className="file-upload-area" onClick={() => document.getElementById('file-input').click()}>
            <div className="upload-icon">📤</div>
            <div className="upload-text">
              {file ? file.name : 'Click to select audio file'}
            </div>
            <div className="upload-subtext">
              Supports WAV, MP3, M4A, OGG, FLAC formats
            </div>
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              accept="audio/*"
              className="file-input"
            />
          </div>
          
          {file && (
            <button 
              onClick={transcribeFile}
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{marginTop: '1rem', width: '100%'}}
            >
              {loading ? '⏳ Transcribing...' : '✨ Transcribe File'}
            </button>
          )}
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
      {transcript && transcript !== 'Transcribing...' && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon">📝</div>
            <div style={{flex: 1}}>
              <h3 className="card-title">Transcript</h3>
              <p className="card-description">AI-generated transcription results</p>
            </div>
            <button 
              onClick={() => copyToClipboard(transcript)}
              className="btn btn-secondary btn-sm"
              style={{marginLeft: 'auto'}}
            >
              📋 Copy
            </button>
          </div>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxHeight: '400px',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <pre style={{
              color: '#ffffff',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'inherit',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              {transcript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
