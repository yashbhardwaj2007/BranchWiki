'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import { MarkdownPreview } from './MarkdownPreview';
import { MarkdownToolbar } from './MarkdownToolbar';
import { DocumentOutline } from './DocumentOutline';
import {
  Edit3,
  Eye,
  Columns,
  Save,
  Check,
  Users,
  Radio,
  ListTree,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then(m => m.default), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center text-content-tertiary text-xs">Loading Monaco editor...</div>
});

const API_HOST = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_HOST;

export function EditorArea({ onSave }: { onSave: () => void }) {
  const {
    wikiId,
    currentFile,
    fileContent,
    originalContent,
    viewMode,
    isDirty,
    collaborators,
    currentUser,
    typingCollaborator,
    currentBranch,
    theme,
    outlineOpen,
    setOutlineOpen,
    setFileContent,
    setIsDirty,
    setViewMode,
    setOriginalContent,
    setCollaborators,
    setTypingCollaborator,
    setCommitDialogOpen,
    setCursorPos,
  } = useWikiStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const editorRef = useRef<any>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRemoteUpdateRef = useRef(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('presence-update', (users: any[]) => {
      setCollaborators(users);
    });

    socket.on('user-typing', ({ user, isTyping }: { user: any; isTyping: boolean }) => {
      if (isTyping && user.name !== currentUser.name) {
        setTypingCollaborator(user.name);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          setTypingCollaborator(null);
        }, 2500);
      } else {
        setTypingCollaborator(null);
      }
    });

    socket.on('doc-change-remote', ({ content, senderId }: { content: string; senderId: string }) => {
      if (senderId !== socket.id) {
        isRemoteUpdateRef.current = true;
        setFileContent(content);
        setOriginalContent(content);
        setIsDirty(false);
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      }
    });

    return () => {
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join document room when currentFile or currentUser changes
  useEffect(() => {
    if (socketRef.current && currentFile) {
      socketRef.current.emit('join-document', {
        wikiId,
        filePath: currentFile,
        user: currentUser,
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-document');
      }
    };
  }, [wikiId, currentFile, currentUser]);

  const handleSave = useCallback(async () => {
    if (!currentFile || !isDirty) return;
    setSaving(true);
    try {
      await api.saveFile(wikiId, currentFile, fileContent);
      setIsDirty(false);
      setOriginalContent(fileContent);
      setSaved(true);
      setLastSaved(new Date());
      setTimeout(() => setSaved(false), 2000);
      onSave();
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setSaving(false);
    }
  }, [currentFile, fileContent, isDirty, wikiId, setIsDirty, setOriginalContent, onSave]);

  // Global Ctrl+S / Cmd+S handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;

    // Track cursor movements
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column,
      });
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
      setIsDirty(value !== originalContent);

      if (!isRemoteUpdateRef.current && socketRef.current && currentFile) {
        socketRef.current.emit('doc-change', {
          wikiId,
          filePath: currentFile,
          content: value,
        });

        socketRef.current.emit('typing', { isTyping: true });
      }
    }
  };

  // Helper to insert markdown from toolbar into Monaco
  const handleInsertMarkdown = (prefix: string, suffix: string = '', defaultText: string = '') => {
    if (!editorRef.current) {
      setFileContent(fileContent + '\n' + prefix + defaultText + suffix);
      return;
    }

    const editor = editorRef.current;
    const selection = editor.getSelection();
    const selectedText = editor.getModel().getValueInRange(selection);
    const insertText = selectedText || defaultText;
    const replacement = `${prefix}${insertText}${suffix}`;

    editor.executeEdits('toolbar-insert', [
      {
        range: selection,
        text: replacement,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  };

  const handleJumpToLine = (line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  };

  const fileName = currentFile?.split('/').pop() || '';
  const fileDir = currentFile?.split('/').slice(0, -1).join('/') || '';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-bg">
      {/* Editor Sub-Header Bar */}
      <div className="h-11 border-b border-border bg-surface-panel px-4 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-content-primary">{fileName}</h2>
              {isDirty && (
                <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse" title="Uncommitted working tree changes" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-content-tertiary">
              {fileDir && <span>{fileDir} /</span>}
              <span className="font-mono text-content-secondary font-medium">on {currentBranch}</span>
              {lastSaved && (
                <>
                  <span>·</span>
                  <span>saved {formatTimeAgo(lastSaved)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Animated typing indicator */}
          {typingCollaborator && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-medium animate-pulse shadow-glow-teal">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span>{typingCollaborator} is editing...</span>
            </div>
          )}

          {/* Mode switch */}
          <div className="flex items-center bg-surface-bg rounded-md border border-border p-0.5">
            {[
              { mode: 'edit' as const, icon: Edit3, label: 'Edit' },
              { mode: 'preview' as const, icon: Eye, label: 'Preview' },
              { mode: 'split' as const, icon: Columns, label: 'Split' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors',
                  viewMode === mode
                    ? 'bg-surface-panel text-content-primary shadow-xs'
                    : 'text-content-secondary hover:text-content-primary'
                )}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Outline toggle button */}
          <button
            onClick={() => setOutlineOpen(!outlineOpen)}
            className={clsx(
              'p-1.5 rounded-md border transition-colors',
              outlineOpen
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'border-border text-content-secondary hover:bg-surface-hover hover:text-content-primary'
            )}
            title="Toggle Document Outline"
          >
            <ListTree size={14} />
          </button>

          {/* Save / Commit Actions */}
          <div className="flex items-center gap-1.5 text-xs">
            {saving ? (
              <span className="text-content-tertiary">Saving...</span>
            ) : saved ? (
              <span className="text-status-success flex items-center gap-1 font-medium">
                <Check size={12} /> Saved
              </span>
            ) : isDirty ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-accent text-white font-medium hover:bg-accent-dark transition-all shadow-xs active:scale-95"
                title="Save document locally (Cmd+S)"
              >
                <Save size={12} /> Save
              </button>
            ) : (
              <span className="text-content-tertiary flex items-center gap-1 text-[11px]">
                <CheckCircle2 size={12} className="text-status-success" /> Synced
              </span>
            )}

            <button
              onClick={() => setCommitDialogOpen(true)}
              className="ml-1 px-2.5 py-1 rounded-md bg-surface-bg border border-border text-content-secondary hover:text-content-primary text-xs transition-colors hover:border-content-tertiary"
              title="Create a Git commit for saved changes"
            >
              Commit...
            </button>
          </div>

          {/* Real-time active collaborators */}
          {collaborators.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-border">
              <div className="flex -space-x-1.5 items-center">
                {collaborators.slice(0, 4).map((user) => (
                  <div
                    key={user.id}
                    className="w-5 h-5 rounded-full border border-surface-panel flex items-center justify-center text-[10px] text-white font-bold shadow-2xs transition-transform hover:scale-110"
                    style={{ backgroundColor: user.color || '#0D9488' }}
                    title={`${user.name} (Live now)`}
                  >
                    {user.name.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formatting Toolbar */}
      {(viewMode === 'edit' || viewMode === 'split') && (
        <MarkdownToolbar onInsertMarkdown={handleInsertMarkdown} content={fileContent} />
      )}

      {/* Editor & Preview Workspace with Outline Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={clsx('flex-1 overflow-hidden', viewMode === 'split' && 'border-r border-border')}>
            <MonacoEditor
              height="100%"
              language="markdown"
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              value={fileContent}
              onMount={handleEditorMount}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Menlo, monospace',
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                padding: { top: 14 },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                scrollbar: {
                  verticalSliderSize: 6,
                  horizontalSliderSize: 6,
                },
              }}
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 overflow-y-auto bg-surface-panel">
            <div className="max-w-3xl mx-auto px-8 py-8">
              <MarkdownPreview content={fileContent} />
            </div>
          </div>
        )}

        {/* Outline Side Panel */}
        <DocumentOutline onSelectHeading={handleJumpToLine} />
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
