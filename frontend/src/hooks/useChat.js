import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const useChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:3001/chat/sessions");
      setSessions(res.data.sessions || []);
      return res.data.sessions || [];
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      return [];
    }
  }, []);

  const createNewSession = async (title = "New Chat") => {
    // Provide immediate feedback
    setActiveSessionId(null);
    setMessages([]);
    setSources([]); // Clear sources for new chat
    
    try {
      const res = await axios.post("http://localhost:3001/chat/sessions", { title });
      const newSession = res.data.session;
      if (newSession) {
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession._id);
        console.log("New session created:", newSession._id);
        return newSession;
      }
    } catch (err) {
      console.error("Failed to create session:", err);
      toast.error("Could not create new chat session. Check backend.");
      return null;
    }
  };

  const switchSession = async (sessionId) => {
    if (sessionId === activeSessionId) return;
    setLoading(true);
    setMessages([]); // Clear while loading
    
    try {
      const res = await axios.get(`http://localhost:3001/chat/sessions/${sessionId}`);
      const session = res.data.session;
      if (session) {
        setActiveSessionId(session._id);
        setMessages(session.messages || []);
        setSources([]); // Context is usually fresh per session in this flow
        setError("");
      }
    } catch (err) {
      console.error("Failed to switch session:", err);
      toast.error("Failed to load chat history.");
      setError("Failed to load session content");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`http://localhost:3001/chat/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      toast.error("Failed to delete chat.");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const sendMessage = async (message, context = "") => {
    if (!message.trim()) return;
    
    setLoading(true);
    let currentSessionId = activeSessionId;

    // If no active session, create one first
    if (!currentSessionId) {
      const session = await createNewSession(message.substring(0, 30) + "...");
      if (session) {
        currentSessionId = session._id;
      } else {
        setLoading(false);
        return; // Failed to create session
      }
    }

    try {
      // Add user message locally
      const userMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const response = await axios.post(
        "http://localhost:3001/chat",
        {
          message,
          context,
          docIds: sources.map((s) => s.id),
          sessionId: currentSessionId
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
      
      // Refresh list to update titles if needed
      fetchSessions();
    } catch (err) {
      console.error("Chat error:", err);
      setError("Assistant is temporarily unavailable.");
      toast.error("Message failed to send.");
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
      return true;
    } catch (e) {
      toast.error("File attachment failed.");
      return false;
    }
  };

  const addTextSource = async (text, name = "Pasted Text") => {
    try {
      const res = await axios.post(
        "http://localhost:3001/ingest/text",
        { text, name },
        { timeout: 120000 }
      );
      const { id, doc } = res.data;
      setSources((prev) => [...prev, { id, name: doc.name, type: doc.type }]);
      return true;
    } catch (e) {
      toast.error("Failed to add context source.");
      return false;
    }
  };

  const removeSource = async (id) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    await axios.delete(`http://localhost:3001/ingest/${id}`).catch(() => {});
  };

  return {
    loading,
    error,
    messages,
    sources,
    sessions,
    activeSessionId,
    sendMessage,
    attachFile,
    addTextSource,
    removeSource,
    createNewSession,
    switchSession,
    deleteSession,
    refreshSessions: fetchSessions
  };
};
