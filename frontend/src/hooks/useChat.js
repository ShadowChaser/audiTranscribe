import { useState } from "react";
import axios from "axios";

export const useChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);

  const sendMessage = async (message, context = "") => {
    setLoading(true);
    try {
      // Add user message
      const userMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to dedicated chat endpoint
      const response = await axios.post(
        "http://localhost:3001/chat",
        {
          message,
          context,
          docIds: sources.map((s) => s.id),
        },
        { timeout: 60000 }
      );

      const aiMessage = {
        role: "assistant",
        content: response.data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setError("");
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage = {
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting to the AI. Please make sure Ollama is running.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError("Chat service unavailable. Please ensure Ollama is running.");
    } finally {
      setLoading(false);
    }
  };

  const attachFile = async (fileObj) => {
    try {
      const form = new FormData();
      form.append("file", fileObj);
      const res = await axios.post("http://localhost:3001/ingest/file", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      const { id, doc } = res.data;
      setSources((prev) => [...prev, { id, name: doc.name, type: doc.type }]);
      setError("");
      return true;
    } catch (e) {
      console.error("Attach file error:", e);
      const errorMsg =
        e.response?.data?.error || "Failed to attach file for chat";
      setError(errorMsg);
      return false;
    }
  };

  const addTextSource = async (text) => {
    try {
      const res = await axios.post(
        "http://localhost:3001/ingest/text",
        { text },
        { timeout: 120000 }
      );
      const { id, doc } = res.data;
      setSources((prev) => [...prev, { id, name: doc.name, type: doc.type }]);
      setError("");
      return true;
    } catch (e) {
      console.error("Add text error:", e);
      const errorMsg = e.response?.data?.error || "Failed to add text for chat";
      setError(errorMsg);
      return false;
    }
  };

  const removeSource = async (id) => {
    try {
      setSources((prev) => prev.filter((s) => s.id !== id));
      // Best-effort delete on backend
      await axios.delete(`http://localhost:3001/ingest/${id}`).catch(() => {});
      return true;
    } catch (e) {
      console.warn("Failed to remove source:", e?.message || e);
      return false;
    }
  };

  return {
    loading,
    error,
    messages,
    sources,
    sendMessage,
    attachFile,
    addTextSource,
    removeSource,
  };
};
