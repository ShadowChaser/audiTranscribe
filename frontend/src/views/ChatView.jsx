import { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
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
      const response = await axios.get(`${API_BASE_URL}/recordings`);
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
        minHeight: '70vh',
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease',
        padding: '0 20px'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          marginBottom: '40px', 
          color: 'var(--text-primary)',
          letterSpacing: '-1px' 
        }}>
          What's on your mind today?
        </h1>

        {/* Searchable Dropdown Selection - Styled more like a search button */}
        <div ref={dropdownRef} style={{ width: '100%', maxWidth: '600px', position: 'relative', zIndex: 50, marginBottom: '24px' }}>
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-secondary)',
              borderRadius: '16px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {chat.sources.length > 0 ? `${chat.sources.length} sources active` : 'Select a transcript to analyze...'}
              </span>
            </div>
            <svg 
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
              style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', opacity: 0.5 }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              marginBottom: '12px',
              left: 0,
              right: 0,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-secondary)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              animation: 'slideUp 0.2s ease',
              maxHeight: '300px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '10px', borderBottom: '1px solid var(--border-primary)' }}>
                <input 
                  type="text" 
                  placeholder="Search transcripts..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    width: '100%',
                    fontSize: '0.9rem'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '4px' }}>
                {filteredRecordings.length > 0 ? filteredRecordings.map((rec) => (
                  <div 
                    key={rec._id}
                    onClick={() => handleSelectTranscript(rec)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: chat.sources.some(s => s.name === rec.filename) ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>📄</span>
                    <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.filename}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '16px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    No transcripts found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', maxWidth: '700px' }}>
          {[
            "Summarize content",
            "Action items",
            "Key takeaways",
            "Next steps"
          ].map((suggestion, i) => (
            <button 
              key={i} 
              className="btn btn-outline" 
              style={{ fontSize: '0.8rem', padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.03)' }}
              onClick={() => chat.sendMessage(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '60px' }}>
      {chat.messages.map((msg, index) => (
        <div 
          key={index} 
          style={{ 
            display: 'flex', 
            gap: '20px', 
            maxWidth: '800px', 
            width: '100%', 
            margin: '0 auto',
            alignItems: 'flex-start',
            padding: '0 20px'
          }}
        >
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            {msg.role === 'user' ? '👤' : '🤖'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '700', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {msg.role === 'user' ? 'You' : 'Nexus AI'}
            </div>
            <div style={{ color: 'var(--text-primary)', lineHeight: '1.7', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
            {msg.role === 'assistant' && (
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => copyToClipboard(msg.content)}
                  style={{ opacity: 0.5, transition: 'opacity 0.2s', padding: '4px' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {chat.loading && (
        <div style={{ display: 'flex', gap: '20px', maxWidth: '800px', width: '100%', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-glow)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '14px', width: '80px', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '12px', width: '100%', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '12px', width: '60%', background: 'var(--bg-tertiary)', borderRadius: '4px' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
