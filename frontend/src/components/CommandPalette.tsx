'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWikiStore } from '@/lib/store';
import {
  FileText,
  GitBranch,
  GitCommit,
  GitMerge,
  Search,
  History,
  Eye,
  Edit3,
  GitCompare,
  Columns,
  Moon,
  Sun,
  List,
  Keyboard,
  Users,
  Terminal,
} from 'lucide-react';
import clsx from 'clsx';

interface Command {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords: string[];
}

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setSearchOpen,
    setCommitDialogOpen,
    setBranchDialogOpen,
    setMergeDialogOpen,
    setActivePanel,
    setViewMode,
    theme,
    setTheme,
    outlineOpen,
    setOutlineOpen,
    setShortcutsDialogOpen,
    setTypingCollaborator,
    collaborators,
    setCollaborators,
  } = useWikiStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'search',
      label: 'Search documents across wiki',
      category: 'Navigation',
      icon: <Search size={14} />,
      shortcut: '⌘K',
      action: () => { setCommandPaletteOpen(false); setSearchOpen(true); },
      keywords: ['find', 'search', 'query', 'document'],
    },
    {
      id: 'history',
      label: 'Open Git commit history & graph',
      category: 'Git',
      icon: <History size={14} />,
      shortcut: 'Alt+G',
      action: () => { setCommandPaletteOpen(false); setActivePanel('history'); },
      keywords: ['history', 'log', 'commits', 'graph', 'tree'],
    },
    {
      id: 'compare',
      label: 'Compare branches & inspect diffs',
      category: 'Git',
      icon: <GitCompare size={14} />,
      shortcut: 'Alt+D',
      action: () => { setCommandPaletteOpen(false); setActivePanel('diff'); },
      keywords: ['diff', 'compare', 'branch', 'changes'],
    },
    {
      id: 'commit',
      label: 'Commit staged changes to branch',
      category: 'Git',
      icon: <GitCommit size={14} />,
      shortcut: '⌘Enter',
      action: () => { setCommandPaletteOpen(false); setCommitDialogOpen(true); },
      keywords: ['commit', 'save', 'git', 'stage'],
    },
    {
      id: 'branch',
      label: 'Create new Git branch',
      category: 'Git',
      icon: <GitBranch size={14} />,
      shortcut: '⌘B',
      action: () => { setCommandPaletteOpen(false); setBranchDialogOpen(true); },
      keywords: ['branch', 'checkout', 'new', 'create'],
    },
    {
      id: 'merge',
      label: 'Merge branch into current HEAD',
      category: 'Git',
      icon: <GitMerge size={14} />,
      action: () => { setCommandPaletteOpen(false); setMergeDialogOpen(true); },
      keywords: ['merge', 'pull', 'integrate'],
    },
    {
      id: 'theme',
      label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`,
      category: 'View',
      icon: theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />,
      action: () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        setCommandPaletteOpen(false);
      },
      keywords: ['theme', 'dark', 'light', 'mode', 'color'],
    },
    {
      id: 'outline',
      label: 'Toggle document table of contents outline',
      category: 'View',
      icon: <List size={14} />,
      action: () => {
        setOutlineOpen(!outlineOpen);
        setCommandPaletteOpen(false);
      },
      keywords: ['outline', 'headings', 'toc', 'navigation'],
    },
    {
      id: 'split',
      label: 'Set view to Split editor + preview',
      category: 'View',
      icon: <Columns size={14} />,
      shortcut: 'Alt+3',
      action: () => { setCommandPaletteOpen(false); setViewMode('split'); },
      keywords: ['split', 'dual', 'side', 'preview'],
    },
    {
      id: 'edit',
      label: 'Set view to Code editor only',
      category: 'View',
      icon: <Edit3 size={14} />,
      shortcut: 'Alt+1',
      action: () => { setCommandPaletteOpen(false); setViewMode('edit'); },
      keywords: ['edit', 'write', 'monaco', 'code'],
    },
    {
      id: 'preview',
      label: 'Set view to Markdown preview only',
      category: 'View',
      icon: <Eye size={14} />,
      shortcut: 'Alt+2',
      action: () => { setCommandPaletteOpen(false); setViewMode('preview'); },
      keywords: ['preview', 'render', 'markdown'],
    },
    {
      id: 'shortcuts',
      label: 'Open Keyboard Shortcuts reference',
      category: 'Help',
      icon: <Keyboard size={14} />,
      shortcut: '?',
      action: () => { setCommandPaletteOpen(false); setShortcutsDialogOpen(true); },
      keywords: ['shortcuts', 'keys', 'hotkeys', 'cheat', 'help'],
    },
    {
      id: 'simulate-peer',
      label: 'Simulate peer collaboration & typing',
      category: 'Demo',
      icon: <Users size={14} />,
      action: () => {
        setCommandPaletteOpen(false);
        const peer = { id: 'peer-sim', name: 'Alex Chen', color: '#8B5CF6' };
        if (!collaborators.some(c => c.name === peer.name)) {
          setCollaborators([...collaborators, peer]);
        }
        setTypingCollaborator('Alex Chen');
        setTimeout(() => setTypingCollaborator(null), 4500);
      },
      keywords: ['simulate', 'peer', 'collaborator', 'typing', 'multiplayer'],
    },
  ];

  const filtered = query
    ? commands.filter(
        c =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase()) ||
          c.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : commands;

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] bg-black/60 backdrop-blur-xs"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="bg-surface-panel border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Input box */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface-panel">
          <Terminal size={15} className="text-accent shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search action..."
            className="flex-1 text-sm outline-none bg-transparent text-content-primary placeholder:text-content-tertiary"
          />
          <kbd className="text-[10px] text-content-tertiary bg-surface-hover px-1.5 py-0.5 rounded border border-border font-mono">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-72 overflow-y-auto py-1 divide-y divide-border/20">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={cmd.action}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors text-left group',
                i === selectedIndex
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-content-primary hover:bg-surface-hover'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={clsx(
                    'p-1 rounded shrink-0 transition-colors',
                    i === selectedIndex ? 'text-accent bg-accent/20' : 'text-content-tertiary bg-surface-hover'
                  )}
                >
                  {cmd.icon}
                </span>
                <span className="truncate">{cmd.label}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-[10px] uppercase tracking-wider text-content-tertiary">
                  {cmd.category}
                </span>
                {cmd.shortcut && (
                  <kbd
                    className={clsx(
                      'px-1.5 py-0.5 rounded text-[10px] font-mono border',
                      i === selectedIndex
                        ? 'bg-accent/20 border-accent/40 text-accent'
                        : 'bg-surface-hover border-border text-content-tertiary'
                    )}
                  >
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-content-tertiary">
              No matching commands found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-surface-bg flex items-center justify-between text-[11px] text-content-tertiary">
          <div className="flex items-center gap-2">
            <span>Navigation: <kbd className="font-mono text-[10px] bg-surface-panel px-1 py-0.5 rounded border border-border">↑</kbd> <kbd className="font-mono text-[10px] bg-surface-panel px-1 py-0.5 rounded border border-border">↓</kbd></span>
            <span>·</span>
            <span>Select: <kbd className="font-mono text-[10px] bg-surface-panel px-1 py-0.5 rounded border border-border">↵</kbd></span>
          </div>
          <span>BranchWiki Core</span>
        </div>
      </div>
    </div>
  );
}
