import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';

const Pre = ({ children }) => (
  <pre style={{
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid var(--border-primary)',
    overflowX: 'auto',
    margin: '16px 0'
  }}>
    {children}
  </pre>
);

const Code = ({ inline, className, children, ...props }) => {
  return inline ? (
    <code style={{
      background: 'rgba(255, 255, 255, 0.08)',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.9em',
      color: 'var(--text-accent)'
    }} {...props}>
      {children}
    </code>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-content" style={{
      color: 'var(--text-primary)',
      lineHeight: '1.7',
      fontSize: '1rem'
    }}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
        components={{
          code: Code,
          pre: Pre,
          h1: ({node, ...props}) => <h1 style={{fontSize: '1.5rem', fontWeight: '800', margin: '24px 0 12px 0', letterSpacing: '-0.5px'}} {...props} />,
          h2: ({node, ...props}) => <h2 style={{fontSize: '1.25rem', fontWeight: '700', margin: '20px 0 10px 0'}} {...props} />,
          h3: ({node, ...props}) => <h3 style={{fontSize: '1.1rem', fontWeight: '700', margin: '16px 0 8px 0'}} {...props} />,
          p: ({node, ...props}) => <p style={{marginBottom: '16px'}} {...props} />,
          ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc'}} {...props} />,
          ol: ({node, ...props}) => <ol style={{paddingLeft: '20px', marginBottom: '16px', listStyleType: 'decimal'}} {...props} />,
          li: ({node, ...props}) => <li style={{marginBottom: '6px'}} {...props} />,
          blockquote: ({node, ...props}) => (
            <blockquote style={{
              borderLeft: '4px solid var(--text-accent)',
              paddingLeft: '16px',
              margin: '20px 0',
              fontStyle: 'italic',
              color: 'var(--text-secondary)'
            }} {...props} />
          ),
          table: ({node, ...props}) => (
            <div style={{ overflowX: 'auto', margin: '24px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} />
            </div>
          ),
          th: ({node, ...props}) => (
            <th style={{ 
              border: '1px solid var(--border-primary)', 
              padding: '12px', 
              background: 'rgba(255,255,255,0.03)',
              textAlign: 'left',
              fontWeight: '700'
            }} {...props} />
          ),
          td: ({node, ...props}) => (
            <td style={{ 
              border: '1px solid var(--border-primary)', 
              padding: '12px'
            }} {...props} />
          ),
          a: ({node, ...props}) => (
            <a style={{ color: 'var(--text-accent)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
