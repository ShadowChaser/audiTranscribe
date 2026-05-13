import { useState, useEffect, useRef } from "react";
import axios from "axios";
import FeedCard from "../components/FeedCard";
import { toast } from "react-toastify";
import { copyToClipboard } from "../utils/clipboard";

const ChatView = ({ chat }) => {
  const [recordings, setRecordings] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (chat.messages.length === 0) {
      fetchRecordings();
    }
  }, [chat.messages.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRecordings = async () => {
    setFetching(true);
    try {
      const response = await axios.get("http://localhost:3001/recordings");
      const withTranscripts = response.data.recordings.filter(r => r.hasTranscript && r.transcript);
      setRecordings(withTranscripts);
    } catch (err) {
      console.error("Failed to fetch recordings for chat:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSelectTranscript = async (rec) => {
    if (chat.sources.some(s => s.name === rec.filename)) {
      toast.info(`"${rec.filename}" is already active.`);
      setShowDropdown(false);
      return;
    }

    const success = await chat.addTextSource(rec.transcript, rec.filename);
    if (success) {
      toast.success(`Loaded "${rec.filename}"`);
    }
    setShowDropdown(false);
  };

  const filteredRecordings = recordings.filter(r => 
    r.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (chat.messages.length === 0 && !chat.loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'var(--accent-gradient)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-glow)',
          fontSize: '40px'
        }}>🤖</div>
        
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px', letterSpacing: '-1px' }}>Nexus AI Assistant</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: '1.6', marginBottom: '40px' }}>
          Ask questions about your recordings or start a new conversation.
        </p>

        {/* Searchable Dropdown Selection */}
        <div ref={dropdownRef} style={{ width: '100%', maxWidth: '500px', position: 'relative', marginBottom: '60px', zIndex: 50 }}>
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-secondary)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: showDropdown ? 'var(--shadow-lg)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>📂</span>
              <span style={{ fontWeight: '600', color: recordings.length > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {recordings.length > 0 ? 'Select a transcript to analyze...' : 'No transcripts available'}
              </span>
            </div>
            <svg 
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
              style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-secondary)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              animation: 'slideUp 0.2s ease',
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '12px', borderBottom: '1px solid var(--border-primary)' }}>
                <input 
                  type="text" 
                  placeholder="Search transcripts..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-primary)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    width: '100%'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '8px' }}>
                {filteredRecordings.length > 0 ? filteredRecordings.map((rec) => (
                  <div 
                    key={rec._id}
                    onClick={() => handleSelectTranscript(rec)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background 0.2s ease',
                      background: chat.sources.some(s => s.name === rec.filename) ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = chat.sources.some(s => s.name === rec.filename) ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                  >
                    <span style={{ fontSize: '18px' }}>📄</span>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{rec.filename}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(rec.created).toLocaleDateString()}</div>
                    </div>
                    {chat.sources.some(s => s.name === rec.filename) && (
                      <div style={{ width: '8px', height: '8px', background: 'var(--text-accent)', borderRadius: '50%' }}></div>
                    )}
                  </div>
                )) : (
                  <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    No matching transcripts found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>
            Quick Analysis
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              "Summarize content",
              "Action items",
              "Key takeaways",
              "Next steps"
            ].map((suggestion, i) => (
              <button 
                key={i} 
                className="btn btn-outline" 
                style={{ fontSize: '0.85rem', padding: '14px', borderRadius: '12px' }}
                onClick={() => chat.sendMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {chat.messages.map((msg, index) => (
        <FeedCard
          key={index}
          avatar={msg.role === "user" ? "👤" : "🤖"}
          title={msg.role === "user" ? "You" : "Nexus AI"}
          subtitle={new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          fullText={msg.content}
          actions={[
            <button
              key="copy"
              onClick={() => copyToClipboard(msg.content)}
              className="btn btn-outline btn-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            </button>,
          ]}
        />
      ))}

      {chat.loading && (
        <div className="feed-card-item" style={{ animation: 'pulse 1.5s infinite' }}>
          <div className="feed-card-avatar" style={{ background: 'var(--bg-tertiary)', borderRadius: '50%', width: '40px', height: '40px' }} />
          <div className="feed-card-content">
            <div style={{ height: '14px', width: '80px', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '12px', width: '100%', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '12px', width: '60%', background: 'var(--bg-tertiary)', borderRadius: '4px' }} />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatView;
