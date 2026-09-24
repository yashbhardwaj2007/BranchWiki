'use client';

import React from 'react';
import { useWikiStore } from '@/lib/store';
import { ListTree, X, Hash } from 'lucide-react';
import clsx from 'clsx';

interface HeadingItem {
  level: number;
  text: string;
  line: number;
}

export function DocumentOutline({ onSelectHeading }: { onSelectHeading?: (line: number) => void }) {
  const { fileContent, outlineOpen, setOutlineOpen } = useWikiStore();

  if (!outlineOpen) return null;

  // Extract headings from markdown content
  const headings: HeadingItem[] = [];
  const lines = fileContent.split('\n');

  lines.forEach((lineText, idx) => {
    const match = lineText.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: idx + 1,
      });
    }
  });

  return (
    <div className="w-56 bg-surface-panel border-l border-border flex flex-col flex-shrink-0 overflow-hidden shadow-xs">
      <div className="h-9 px-3 border-b border-border flex items-center justify-between bg-surface-hover/30">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-content-primary">
          <ListTree size={13} className="text-accent" />
          <span>Outline</span>
          <span className="text-[10px] text-content-tertiary">({headings.length})</span>
        </div>
        <button
          onClick={() => setOutlineOpen(false)}
          className="p-1 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-hover"
          title="Close Outline"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {headings.length === 0 ? (
          <div className="text-center py-8 text-xs text-content-tertiary px-3">
            No headings found. Add # H1 or ## H2 to generate outline.
          </div>
        ) : (
          headings.map((h, i) => (
            <button
              key={`${h.line}-${i}`}
              onClick={() => onSelectHeading && onSelectHeading(h.line)}
              className={clsx(
                'w-full text-left text-xs py-1 px-1.5 rounded transition-colors hover:bg-surface-hover flex items-center gap-1 group truncate',
                h.level === 1 && 'font-semibold text-content-primary',
                h.level === 2 && 'pl-3 text-content-secondary',
                h.level >= 3 && 'pl-5 text-content-tertiary'
              )}
              title={`${h.text} (line ${h.line})`}
            >
              <Hash size={10} className="text-accent/60 flex-shrink-0 group-hover:text-accent" />
              <span className="truncate">{h.text}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
