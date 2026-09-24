'use client';

import React from 'react';
import { useWikiStore } from '@/lib/store';
import {
  GitBranch,
  Radio,
  FileText,
  ListTree,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Eye,
  Columns,
  Edit3,
} from 'lucide-react';
import clsx from 'clsx';

export function StatusBar() {
  const {
    currentBranch,
    currentFile,
    fileContent,
    isDirty,
    collaborators,
    cursorPos,
    outlineOpen,
    setOutlineOpen,
    setShortcutsDialogOpen,
    setBranchDialogOpen,
    setCommitDialogOpen,
    viewMode,
    setViewMode,
  } = useWikiStore();

  const wordCount = fileContent.trim() ? fileContent.trim().split(/\s+/).length : 0;
  const charCount = fileContent.length;

  return (
    <footer className="h-6 bg-surface-panel border-t border-border px-3 flex items-center justify-between text-[11px] text-content-tertiary select-none flex-shrink-0 z-20">
      {/* Left items */}
      <div className="flex items-center gap-3">
        {/* Branch pill */}
        <button
          onClick={() => setBranchDialogOpen(true)}
          className="flex items-center gap-1 text-content-secondary hover:text-accent transition-colors font-mono"
          title="Switch branch"
        >
          <GitBranch size={12} className="text-accent" />
          <span>{currentBranch}</span>
        </button>

        <span className="w-[1px] h-3 bg-border" />

        {/* Working tree status */}
        <button
          onClick={() => setCommitDialogOpen(true)}
          className="flex items-center gap-1.5 hover:text-content-primary transition-colors"
          title={isDirty ? 'Uncommitted changes - Click to commit' : 'Working tree clean'}
        >
          {isDirty ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
              <span className="text-status-warning font-medium">Uncommitted changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={11} className="text-status-success" />
              <span>Clean</span>
            </>
          )}
        </button>

        {/* Collaborators presence */}
        {collaborators.length > 0 && (
          <>
            <span className="w-[1px] h-3 bg-border" />
            <div className="flex items-center gap-1 text-accent font-medium">
              <Radio size={11} className="animate-pulse-subtle" />
              <span>{collaborators.length} online</span>
            </div>
          </>
        )}
      </div>

      {/* Center item: Current file */}
      {currentFile && (
        <div className="hidden md:flex items-center gap-1.5 text-content-secondary font-mono truncate max-w-xs">
          <FileText size={11} className="text-content-tertiary" />
          <span className="truncate">{currentFile}</span>
        </div>
      )}

      {/* Right items */}
      <div className="flex items-center gap-3">
        {currentFile && (
          <>
            <span className="font-mono">
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span className="w-[1px] h-3 bg-border" />
            <span>
              {wordCount} words ({charCount} chars)
            </span>
            <span className="w-[1px] h-3 bg-border" />
            <button
              onClick={() => setOutlineOpen(!outlineOpen)}
              className={clsx(
                'flex items-center gap-1 transition-colors',
                outlineOpen ? 'text-accent font-medium' : 'hover:text-content-primary'
              )}
              title="Toggle document outline"
            >
              <ListTree size={11} />
              <span className="hidden sm:inline">Outline</span>
            </button>
            <span className="w-[1px] h-3 bg-border" />
          </>
        )}

        {/* View Mode shortcut */}
        <div className="flex items-center gap-1 bg-surface-hover/60 rounded px-1 py-0.5">
          <button
            onClick={() => setViewMode('edit')}
            className={clsx('px-1 rounded', viewMode === 'edit' && 'text-accent font-medium')}
            title="Edit mode"
          >
            Edit
          </button>
          <span>/</span>
          <button
            onClick={() => setViewMode('preview')}
            className={clsx('px-1 rounded', viewMode === 'preview' && 'text-accent font-medium')}
            title="Preview mode"
          >
            Preview
          </button>
          <span>/</span>
          <button
            onClick={() => setViewMode('split')}
            className={clsx('px-1 rounded', viewMode === 'split' && 'text-accent font-medium')}
            title="Split mode"
          >
            Split
          </button>
        </div>

        <span className="w-[1px] h-3 bg-border" />

        {/* Shortcuts modal trigger */}
        <button
          onClick={() => setShortcutsDialogOpen(true)}
          className="flex items-center gap-1 text-content-tertiary hover:text-content-primary transition-colors"
          title="View Keyboard Shortcuts (?)"
        >
          <Keyboard size={11} />
          <span className="hidden sm:inline">Shortcuts</span>
        </button>
      </div>
    </footer>
  );
}
