/**
 * STᚱ VTT — Journal Markdown Preview
 *
 * Lightweight markdown renderer for DM journal entries.
 * Supports: headers, bold, italic, lists, code blocks, links, and blockquotes.
 *
 * No external dependencies — pure regex-based transformation
 * suitable for the DM's operational journal notes.
 */

import { useMemo } from "react";

interface JournalMarkdownPreviewProps {
  content: string;
}

export default function JournalMarkdownPreview({ content }: JournalMarkdownPreviewProps) {
  const html = useMemo(() => {
    if (!content) return "";

    let result = escapeHtml(content);

    // ── Headers ──
    result = result.replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-gold-200 mt-4 mb-2">$1</h3>');
    result = result.replace(/^## (.+)$/gm, '<h2 class="text-base font-black text-gold-200 mt-5 mb-2">$1</h2>');
    result = result.replace(/^# (.+)$/gm, '<h1 class="text-lg font-black text-gold-200 mt-5 mb-3">$1</h1>');

    // ── Bold ──
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-surface-100">$1</strong>');

    // ── Italic ──
    result = result.replace(/\*(.+?)\*/g, '<em class="italic text-surface-200">$1</em>');

    // ── Inline code ──
    result = result.replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-[10px] font-mono text-amber-300">$1</code>');

    // ── Links ──
    result = result.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gold-400 underline hover:text-gold-300 underline-offset-2">$1</a>'
    );

    // ── Blockquotes ──
    result = result.replace(
      /^> (.+)$/gm,
      '<blockquote class="border-l-2 border-gold/30 pl-3 py-1 text-gold-300/70 italic text-[11px] my-2">$1</blockquote>'
    );

    // ── Horizontal rules ──
    result = result.replace(/^---$/gm, '<hr class="my-4 border-t border-white/[0.04]" />');

    // ── Unordered lists ──
    result = result.replace(/^- (.+)$/gm, '<li class="text-surface-300 text-[12px] ml-4 list-disc list-outside leading-relaxed">$1</li>');

    // ── Ordered lists ──
    result = result.replace(/^\d+\. (.+)$/gm, '<li class="text-surface-300 text-[12px] ml-4 list-decimal list-outside leading-relaxed">$1</li>');

    // ── Code blocks ──
    result = result.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="my-3 px-3 py-2 rounded-xl bg-surface-950/80 border border-white/[0.04] overflow-x-auto"><code class="text-[10px] font-mono text-amber-300/80 leading-relaxed block">$2</code></pre>'
    );

    // ── Paragraphs (double newlines) ──
    result = result.replace(/\n\n/g, '</p><p class="text-surface-300 text-[12px] leading-relaxed">');

    // ── Single newlines within paragraphs ──
    result = result.replace(/\n/g, '<br />');

    // ── Wrap in paragraphs if not already a block element ──
    if (!result.startsWith("<h") && !result.startsWith("<p") && !result.startsWith("<li") && !result.startsWith("<pre") && !result.startsWith("<blockquote")) {
      result = `<p class="text-surface-300 text-[12px] leading-relaxed">${result}</p>`;
    }

    return result;
  }, [content]);

  if (!content) {
    return (
      <span className="text-surface-600 italic text-[12px]">
        No content
      </span>
    );
  }

  return (
    <div
      className="prose prose-invert max-w-none space-y-1"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Escape HTML entities to prevent XSS from DM-entered content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
