import { useState, useRef, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Real-time recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mode, setMode] = useState("upload"); // "upload", "record", "live", or "system"
  
  // Live transcription state
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
  const [liveTranscriptHistory, setLiveTranscriptHistory] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const socketRef = useRef(null);
  const liveStreamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const liveMediaRecorderRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('live-transcription', (data) => {
      setLiveTranscriptHistory(prev => [...prev, data.text]);
    });
    
    socketRef.current.on('transcription-error', (data) => {
      setError(data.error);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if it's an audio file
      const audioTypes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg', 'audio/flac'];
      if (audioTypes.includes(selectedFile.type) || selectedFile.name.match(/\.(wav|mp3|m4a|ogg|flac)$/i)) {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Please select a valid audio file (wav, mp3, m4a, ogg, flac)");
        setFile(null);
      }
    }
  };

  const startLiveTranscription = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      setIsRecording(true);
      setTranscript('');
      setError('');
      
      // Use Web Audio API for raw PCM capture
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      let audioBuffer = [];
      let bufferLength = 0;
      const targetBufferSize = 32000; // ~2 seconds at 16kHz
      
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Convert float32 to int16
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        audioBuffer.push(int16Data);
        bufferLength += int16Data.length;
        
        // Send when we have enough data
        if (bufferLength >= targetBufferSize) {
          const combinedBuffer = new Int16Array(bufferLength);
          let offset = 0;
          
          for (const chunk of audioBuffer) {
            combinedBuffer.set(chunk, offset);
            offset += chunk.length;
          }
          
          // Create WAV file
          const wavBuffer = createWAVFile(combinedBuffer, 16000);
          
          if (socketRef.current) {
            console.log(`🎵 Sending WAV audio: ${wavBuffer.byteLength} bytes`);
            socketRef.current.emit('live-audio', wavBuffer);
          }
          
          // Reset buffer but keep some overlap
          const overlapSize = Math.floor(targetBufferSize * 0.1); // 10% overlap
          if (bufferLength > overlapSize) {
            const overlapBuffer = combinedBuffer.slice(-overlapSize);
            audioBuffer = [overlapBuffer];
            bufferLength = overlapSize;
          } else {
            audioBuffer = [];
            bufferLength = 0;
          }
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Store references for cleanup
      mediaRecorderRef.current = {
        stream,
        audioContext,
        source,
        processor,
        stop: () => {
          processor.disconnect();
          source.disconnect();
          audioContext.close();
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
    } catch (err) {
      console.error('Error starting live transcription:', err);
      setError('Failed to start live transcription: ' + err.message);
    }
  };

  // WAV file creation function
  const createWAVFile = (audioData, sampleRate) => {
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
    let offset = 44;
    for (let i = 0; i < length; i++) {
      view.setInt16(offset, audioData[i], true);
      offset += 2;
    }
    
    return buffer;
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Upload recorded audio for transcription
  const uploadRecordedAudio = async (audioBlob) => {
    setLoading(true);
    setError("");
    setTranscript("");

    try {
      const formData = new FormData();
      const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      formData.append("audio", audioFile);

      // Upload and transcribe
      const uploadRes = await axios.post("http://localhost:3001/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Get transcript content
      const filename = uploadRes.data.transcriptFile.split('/').pop();
      const transcriptRes = await axios.get(`http://localhost:3001/transcript/${filename}`);
      
      setTranscript(transcriptRes.data.content);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "Failed to transcribe recorded audio. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an audio file first");
      return;
    }

    setLoading(true);
    setError("");
    setTranscript("");

    try {
      const formData = new FormData();
      formData.append("audio", file);

      // Upload and transcribe
      const uploadRes = await axios.post("http://localhost:3001/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Get transcript content
      const filename = uploadRes.data.transcriptFile.split('/').pop();
      const transcriptRes = await axios.get(`http://localhost:3001/transcript/${filename}`);
      
      setTranscript(transcriptRes.data.content);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "Failed to transcribe audio. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Stop live transcription
  const stopLiveTranscription = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    }
  };
      let mediaRecorder;
      
      // Try different formats in order of preference
      const formats = [
        { mimeType: 'audio/wav' },
        { mimeType: 'audio/webm;codecs=pcm' },
        { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 },
        null // Default format
      ];
      
      for (const format of formats) {
        try {
          mediaRecorder = format ? new MediaRecorder(stream, format) : new MediaRecorder(stream);
          console.log(`Using audio format: ${format?.mimeType || 'default'}`);
          break;
        } catch (err) {
          console.log(`Format ${format?.mimeType || 'default'} not supported:`, err.message);
          continue;
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        console.log(`Audio data available: ${event.data.size} bytes, type: ${event.data.type}`);
        console.log(`Conditions - size > 0: ${event.data.size > 0}, socketRef: ${!!socketRef.current}, isLiveTranscribing: ${isLiveTranscribing}`);
        
        if (event.data.size > 0 && socketRef.current) {
          // Send each audio chunk immediately
          event.data.arrayBuffer().then(buffer => {
            console.log(`Sending audio blob: ${buffer.byteLength} bytes`);
            socketRef.current.emit('audio-blob', buffer);
          });
        }
      };

      // Store the recorder reference
      liveMediaRecorderRef.current = mediaRecorder;
      
      // Add error handler
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError(`Recording error: ${event.error.message}`);
      };
      
      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started');
      };
      
      // Start recording with 2-second intervals for better speech detection
      console.log('Starting MediaRecorder with 2-second intervals');
      mediaRecorder.start(2000); // Request data every 2 seconds
      socketRef.current.emit('start-live-transcription');

    } catch (err) {
      console.error("Live transcription error:", err);
      let errorMsg;
      
      if (mode === "system") {
        errorMsg = err.message || "Failed to start system audio capture. Please allow screen sharing with audio.";
      } else {
        errorMsg = err.name === 'NotAllowedError' 
          ? "Microphone access denied. Please allow microphone access and try again."
          : "Failed to start live transcription. Please allow microphone access.";
      }
      
      setError(errorMsg);
    }
  };

  // Stop live transcription
  const stopLiveTranscription = () => {
    setIsLiveTranscribing(false);
    
    if (liveMediaRecorderRef.current && liveMediaRecorderRef.current.state !== 'inactive') {
      liveMediaRecorderRef.current.stop();
      liveMediaRecorderRef.current = null;
    }
    
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(track => track.stop());
      liveStreamRef.current = null;
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.emit('stop-live-transcription');
    }
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">🎙️ Whisper Transcriber</h1>
        <p className="subtitle">Upload an audio file or record system audio for AI-powered transcription</p>
        
        {/* Mode Selection */}
        <div className="mode-selector">
          <button 
            className={mode === "upload" ? "active" : ""} 
            onClick={() => setMode("upload")}
          >
            📁 Upload File
          </button>
          <button 
            className={mode === "record" ? "active" : ""} 
            onClick={() => setMode("record")}
          >
            🎤 Record Audio
          </button>
          <button 
            className={mode === "live" ? "active" : ""} 
            onClick={() => setMode("live")}
          >
            🔴 Live Transcribe
          </button>
        </div>

        {/* Upload Mode */}
        {mode === "upload" && (
          <div className="upload-section">
            <div className="file-input-wrapper">
              <input
                type="file"
                id="audio-file"
                accept="audio/*"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="audio-file" className="file-label">
                {file ? file.name : "Choose Audio File"}
              </label>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="upload-button"
            >
              {loading ? "Transcribing..." : "Upload & Transcribe"}
            </button>
          </div>
        )}

        {/* Recording Mode */}
        {mode === "record" && (
          <div className="recording-section">
            <div className="recording-controls">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={loading}
                  className="record-button start"
                >
                  🔴 Start Recording System Audio
                </button>
              ) : (
                <div className="recording-active">
                  <div className="recording-info">
                    <div className="recording-indicator">
                      <div className="pulse"></div>
                      Recording: {formatTime(recordingTime)}
                    </div>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="record-button stop"
                  >
                    ⏹️ Stop & Transcribe
                  </button>
                </div>
              )}
            </div>
            <div className="recording-instructions">
              <p><strong>How to record system audio:</strong></p>
              <ol>
                <li>Click "Start Recording System Audio"</li>
                <li>Choose "Entire Screen" when prompted</li>
                <li>Make sure "Share audio" is checked</li>
                <li>Play your Udemy lecture or any audio</li>
                <li>Click "Stop & Transcribe" when done</li>
              </ol>
            </div>
          </div>
        )}

        {/* Live Transcription Mode */}
        {(mode === "live" || mode === "system") && (
          <div className="live-section">
            <div className="live-controls">
              {!isLiveTranscribing ? (
                <button
                  onClick={startLiveTranscription}
                  disabled={loading}
                  className="live-button start"
                >
                  🔴 Start {mode === "system" ? "System Audio" : "Live Transcription"}
                </button>
              ) : (
                <div className="live-active">
                  <div className="live-indicator">
                    <div className="pulse"></div>
                    {mode === "system" ? "Recording system audio..." : "Live transcribing..."}
                  </div>
                  <button
                    onClick={stopLiveTranscription}
                    className="live-button stop"
                  >
                    ⏹️ Stop Live Transcription
                  </button>
                </div>
              )}
            </div>
            
            {/* Live Transcript Display */}
            {(liveTranscriptHistory.length > 0 || isLiveTranscribing) && (
              <div className="live-transcript">
                <h3>Live Transcript:</h3>
                <div className="live-transcript-content">
                  {liveTranscriptHistory.map((text, index) => (
                    <span key={index} className="transcript-word">
                      {text}{' '}
                    </span>
                  ))}
                  {isLiveTranscribing && (
                    <span className="transcript-cursor">|</span>
                  )}
                </div>
              </div>
            )}
            
            <div className="live-instructions">
              <p><strong>Near Real-Time Transcription for Tutorial Videos:</strong></p>
              <div className="audio-source-selector">
                <button 
                  className={`source-btn ${mode === "live" ? "active" : ""}`}
                  onClick={() => setMode("live")}
                >
                  🎤 Microphone
                </button>
                <button 
                  className={`source-btn ${mode === "system" ? "active" : ""}`}
                  onClick={() => setMode("system")}
                >
                  🖥️ System Audio
                </button>
              </div>
              <ul>
                <li><strong>System Audio:</strong> Perfect for YouTube tutorials, Udemy courses, etc.</li>
                <li><strong>Microphone:</strong> For live lectures or your own voice</li>
                <li><strong>Setup:</strong> Choose "Entire Screen" and check "Share audio"</li>
                <li><strong>Speed:</strong> ~1 second delay for near real-time transcription</li>
                <li><strong>Best browsers:</strong> Chrome or Edge for system audio capture</li>
                <li><strong>Tip:</strong> Start transcription before playing your tutorial video</li>
              </ul>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {loading && (
          <div className="loading-message">
            <div className="spinner"></div>
            Processing your audio file... This may take a few minutes.
          </div>
        )}

        {transcript && (
          <div className="transcript-section">
            <h2>📝 Transcript</h2>
            <div className="transcript-content">
              <pre>{transcript}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
