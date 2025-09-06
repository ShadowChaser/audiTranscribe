/**
 * Custom hook for managing audio recording functionality
 *
 * Features:
 * - Microphone recording
 * - System audio recording (screen sharing)
 * - Recording timer
 * - Pause/Resume capability
 * - Audio blob creation
 * - Audio format: webm/opus
 * - Quality settings: 128kbps, 44.1kHz, stereo
 *
 * @returns {Object} Recording controls and state
 */

import { useState, useRef } from "react";
import axios from "axios";

export const useRecording = (options = {}) => {
  // Configuration options
  const {
    enableAutoSave = true, // Set to true by default to enable auto-save
    autoSaveEndpoint = "http://localhost:3001/recordings/external",
  } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTimerMs, setRecordTimerMs] = useState(0);
  const [recordingType, setRecordingType] = useState("microphone");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedAccumulatedRef = useRef(0);
  const onRecordingCompleteCallback = useRef(null);

  const setOnRecordingComplete = (callback) => {
    onRecordingCompleteCallback.current = callback;
  };

  // Auto-save recording to database
  const saveRecordingToDatabase = async (audioBlob) => {
    try {
      const formData = new FormData();
      const filename = `App_Recording_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.webm`;
      formData.append("audio", audioBlob, filename);

      const response = await axios.post(autoSaveEndpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      if (response.data.success) {
        console.log(
          "✅ Recording auto-saved to database:",
          response.data.recordingId
        );
        return {
          success: true,
          recordingId: response.data.recordingId,
          serverFilename: response.data.filename,
        };
      } else {
        console.error("❌ Failed to auto-save recording:", response.data);
        return {
          success: false,
          error: response.data.error || "Server returned unsuccessful response",
        };
      }
    } catch (error) {
      console.error("❌ Error auto-saving recording:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Unknown error",
      };
    }
  };

  const startRecording = async (type = recordingType) => {
    try {
      let stream;
      if (type === "system") {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach((track) => {
          track.stop();
          stream.removeTrack(track);
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 44100,
            channelCount: 2,
          },
        });
      }

      setIsRecording(true);
      setIsPaused(false);
      setRecordTimerMs(0);
      pausedAccumulatedRef.current = 0;
      startTimeRef.current = Date.now();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordTimerMs(
          pausedAccumulatedRef.current + (Date.now() - startTimeRef.current)
        );
      }, 200);
      audioChunksRef.current = [];

      const options = {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Create initial recording object
        const newRecording = {
          id: Date.now(),
          audio: audioBlob, // Changed from blob to audio to match expected property
          url: audioUrl,
          type: type,
          timestamp: new Date(),
          size: audioBlob.size,
          transcript: "",
          backendFilename: null,
          recordingId: null,
          autoSaveStatus: enableAutoSave ? "saving" : null, // Only set saving status if auto-save is enabled
        };

        // Trigger callback immediately with initial recording
        if (onRecordingCompleteCallback.current) {
          onRecordingCompleteCallback.current(newRecording);
        }

        // Conditionally auto-save in background only if enabled
        if (enableAutoSave) {
          try {
            console.log(
              "🔄 Auto-save is enabled, saving recording to database..."
            );
            const saveResult = await saveRecordingToDatabase(audioBlob, type);

            // Update recording with save results
            const updatedRecording = {
              ...newRecording,
              autoSaveStatus: saveResult.success ? "saved" : "failed",
              recordingId: saveResult.recordingId || null,
              backendFilename: saveResult.serverFilename || null,
              saveError: saveResult.success ? null : saveResult.error,
            };

            // Notify callback again with updated data
            if (onRecordingCompleteCallback.current) {
              onRecordingCompleteCallback.current(updatedRecording);
            }
          } catch (error) {
            console.error("🚨 Unexpected error during auto-save:", error);
            const failedRecording = {
              ...newRecording,
              autoSaveStatus: "failed",
              saveError: error.message || "Unexpected error",
            };

            if (onRecordingCompleteCallback.current) {
              onRecordingCompleteCallback.current(failedRecording);
            }
          }
        } else {
          console.log(
            "ℹ️ Auto-save is disabled, recording will not be saved to database automatically."
          );
        }

        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setRecordTimerMs(0);
        setIsPaused(false);
      };

      mediaRecorder.start(1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setIsRecording(false);
      throw err;
    }
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current || !isRecording || isPaused) return;
    try {
      mediaRecorderRef.current.pause();
      pausedAccumulatedRef.current += Date.now() - startTimeRef.current;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsPaused(true);
    } catch (e) {
      console.error("Pause error:", e);
    }
  };

  const resumeRecording = () => {
    if (!mediaRecorderRef.current || !isRecording || !isPaused) return;
    try {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordTimerMs(
          pausedAccumulatedRef.current + (Date.now() - startTimeRef.current)
        );
      }, 200);
      setIsPaused(false);
    } catch (e) {
      console.error("Resume error:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.stream.getTracks().forEach((track) => {
        track.stop();
      });
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsPaused(false);
      setRecordTimerMs(0);
    }
  };

  return {
    isRecording,
    isPaused,
    recordTimerMs,
    recordingType,
    setRecordingType,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    onRecordingComplete: setOnRecordingComplete,
  };
};
