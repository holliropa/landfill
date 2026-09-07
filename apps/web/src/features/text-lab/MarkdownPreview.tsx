import { useMemo } from "react";
import styles from "./MarkdownPreview.module.css";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const renderedHtml = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className={styles.markdownContent}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(markdown: string): string {
  if (!markdown) return "<p><em>No content</em></p>";

  const lines = markdown.split(/\r?\n/);
  const htmlChunks: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" = "ul";

  const closeListIfNeeded = () => {
    if (inList) {
      htmlChunks.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        htmlChunks.push(
          `<pre class="${styles.codeBlock}"><code class="${codeBlockLang ? `language-${codeBlockLang}` : ""}">${escapeHtml(codeBlockLines.join("\n"))}</code></pre>`,
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = "";
      } else {
        closeListIfNeeded();
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Blank line
    if (!line.trim()) {
      closeListIfNeeded();
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeListIfNeeded();
      const level = headingMatch[1].length;
      const text = parseInline(headingMatch[2]);
      htmlChunks.push(
        `<h${level} class="${styles[`h${level}`]}">${text}</h${level}>`,
      );
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      closeListIfNeeded();
      htmlChunks.push(`<hr class="${styles.hr}" />`);
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      closeListIfNeeded();
      const text = parseInline(line.replace(/^>\s?/, ""));
      htmlChunks.push(
        `<blockquote class="${styles.blockquote}">${text}</blockquote>`,
      );
      continue;
    }

    // Unordered List item (- or *)
    const ulMatch = line.match(/^[*-]\s+(.*)$/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        closeListIfNeeded();
        htmlChunks.push(`<ul class="${styles.list}">`);
        inList = true;
        listType = "ul";
      }
      htmlChunks.push(`<li>${parseInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered List item (1.)
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        closeListIfNeeded();
        htmlChunks.push(`<ol class="${styles.list}">`);
        inList = true;
        listType = "ol";
      }
      htmlChunks.push(`<li>${parseInline(olMatch[1])}</li>`);
      continue;
    }

    // Standard paragraph
    closeListIfNeeded();
    htmlChunks.push(`<p class="${styles.paragraph}">${parseInline(line)}</p>`);
  }

  if (inCodeBlock) {
    htmlChunks.push(
      `<pre class="${styles.codeBlock}"><code>${escapeHtml(codeBlockLines.join("\n"))}</code></pre>`,
    );
  }

  closeListIfNeeded();

  return htmlChunks.join("\n");
}

function parseInline(text: string): string {
  let escaped = escapeHtml(text);

  // Inline code: `code`
  escaped = escaped.replace(
    /`([^`]+)`/g,
    `<code class="${styles.inlineCode}">$1</code>`,
  );

  // Bold: **text** or __text__
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_
  escaped = escaped.replace(/\*(.*?)\*/g, "<em>$1</em>");
  escaped = escaped.replace(/_(.*?)_/g, "<em>$1</em>");

  // Links: [label](url)
  escaped = escaped.replace(
    /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="' +
      styles.link +
      '">$1</a>',
  );

  return escaped;
}
