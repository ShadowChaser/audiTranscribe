import { useState } from "react";
import axios from "axios";

const STUDY_NOTES_STYLE = `You are an assistant that creates clear, structured study notes.\n\nInput: A transcript of a lecture, book chapter, or video.\n\nOutput: Summarized notes that are concise, organized, and easy to revise later.\n\nFormatting Rules:\n- Use short bullet points, not long paragraphs.\n- Capture only the key ideas, arguments, or facts.\n- Highlight definitions, formulas, or important terms in **bold**.\n- If a process or sequence is explained, number the steps (1, 2, 3...).\n- For comparisons, use a table format.\n- Add a short "Key Takeaways" section at the end with the 3–5 most important insights.\n\nKeep the language simple and direct.`;

export const useSummary = () => {
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState("");

  const summarizeText = async (text, useStudyStyle = false) => {
    if (!text || text.trim() === "") {
      setError("No text to summarize");
      return null;
    }

    try {
      setSummarizing(true);
      setError("");
      const style = useStudyStyle ? STUDY_NOTES_STYLE : "";
      const res = await axios.post(
        "http://localhost:3001/summarize",
        { text, style },
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
