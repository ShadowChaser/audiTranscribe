import FeedCard from "../components/FeedCard";
import { toast } from "react-toastify";
import { copyToClipboard } from "../utils/clipboard";

const ChatView = ({ chat }) => {
  return (
    <>
      {chat.messages.map((msg, index) => (
        <FeedCard
          key={index}
          avatar={msg.role === "user" ? "👤" : "🤖"}
          title={msg.role === "user" ? "You" : "Nexus AI"}
          subtitle={msg.timestamp.toLocaleTimeString()}
          fullText={msg.content}
          actions={[
            <button
              key="copy"
              onClick={() => copyToClipboard(msg.content)}
              className="btn btn-outline btn-sm"
              title="Copy message to clipboard"
            >
              📋 Copy
            </button>,
          ]}
        />
      ))}

      {chat.loading && (
        <div className="feed-card-item" aria-busy="true" aria-live="polite">
          <div className="feed-card-avatar skeleton skeleton-avatar" />
          <div className="feed-card-content">
            <div className="feed-card-header">
              <div className="feed-card-title-section">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-subtitle" />
              </div>
              <div className="feed-card-metadata">
                <span className="skeleton skeleton-meta" />
                <span className="skeleton skeleton-meta" />
              </div>
            </div>
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line sm" />
            <div className="feed-card-actions">
              <div className="skeleton skeleton-btn" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatView;
