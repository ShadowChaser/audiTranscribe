import { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";

export const useTranscript = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const transcribeFile = async (file) => {
    if (!file) {
      setError("Please select an audio file first");
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const uploadRes = await axios.post(
        "http://localhost:3001/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          // 0 means no timeout in Axios; long transcriptions may exceed 5 minutes
          timeout: 0,
        }
      );

      const transcriptRes = await axios.get(
        `http://localhost:3001/transcript/${uploadRes.data.transcriptFile
          .split("/")
          .pop()}`,
        {
          timeout: 0,
        }
      );

      setError("");
      return transcriptRes.data.content;
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to transcribe audio. Make sure the backend is running.";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const transcribeRecording = async (recording) => {
    if (!recording) {
      setError("Recording not found or invalid");
      return null;
    }

    setLoading(true);
    setError("");

    try {
      // Check if this is a saved recording (has backendFilename) or new recording (has audio blob)
      if (recording.backendFilename || recording.filename) {
        // This is a saved recording - use the /transcribe/:filename endpoint
        const filename = recording.backendFilename || recording.filename;
        
        const response = await axios.post(
          `http://localhost:3001/transcribe/${filename}`,
          {},
          {
            timeout: 0, // allow long-running transcription
          }
        );

        if (response.data.transcriptFile) {
          const transcriptResponse = await axios.get(
            `http://localhost:3001/transcript/${response.data.transcriptFile
              .split("/")
              .pop()}`
          );
          const backendFilename = response.data.transcriptFile
            .split("/")
            .pop()
            .replace(".txt", "");
          return {
            transcript: transcriptResponse.data.content,
            backendFilename,
          };
        }
        return null;
      } else if (recording.audio) {
        // This is a new recording with audio blob - use the /upload endpoint
        const formData = new FormData();
        formData.append("audio", recording.audio, "recording.webm");

        const response = await axios.post(
          "http://localhost:3001/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 0, // allow long-running transcription
          }
        );

        if (response.data.transcriptFile) {
          const transcriptResponse = await axios.get(
            `http://localhost:3001/transcript/${response.data.transcriptFile
              .split("/")
              .pop()}`
          );
          const backendFilename = response.data.transcriptFile
            .split("/")
            .pop()
            .replace(".txt", "");
          return {
            transcript: transcriptResponse.data.content,
            backendFilename,
          };
        }
        return null;
      } else {
        setError("Recording has neither audio data nor backend filename");
        return null;
      }
    } catch (err) {
      console.error("Transcription error:", err);
      const errorMsg =
        "Failed to transcribe audio: " +
        (err.response?.data?.error || err.message);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    transcribeFile,
    transcribeRecording,
  };
};
