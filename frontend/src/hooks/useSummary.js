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
  const [error, setError] = useState("");

  const summarizeText = async (text, styleType = SUMMARY_TYPES.SUMMARY) => {
    if (!text || text.trim() === "") {
      setError("No text to summarize");
      return null;
    }

    try {
      setSummarizing(true);
      setError("");
      // Just pass the style type to the backend which will handle the appropriate prompt
      const res = await axios.post(
        "http://localhost:3001/summarize",
        { text, style: styleType },
        { timeout: 120000 }
      );
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
    error,
    summarizeText,
  };
};
