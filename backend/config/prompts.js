// Summary generation prompts
export const SUMMARY_PROMPT = `You are a world-class note-taker. Produce a polished, easy-to-skim MARKDOWN summary.

# Summary

## Key Points
- Main concepts and ideas
- Important details and context
- Key takeaways

## Action Items
- [ ] Tasks to complete
- [ ] Follow-up items

## Important Details
- Dates, numbers, and specific information
- Names and technical terms
- Any other critical information

Text to summarize:
"""
{text}
"""`;

export const STUDY_NOTES_PROMPT = `You are an assistant that creates clear, structured study notes.

Input: A transcript of a lecture, book chapter, or video.

Output: Summarized notes that are concise, organized, and easy to revise later.

Formatting Rules:
- Use short bullet points, not long paragraphs.
- Capture only the key ideas, arguments, or facts.
- Highlight definitions, formulas, or important terms in **bold**.
- If a process or sequence is explained, number the steps (1, 2, 3...).
- For comparisons, use a table format.
- Add a short "Key Takeaways" section at the end with the 3–5 most important insights.

Text to summarize:
"""
{text}
"""`;

export const DETAILED_STUDY_NOTES_PROMPT = `You are an expert educator creating comprehensive, visually rich study materials. Generate highly detailed notes with the following structure:

# 📚 Comprehensive Analysis

## 1. 🎯 Core Concepts
### Key Ideas
- Detailed explanations of each major concept with clear examples
- Underlying principles and theories
- Historical context and significance

### Real-world Applications
- Practical use cases with specific examples
- Industry applications and case studies
- Current trends and future implications

## 2. 🖼️ Visual Learning Aids
### Process Diagrams
\`\`\`mermaid
flowchart TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    B -->|No| D[Try Again]
\`\`\`

### Concept Maps
\`\`\`mermaid
graph LR
    A[Main Concept] --> B[Related Concept 1]
    A --> C[Related Concept 2]
    B --> D[Example 1]
    C --> E[Example 2]
\`\`\`

### Comparison Tables
| Feature | Concept A | Concept B |
|---------|-----------|-----------|
| Key Point 1 | Description | Description |
| Key Point 2 | Description | Description |
| Use Case | When to use | When to use |

## 3. 🔍 Deep Dive Analysis
### In-depth Explanations
- Detailed breakdown of complex topics
- Step-by-step walkthroughs
- Common pitfalls and how to avoid them

### Case Studies
- Real-world examples with analysis
- Success stories and lessons learned
- Data and statistics where applicable

## 4. 🧠 Advanced Insights
### Expert Perspectives
- Different theoretical approaches
- Controversial viewpoints
- Emerging research and developments

### Practical Exercises
1. **Exercise 1**: Problem statement
   - Step-by-step solution
   - Common mistakes to avoid
   - Alternative approaches

2. **Exercise 2**: Problem statement
   - Step-by-step solution
   - Common mistakes to avoid
   - Alternative approaches

## 5. 📊 Visual Summaries
### Mind Maps
\`\`\`mermaid
mindmap
  root((Main Topic))
    Key Concept 1
      Detail 1
      Detail 2
    Key Concept 2
      Detail 1
      Detail 2
\`\`\`

### Flowcharts for Processes
\`\`\`mermaid
sequenceDiagram
    participant A as User
    participant B as System
    A->>B: Request
    B->>A: Response
\`\`\`

## 6. 📝 Key Takeaways
- Bullet point summary of most important points
- Actionable insights
- Recommended next steps

## 7. 📚 Additional Resources
- Recommended reading
- Research papers
- Online courses and tutorials
- Tools and software

## Formatting Guidelines:
- Use clear, hierarchical headers (##, ###, ####)
- Include emojis for better visual scanning
- Use callout boxes for important notes:
  > 💡 Pro Tip: This is an important note
- Highlight key terms in **bold**
- Use numbered lists for sequences
- Use bullet points for related items
- Include code blocks with syntax highlighting when applicable

Text to summarize:
"""
{text}
"""`;

// Export a function to get the appropriate prompt based on style
export function getPromptForStyle(style) {
  switch (style) {
    case 'study':
      return STUDY_NOTES_PROMPT;
    case 'detailed':
      return DETAILED_STUDY_NOTES_PROMPT;
    case 'summary':
    default:
      return SUMMARY_PROMPT;
  }
}

// Export a function to format a prompt with the given text
export function formatPrompt(prompt, text) {
  return prompt.replace('{text}', text);
}
