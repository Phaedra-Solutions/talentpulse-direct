'use client';

import React, { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  List, 
  Code, 
  Eye, 
  Edit3, 
  Columns 
} from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write detailed job description, responsibilities, and requirements...',
  rows = 12,
}: RichTextEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  return (
    <div className="border-2 border-[#111113] bg-white">
      {/* Formatting Toolbar */}
      <div className="p-2 bg-[#F8F7F4] border-b-2 border-[#111113] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => insertFormatting('## ', '', 'Section Title')}
            className="p-1.5 border border-[#111113]/40 hover:border-[#111113] hover:bg-white text-[#111113] text-xs font-mono font-bold flex items-center gap-1"
            title="Heading 2 (## Title)"
          >
            <Heading2 className="w-3.5 h-3.5" />
            <span className="text-[10px]">H2</span>
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('### ', '', 'Sub-section Title')}
            className="p-1.5 border border-[#111113]/40 hover:border-[#111113] hover:bg-white text-[#111113] text-xs font-mono font-bold flex items-center gap-1"
            title="Heading 3 (### Subtitle)"
          >
            <Heading3 className="w-3.5 h-3.5" />
            <span className="text-[10px]">H3</span>
          </button>

          <div className="h-4 w-px bg-[#111113]/20 mx-1" />

          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'bold text')}
            className="p-1.5 border border-[#111113]/40 hover:border-[#111113] hover:bg-white text-[#111113] text-xs"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            className="p-1.5 border border-[#111113]/40 hover:border-[#111113] hover:bg-white text-[#111113] text-xs"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('- ', '', 'List item')}
            className="p-1.5 border border-[#111113]/40 hover:border-[#111113] hover:bg-white text-[#111113] text-xs"
            title="Bullet list (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('`', '`', 'code')}
            className="p-1.5 border border-[#111113]/40 hover:border-[#111113] hover:bg-white text-[#111113] text-xs"
            title="Inline Code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-white border border-[#111113] p-0.5">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition-colors ${
              mode === 'edit'
                ? 'bg-[#111113] text-white'
                : 'text-[#111113]/70 hover:text-[#111113]'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('split')}
            className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition-colors ${
              mode === 'split'
                ? 'bg-[#111113] text-white'
                : 'text-[#111113]/70 hover:text-[#111113]'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>Split</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition-colors ${
              mode === 'preview'
                ? 'bg-[#111113] text-white'
                : 'text-[#111113]/70 hover:text-[#111113]'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`grid ${mode === 'split' ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-2 divide-[#111113]' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={rows}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full p-3 font-mono text-xs text-[#111113] bg-transparent resize-y focus:outline-hidden leading-relaxed"
            />
          </div>
        )}

        {(mode === 'preview' || mode === 'split') && (
          <div className="p-4 bg-[#F8F7F4]/50 overflow-y-auto max-h-[350px]">
            <div className="font-mono text-[10px] uppercase text-[#111113]/50 tracking-wider mb-2 font-bold">
              [LIVE PREVIEW]
            </div>
            {value.trim().length === 0 ? (
              <p className="font-mono text-xs text-[#111113]/40 italic">
                Description preview will appear here as you type...
              </p>
            ) : (
              <MarkdownViewer content={value} />
            )}
          </div>
        )}
      </div>

      {/* Editor Footer Hint */}
      <div className="p-2 bg-[#F8F7F4] border-t border-[#111113]/10 font-mono text-[10px] text-[#111113]/60 flex items-center justify-between">
        <span>Markdown supported: ## Headings, **Bold**, - Lists, `code`</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
}
