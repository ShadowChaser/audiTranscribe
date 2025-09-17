const express = require('express');
const router = express.Router();
const { marked } = require('marked');

// Parse JSON bodies for this router
router.use(express.json());

// Convert markdown to HTML
router.post('/markdown-to-html', (req, res) => {
  try {
    console.log('Received request to convert markdown to HTML');
    console.log('Request body:', req.body);
    
    if (!req.body) {
      console.error('No request body received');
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    const { markdown } = req.body;
    if (!markdown) {
      console.error('No markdown content provided');
      return res.status(400).json({ error: 'Markdown content is required' });
    }
    
    console.log('Markdown content received, length:', markdown.length);
    
    // Convert markdown to HTML
    const html = marked.parse(markdown, {
      gfm: true,
      breaks: true,
      headerIds: true,
      mangle: false
    });
    
    // Add some basic styling
    const styledHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            line-height: 1.2;
          }
          h1 { font-size: 2em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.25em; }
          p { margin: 1em 0; }
          pre {
            background: #f4f4f4;
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
          }
          code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            background: #f4f4f4;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
          }
          pre code {
            padding: 0;
            background: transparent;
          }
          ul, ol {
            padding-left: 2em;
            margin: 1em 0;
          }
          li {
            margin-bottom: 0.5em;
          }
          a {
            color: #2563eb;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    res.set('Content-Type', 'text/html');
    res.send(styledHtml);
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    res.status(500).json({ error: 'Failed to convert markdown to HTML' });
  }
});

module.exports = router;
