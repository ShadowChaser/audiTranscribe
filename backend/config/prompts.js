// Summary generation prompts
export const SUMMARY_PROMPT = `You are an expert technical writer. Create detailed, structured notes from the following transcript. Focus on the main subject and provide comprehensive explanations.

MAIN SUBJECT: [Auto-detect and specify the primary subject]
COMPLEXITY: [Basic/Intermediate/Advanced]

KEY CONCEPTS:
1. [Concept 1]
   - Definition
   - How it works
   - When to use it
   - Example
2. [Concept 2]
   - Definition
   - How it works
   - When to use it
   - Example

CODE EXAMPLES:
[Include relevant code snippets with explanations]

BEST PRACTICES:
- [List important best practices]
- [Common patterns and anti-patterns]
- [Performance considerations]

COMMON ISSUES:
- [Common mistakes and solutions]
- [Debugging tips]
- [Troubleshooting steps]

Text to analyze:
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

export const DETAILED_STUDY_NOTES_PROMPT = `You are an expert educator creating comprehensive, visually rich study materials. Analyze the following text to identify the main subject and generate detailed notes accordingly.

## 📌 Subject Analysis
1. **Main Topic**: [Auto-detect the primary subject and provide a brief description]
2. **Key Themes**: [List 3-5 main themes with brief explanations]
3. **Complexity Level**: [Basic/Intermediate/Advanced]
4. **Related Fields**: [List related academic or professional fields]

## 📚 Comprehensive Notes

### 1. 🎯 Core Concepts
- **Fundamental Principles**: [Explain the core principles of the subject]
- **Key Terminology**: [Define important terms with examples]
- **Theoretical Framework**: [Describe the main theories or models]
- **Historical Development**: [Provide context on how the subject has evolved]

### Real-world Applications
- Practical use cases with specific examples
- Industry applications and case studies
- Current trends and future implications

## 2. 🖼️ Visual Learning Aids

### Dynamic Visualizations
[Based on the subject matter, include 2-3 of the most relevant types of diagrams from the following options:]

#### Option 1: Process Flow (for procedures, algorithms, workflows)
\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E
\`\`\`

#### Option 2: Concept Map (for relationships between ideas)
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
- **Detailed Breakdown**: [Provide a comprehensive explanation of key concepts]
- **Step-by-Step Walkthroughs**: [Break down complex processes into clear steps]
- **Common Pitfalls**: [List common mistakes and how to avoid them]
- **Advanced Concepts**: [Dive deeper into complex aspects of the subject]

### Case Studies
- **Real-World Example 1**: [Case study with analysis]
  - Context and background
  - Key challenges and solutions
  - Outcomes and lessons learned
- **Industry Application**: [How this is used in industry]
  - Current implementations
  - Success metrics
  - Future potential

## 4. 🧠 Advanced Insights
### Expert Perspectives
- **Theoretical Frameworks**: [Different academic perspectives]
- **Controversial Viewpoints**: [Debated aspects of the subject]
- **Emerging Trends**: [Latest developments and research]
- **Future Directions**: [Where the field is heading]

### Practical Exercises
1. **Exercise: [Specific Exercise Name]**
   - **Objective**: [Clear goal of the exercise]
   - **Steps**:
     1. [Step 1 description]
     2. [Step 2 description]
     3. [Step 3 description]
   - **Expected Outcome**: [What should be achieved]
   - **Common Mistakes**: [What to watch out for]

2. **Exercise: [Another Exercise Name]**
   - **Objective**: [Clear goal]
   - **Steps**: [Detailed steps]
   - **Expected Outcome**: [Expected results]
   - **Tips for Success**: [Helpful advice]

## 5. 📊 Visual Summaries
### Interactive Mind Map
\`\`\`mermaid
mindmap
  root(("Main Topic"))
    "Key Concept 1"
      "Sub-concept 1.1"
      "Sub-concept 1.2"
    "Key Concept 2"
      "Sub-concept 2.1"
      "Sub-concept 2.2"
\`\`\`

### Process Flow
\`\`\`mermaid
flowchart TD
    A["Start"] --> B["Step 1"]
    B --> C["Step 2"]
    C --> D{"Decision"}
    D -->|"Yes"| E["Path A"]
    D -->|"No"| F["Path B"]
    E --> G["End"]
    F --> G
\`\`\`

## 6. 📝 Key Takeaways
1. **Core Insight 1**: [Main point]
2. **Core Insight 2**: [Main point]
3. **Core Insight 3**: [Main point]
4. **Action Items**: [Concrete next steps]
5. **Key Terms**: [Important terminology]

## 7. 📚 Additional Resources
### Recommended Reading
- **Books**: [Relevant books with authors]
- **Research Papers**: [Key papers in the field]
- **Articles**: [Informative articles]

### Learning Resources
- **Online Courses**: [Platform: Course Name]
- **Tutorials**: [Type of tutorials]
- **Documentation**: [Official documentation]

### Tools & Software
- [Tool 1]: [Brief description]
- [Tool 2]: [Brief description]
- [Tool 3]: [Brief description]

### Communities & Forums
- [Community 1]: [Brief description]
- [Forum 1]: [Brief description]

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
