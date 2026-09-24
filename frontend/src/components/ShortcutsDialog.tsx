'use client';

import React from 'react';
import { useWikiStore } from '@/lib/store';
import { Command, Keyboard, X } from 'lucide-react';

export function ShortcutsDialog() {
  const { shortcutsDialogOpen, setShortcutsDialogOpen } = useWikiStore();

  if (!shortcutsDialogOpen) return null;

  const shortcutGroups = [
    {
      title: 'General & Navigation',
      items: [
        { label: 'Command Palette', keys: ['⌘', 'K'] },
        { label: 'Search Documents', keys: ['⌘', 'P'] },
        { label: 'Toggle Sidebar', keys: ['⌘', 'B'] },
        { label: 'Keyboard Shortcuts Cheat Sheet', keys: ['?'] },
      ],
    },
    {
      title: 'Writing & Document',
      items: [
        { label: 'Save Document Locally', keys: ['⌘', 'S'] },
        { label: 'Edit View', keys: ['Alt', '1'] },
        { label: 'Preview View', keys: ['Alt', '2'] },
        { label: 'Split View', keys: ['Alt', '3'] },
        { label: 'Toggle Document Outline', keys: ['Alt', 'O'] },
      ],
    },
    {
      title: 'Git Versioning & Workflows',
      items: [
        { label: 'Open Commit Dialog', keys: ['⌘', 'Enter'] },
        { label: 'View Branch History Graph', keys: ['Alt', 'G'] },
        { label: 'View Side-by-Side Diff', keys: ['Alt', 'D'] },
        { label: 'Merge Branch', keys: ['Alt', 'M'] },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={() => setShortcutsDialogOpen(false)}
    >
      <div
        className="bg-surface-panel border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface-hover/30">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-content-primary">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => setShortcutsDialogOpen(false)}
            className="p-1 rounded text-content-tertiary hover:text-content-primary hover:bg-surface-hover"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-2">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-surface-hover transition-colors"
                  >
                    <span className="text-content-secondary">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 rounded bg-surface-bg border border-border text-[11px] font-mono text-content-primary shadow-2xs min-w-[20px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-2.5 bg-surface-hover/20 border-t border-border flex items-center justify-between text-[11px] text-content-tertiary">
          <span>Tip: Press ESC anytime to dismiss dialogs</span>
          <span className="font-mono">BranchWiki v1.0</span>
        </div>
      </div>
    </div>
  );
}
