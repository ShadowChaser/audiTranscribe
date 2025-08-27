import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '2rem 1rem',
      opacity: 0.7
    }}>
      <div>© {new Date().getFullYear()} Audio Transcriber · Local Whisper + Ollama</div>
    </footer>
  );
}
