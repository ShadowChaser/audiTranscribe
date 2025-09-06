import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';

export default function SummaryCard({ summary, onCopy }) {
  if (!summary) return null;
  return (
    <div className="card col-12" style={{marginTop: '1rem'}}>
      <div className="card-header">
        <div className="card-icon">🧠</div>
        <div style={{flex: 1}}>
          <h3 className="card-title">Summary</h3>
          <p className="card-description">Concise study notes generated locally via Ollama</p>
        </div>
        <button 
          onClick={async (e) => {
            e.stopPropagation();
            try {
              // Configure marked with enhanced options
              marked.setOptions({
                gfm: true,
                breaks: true,
                headerIds: true,
                headerPrefix: '',
                mangle: false,
                xhtml: true
              });
              
              // Pre-process markdown to fix common formatting issues
              const processedMarkdown = summary
                // Fix headers with === or --- underlines
                .replace(/^(.+)[\r\n]=+$/gm, '# $1')
                .replace(/^(.+)[\r\n]-+$/gm, '## $1')
                // Fix malformed headers
                .replace(/^#\s*\n([^#\n].*)\n#*\s*$/gm, '# $1')
                .replace(/^##\s*\n([^#\n].*)\n#*\s*$/gm, '## $1');
              
              // Convert markdown to HTML
              const html = marked.parse(processedMarkdown);
              
              // Create a simple HTML document with basic styling
              const styledHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                      line-height: 1.6; 
                      color: #24292e;
                      max-width: 800px;
                      margin: 0 auto;
                      padding: 20px;
                    }
                    h1, h2, h3, h4, h5, h6 { 
                      margin: 1.5em 0 0.5em;
                      line-height: 1.2;
                      font-weight: 600;
                    }
                    h1 { 
                      font-size: 2em;
                      border-bottom: 1px solid #eaecef;
                      padding-bottom: 0.3em;
                    }
                    h2 { 
                      font-size: 1.5em;
                      border-bottom: 1px solid #eaecef;
                      padding-bottom: 0.3em;
                    }
                    h3 { 
                      font-size: 1.25em;
                    }
                    p { 
                      margin: 1em 0;
                      line-height: 1.6;
                    }
                    pre { 
                      background: #f6f8fa;
                      padding: 1em;
                      border-radius: 6px;
                      overflow-x: auto;
                    }
                    code { 
                      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                      background: rgba(27,31,35,0.05);
                      padding: 0.2em 0.4em;
                      border-radius: 3px;
                      font-size: 0.9em;
                    }
                    pre code {
                      padding: 0;
                      background: transparent;
                      font-size: 0.9em;
                    }
                    ul, ol {
                      padding-left: 2em;
                      margin: 1em 0;
                    }
                    li {
                      margin-bottom: 0.5em;
                      line-height: 1.6;
                    }
                    strong, b {
                      font-weight: 600;
                    }
                    em, i {
                      font-style: italic;
                    }
                    blockquote {
                      border-left: 4px solid #dfe2e5;
                      margin: 1em 0;
                      padding: 0 1em;
                      color: #6a737d;
                    }
                  </style>
                </head>
                <body>${html}</body>
                </html>
              `;

              if (navigator.clipboard && window.ClipboardItem) {
                const blob = new Blob([styledHtml], { type: 'text/html' });
                const textBlob = new Blob([summary], { type: 'text/plain' });
                const data = new ClipboardItem({
                  'text/html': blob,
                  'text/plain': textBlob
                });
                await navigator.clipboard.write([data]);
              } else {
                await navigator.clipboard.writeText(summary);
              }
              
              // Show success message
              const toast = (await import('react-toastify')).toast;
              toast.success('Copied to clipboard!');
            } catch (err) {
              console.error('Failed to copy:', err);
              // Fallback to default copy behavior
              onCopy?.();
            }
          }}
          className="btn btn-outline btn-sm"
          style={{marginLeft: 'auto'}}
        >
          📋 Copy
        </button>
      </div>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          color: '#ffffff',
          margin: 0,
          fontFamily: 'inherit',
          fontSize: '1rem',
          lineHeight: '1.6'
        }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {summary}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
