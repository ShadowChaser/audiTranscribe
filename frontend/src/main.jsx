import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import mermaid from 'mermaid';
import './index.css';
import App from './App.jsx';

// Initialize Mermaid with default configuration
mermaid.initialize({
  startOnLoad: false, // We'll trigger rendering manually
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
