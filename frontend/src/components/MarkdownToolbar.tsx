'use client';

import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table,
  Link2,
  FileCode,
  Copy,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

interface ToolbarProps {
  onInsertMarkdown: (prefix: string, suffix?: string, defaultText?: string) => void;
  content: string;
}

export function MarkdownToolbar({ onInsertMarkdown, content }: ToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const tools = [
    { icon: Heading1, title: 'Heading 1', action: () => onInsertMarkdown('# ', '', 'Heading 1') },
    { icon: Heading2, title: 'Heading 2', action: () => onInsertMarkdown('## ', '', 'Heading 2') },
    { icon: Heading3, title: 'Heading 3', action: () => onInsertMarkdown('### ', '', 'Heading 3') },
    { separator: true },
    { icon: Bold, title: 'Bold (Ctrl+B)', action: () => onInsertMarkdown('**', '**', 'bold text') },
    { icon: Italic, title: 'Italic (Ctrl+I)', action: () => onInsertMarkdown('*', '*', 'italic text') },
    { icon: Code, title: 'Inline Code', action: () => onInsertMarkdown('`', '`', 'code') },
    { separator: true },
    { icon: List, title: 'Bullet List', action: () => onInsertMarkdown('- ', '', 'List item') },
    { icon: ListOrdered, title: 'Numbered List', action: () => onInsertMarkdown('1. ', '', 'First item') },
    { icon: CheckSquare, title: 'Checklist Task', action: () => onInsertMarkdown('- [ ] ', '', 'Task item') },
    { icon: Quote, title: 'Blockquote', action: () => onInsertMarkdown('> ', '', 'Quote note') },
    { separator: true },
    {
      icon: FileCode,
      title: 'Code Block',
      action: () => onInsertMarkdown('```typescript\n', '\n```', '// Your code here\nconsole.log("BranchWiki");'),
    },
    {
      icon: Table,
      title: 'Table',
      action: () =>
        onInsertMarkdown(
          '| Column 1 | Column 2 | Status |\n|:---|:---|:---|\n| Item A | Description | Done |\n| Item B | Detail | In Progress |\n',
          '',
          ''
        ),
    },
    { icon: Link2, title: 'Link', action: () => onInsertMarkdown('[', '](https://example.com)', 'Link Title') },
  ];

  return (
    <div className="h-8 bg-surface-panel border-b border-border/80 px-2 flex items-center justify-between text-content-secondary flex-shrink-0 select-none">
      <div className="flex items-center gap-0.5 overflow-x-auto py-0.5 scrollbar-none">
        {tools.map((item, idx) => {
          if (item.separator) {
            return <div key={`sep-${idx}`} className="w-[1px] h-3.5 bg-border mx-1 flex-shrink-0" />;
          }

          const Icon = item.icon!;
          return (
            <button
              key={item.title}
              onClick={item.action}
              className="p-1 rounded hover:bg-surface-hover hover:text-content-primary transition-colors text-content-secondary flex items-center justify-center"
              title={item.title}
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      {/* Copy document content button */}
      <button
        onClick={handleCopy}
        className={clsx(
          'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors border border-transparent',
          copied
            ? 'text-status-success bg-status-success/10 border-status-success/20'
            : 'text-content-tertiary hover:text-content-primary hover:bg-surface-hover hover:border-border'
        )}
        title="Copy complete markdown content to clipboard"
      >
        {copied ? (
          <>
            <Check size={11} className="text-status-success" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy size={11} />
            <span className="hidden sm:inline">Copy MD</span>
          </>
        )}
      </button>
    </div>
  );
}
