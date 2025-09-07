import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';

const Pre = ({ children }) => (
  <pre className="mb-4 p-4 bg-gray-100 rounded-md overflow-x-auto">
    {children}
  </pre>
);

const Code = ({ inline, className, children, ...props }) => {
  return !inline ? (
    <code className={`${className || ''} bg-gray-100 p-1 rounded`} {...props}>
      {children}
    </code>
  ) : (
    <code className="bg-gray-100 p-1 rounded" {...props}>
      {children}
    </code>
  );
};

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
        components={{
          code: Code,
          pre: Pre,
          a: ({ ...props }) => (
            <a 
              {...props} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse" {...props} />
            </div>
          ),
          th: ({ ...props }) => (
            <th 
              {...props} 
              className="border border-gray-300 px-4 py-2 bg-gray-100 text-left"
            />
          ),
          td: ({ ...props }) => (
            <td 
              {...props} 
              className="border border-gray-300 px-4 py-2"
            />
          ),
          blockquote: ({ ...props }) => (
            <blockquote 
              {...props} 
              className="border-l-4 border-gray-300 pl-4 my-4 italic"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
