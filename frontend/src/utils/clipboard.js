/*
 * Enhanced clipboard utility functions
 * Provides consistent copy behavior across the application
 */

import { toast } from "react-toastify";
import { marked } from "marked";

// Reusable preprocessing for markdown coming from LLM
export const preprocessMarkdown = (markdown) => {
  if (!markdown) return "";
  
  return (
    markdown
      // Normalize windows newlines
      .replace(/\r\n/g, "\n")
      // Remove boilerplate intro lines produced by the model
      .replace(
        /^\s*Here is a polished,?\s*(?:easy-to-skim\s+)?MARKDOWN(?:\s+study)?\s+summary(?:\s+of\s+the\s+provided\s+text)?:\s*$/gim,
        ""
      )
      // Fix headers with === or --- underlines
      .replace(/^(.+)[\n]=+$/gm, "# $1")
      .replace(/^(.+)[\n]-+$/gm, "## $1")
      // Fix malformed headers
      .replace(/^#\s*\n([^#\n].*)\n#*\s*$/gm, "# $1")
      .replace(/^##\s*\n([^#\n].*)\n#*\s*$/gm, "## $1")
      // Clean conversation-summary artifacts if present
      .replace(
        /^- User stopped the query, there's no assistant response\.$/gm,
        ""
      )
      .replace(/^- The user reported that.*$/gm, "")
      .replace(/^- The assistant .*$/gm, "")
      // Format section headers (lines that are capitalized and short)
      .replace(/^(\s*)([A-Z][\w\s]+(?:\s*\([^)]+\))?)\s*$/gm, function (
        match,
        leading,
        p1
      ) {
        // Skip lines that already have markdown formatting
        if (p1.startsWith("#") || p1.startsWith("-") || p1.startsWith("*")) {
          return match;
        }
        // If it's a short phrase that looks like a header (less than 50 chars)
        if (p1.length < 50) {
          // Main headers (Virtual Environments, Traditional Way, etc.)
          if (p1.split(" ").length <= 5) {
            return `\n${leading}## ${p1}`;
          }
        }
        return match;
      })
      // Ensure code formatting for technical terms (light touch)
      .replace(/\b(virtualenv|conda|pip|uv)\b/g, "`$1`")
  );
};

/**
 * Process conversation summaries specifically
 * @param {string} content - The conversation summary content
 * @returns {string} - Processed content
 */
export const processConversationSummary = (content) => {
  if (!content) return "";
  
  // Make a copy of the content to avoid modifying the original
  let cleanedContent = content
    // Remove system messages and artifacts
    .replace(/^- User stopped the query, there's no assistant response\.$/gm, "")
    .replace(/^- The user reported that.*$/gm, "")
    .replace(/^- The assistant .*$/gm, "")
    .replace(/^<.*>$/gm, "")
    // Convert summary header to proper markdown
    .replace(/^Summary of the conversation(?:\s+so far)?:$/gm, "# Conversation Summary")
    .trim();

  // Convert bullet points that look like section headers to proper markdown headers
  cleanedContent = cleanedContent.replace(/^- ([A-Z][\w\s]+:)\s*$/gm, "## $1");
  
  return cleanedContent;
};

/**
 * Converts markdown to styled HTML for rich clipboard copying
 * @param {string} markdown - The markdown content to convert
 * @returns {string} - HTML string with styling
 */
export const markdownToHtml = (markdown) => {
  if (!markdown) return "";
  
  // Configure marked with enhanced options
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    headerPrefix: "",
    mangle: false,
    xhtml: true,
  });

  const processedMarkdown = preprocessMarkdown(markdown)
    // Heuristic: turn bare lines into list items if they look like bullet-able facts
    .replace(/^(?![#>*`\-\*\d+\.\s])([A-Za-z].{0,120})$/gm, (m, p1) => {
      // Avoid converting very short single words that might be headings
      if (/^\s*(Introduction|Conclusion|Summary|Benefits)\s*$/i.test(p1)) {
        return p1; // keep as-is (likely handled by header heuristic above)
      }
      // If line contains punctuation likely indicating a sentence, prefer bullet
      if (/\b(are|is|use|uses|create|install|activate|deactivate|consider)\b/i.test(p1)) {
        return `* ${p1.trim()}`;
      }
      return p1;
    });

  // Convert markdown to HTML
  const html = marked.parse(processedMarkdown);

  // Create a simple HTML document with basic styling (many paste targets ignore CSS, but keep basic semantics)
  return `
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
          margin: 1.2em 0 0.6em;
          line-height: 1.25;
          font-weight: 600;
        }
        h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        h3 { font-size: 1.25em; }
        p { margin: 0.6em 0; }
        pre { background: #f6f8fa; padding: 1em; border-radius: 6px; overflow-x: auto; }
        code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; background: rgba(27,31,35,0.05); padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
        pre code { padding: 0; background: transparent; font-size: 0.9em; }
        ul, ol { padding-left: 2em; margin: 0.6em 0; }
        li { margin-bottom: 0.4em; line-height: 1.6; }
        strong, b { font-weight: 600; }
        em, i { font-style: italic; }
        blockquote { border-left: 4px solid #dfe2e5; margin: 1em 0; padding: 0 1em; color: #6a737d; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `;
};

// Plain-text representation that looks good when pasted where HTML is ignored
/**
 * Converts markdown to properly formatted plain text for PDF export
 * @param {string} markdown - The markdown content to convert
 * @returns {string} - Plain text with proper formatting
 */
export const markdownToPDFText = (markdown) => {
  if (!markdown) return "";
  
  let text = preprocessMarkdown(markdown);

  // Convert headers to uppercase with proper spacing
  text = text
    // Headers: # Header -> HEADER
    .replace(/^#{1,6}\s+(.+)$/gm, (m, h) => `\n${h.toUpperCase()}\n`)
    // Bold: **text** -> TEXT
    .replace(/\*\*([^*]+)\*\*/g, (m, p1) => p1.toUpperCase())
    // Italic: *text* -> text (preserve as is)
    .replace(/\*([^*]+)\*/g, "$1")
    // Code blocks: ```code``` -> code (with indentation)
    .replace(/```([\s\S]*?)```/g, (m, code) => {
      const indented = code
        .split("\n")
        .map((l) => (l.trim().length ? `    ${l}` : ""))
        .join("\n");
      return `\n${indented}\n`;
    })
    // Inline code: `code` -> code
    .replace(/`([^`]+)`/g, "$1")
    // Lists: convert markdown lists to proper bullet points
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, (m, i) => `${i}. `)
    // Links: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Images: ![alt](url) -> [alt]
    .replace(/!\[([^\]]+)\]\([^)]+\)/g, "[$1]")
    // Horizontal rules
    .replace(/^\s*[-*_]{3,}\s*$/gm, "\n----------------------------\n")
    // Blockquotes
    .replace(/^>\s+(.+)$/gm, "    $1")
    // Collapse excess blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
};

// Plain-text representation that looks good when pasted where HTML is ignored
export const markdownToPlainText = (markdown) => {
  if (!markdown) return "";
  
  let text = preprocessMarkdown(markdown);

  // Normalize code blocks by indenting
  text = text
    .replace(/```([\s\S]*?)```/g, (m, code) => {
      const indented = code
        .split("\n")
        .map((l) => (l.trim().length ? `    ${l}` : ""))
        .join("\n");
      return `\n${indented}\n`;
    })
    // Headings -> uppercase with spacing
    .replace(/^#{1,6}\s*(.+)$/gm, (m, h) => `\n${h.toUpperCase()}\n`)
    // Lists: -, * , 1. -> bullet glyph
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, (m) => `${"• ".repeat(1)}`)
    // Collapse excess blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
};

/**
 * Enhanced clipboard copy function that preserves formatting when copying markdown
 * @param {string} content - The content to copy (plain text or markdown)
 * @returns {Promise<void>}
 */
export const copyToClipboard = async (content) => {
  if (!content) {
    toast.info("Nothing to copy");
    return;
  }
  
  try {
    // Check if content is markdown (contains markdown syntax)
    // More comprehensive regex to detect markdown patterns including headers, lists, etc.
    const isMarkdown = /([#*_`\[\]]|\n\s*[-*+]\s|\n\s*\d+\.\s)/.test(content);

    // Clean up the content if it looks like a conversation summary
    if (
      content.includes("- The assistant") ||
      content.includes("- The user") ||
      content.includes("Summary of the conversation") ||
      content.match(/^- .*$/m) // Any line starting with "- "
    ) {
      content = processConversationSummary(content);
    }

    if (isMarkdown) {
      // Convert markdown to HTML and better plain text
      const styledHtml = markdownToHtml(content);
      const plainText = markdownToPlainText(content);
      const processedMd = preprocessMarkdown(content);

      // Try to copy as rich text (HTML) with fallbacks
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const htmlBlob = new Blob([styledHtml], { type: "text/html" });
          const textBlob = new Blob([plainText], { type: "text/plain" });
          const mdBlob = new Blob([processedMd], { type: "text/markdown" });
          const data = new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
            "text/markdown": mdBlob,
          });
          await navigator.clipboard.write([data]);
          toast.success("Copied to clipboard with formatting");
          return;
        } catch (clipErr) {
          console.warn("Rich clipboard copy failed, falling back to plain text", clipErr);
          // Continue to fallback
        }
      }
    }

    // Fallback to plain text (improve readability if it contains markdown-like content)
    const fallbackText = isMarkdown
      ? markdownToPlainText(content)
      : String(content ?? "");
    await navigator.clipboard.writeText(fallbackText);
    toast.success("Copied to clipboard");
  } catch (err) {
    console.error("Failed to copy:", err);
    // Last resort: show the text in a prompt for manual copy
    try {
      window.prompt("Copy to clipboard: Ctrl+C, Enter", content);
      toast.info("Please copy the text from the prompt");
    } catch (e) {
      console.error("Failed to show copy prompt:", e);
      toast.error("Failed to copy. Please select and copy manually.");
    }
  }
};
