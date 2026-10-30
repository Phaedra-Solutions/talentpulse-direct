'use client';

import React from 'react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  if (!content) return null;

  // Simple, robust, lightweight markdown parser for job descriptions
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-3 space-y-1.5 text-xs text-[#111113]/85 leading-relaxed">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInline = (text: string) => {
    // Handle bold: **text**
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Process bold (**...**) and inline code (`...`)
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={keyIdx++} className="font-bold text-[#111113]">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(<code key={keyIdx++} className="bg-[#111113]/10 px-1 py-0.5 font-mono text-[11px] text-[#FF4D00]">{token.slice(1, -1)}</code>);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={keyIdx++} className="italic text-[#111113]/90">{token.slice(1, -1)}</em>);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      return;
    }

    // Heading 3: ### Heading
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="font-syne font-bold text-base text-[#111113] mt-5 mb-2 uppercase tracking-wide">
          {trimmed.slice(4)}
        </h3>
      );
      return;
    }

    // Heading 2: ## Heading
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="font-syne font-extrabold text-lg text-[#111113] mt-6 mb-2.5 uppercase tracking-wide border-b border-[#111113]/15 pb-1">
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }

    // Bullet list item: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(
        <li key={index} className="pl-1">
          {formatInline(trimmed.slice(2))}
        </li>
      );
      return;
    }

    // Paragraph
    flushList();
    elements.push(
      <p key={index} className="text-xs sm:text-sm text-[#111113]/85 leading-relaxed my-2">
        {formatInline(trimmed)}
      </p>
    );
  });

  flushList();

  return (
    <div className={`space-y-1 font-sans ${className}`}>
      {elements}
    </div>
  );
}
