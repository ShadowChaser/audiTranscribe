import { useState } from "react";
import axios from "axios";

// Prompt types that match the backend
export const SUMMARY_TYPES = {
  SUMMARY: 'summary',
  STUDY: 'study',
  DETAILED: 'detailed'
};

export const useSummary = () => {
  const [summarizing, setSummarizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  const [error, setError] = useState("");

  const simulateProgress = () => {
    let currentProgress = 0;
    const startTime = Date.now();
    
    // Initial progress update
    setProgress(5);
    
    const interval = setInterval(() => {
      // Calculate time elapsed
      const timeElapsed = (Date.now() - startTime) / 1000; // in seconds
      
      // Update progress based on time (slower at the beginning, faster towards the end)
      // This is a simple logarithmic curve that slows down as it approaches 90%
      currentProgress = Math.min(90, 5 + Math.log10(timeElapsed * 2 + 1) * 30);
      
      // Estimate time remaining (in seconds)
      const estimatedTotalTime = (timeElapsed * 100) / currentProgress;
      const remaining = Math.max(0, Math.ceil(estimatedTotalTime - timeElapsed));
      
      setProgress(Math.floor(currentProgress));
      setEstimatedTimeRemaining(remaining);
      
      // If we've reached 90%, stop the interval and let the actual completion handle the rest
      if (currentProgress >= 90) {
        clearInterval(interval);
      }
    }, 500);
    
    return () => clearInterval(interval);
  };

  const summarizeText = async (text, styleType = SUMMARY_TYPES.SUMMARY) => {
    if (!text || text.trim() === "") {
      setError("No text to summarize");
      return null;
    }

    try {
      setSummarizing(true);
      setProgress(0);
      setEstimatedTimeRemaining(null);
      setError("");
      
      // Start progress simulation
      simulateProgress();
      
      // Make the API call
      const res = await axios.post(
        "http://localhost:3001/summarize",
        { text, style: styleType },
        { 
          timeout: 120000,
          onUploadProgress: (progressEvent) => {
            // Update progress based on upload progress (first 10%)
            const uploadProgress = Math.round((progressEvent.loaded * 10) / progressEvent.total);
            setProgress(uploadProgress);
          }
        }
      );
      
      // Set progress to 100% when done
      setProgress(100);
      setEstimatedTimeRemaining(0);
      
      return res.data.summary || "";
    } catch (err) {
      console.error("Summarization error:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to summarize. Ensure Ollama is running.";
      setError(errorMsg);
      return null;
    } finally {
      setSummarizing(false);
    }
  };

  return {
    summarizing,
    progress,
    estimatedTimeRemaining,
    error,
    summarizeText,
  };
};
