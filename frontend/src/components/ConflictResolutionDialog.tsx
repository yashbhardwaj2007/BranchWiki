'use client';

import React, { useState, useEffect } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import { AlertCircle, Check, X, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then(m => m.default), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-xs text-content-tertiary">Loading conflict editor...</div>
});

export function ConflictResolutionDialog({ onResolved }: { onResolved: () => void }) {
  const {
    conflictDialogOpen,
    setConflictDialogOpen,
    conflictData,
    wikiId,
    setCurrentBranch,
    theme,
  } = useWikiStore();

  const [resolvedContent, setResolvedContent] = useState('');
  const [resolving, setResolving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (conflictData) {
      setResolvedContent(conflictData.conflictMarkers);
      setSuccess(false);
      setError('');
    }
  }, [conflictData]);

  if (!conflictDialogOpen || !conflictData) return null;

  const handleUseCurrent = () => {
    setResolvedContent(conflictData.currentContent);
  };

  const handleUseIncoming = () => {
    setResolvedContent(conflictData.incomingContent);
  };

  const handleKeepBoth = () => {
    setResolvedContent(
      `### [Merged from ${conflictData.currentBranch}]\n${conflictData.currentContent}\n\n### [Merged from ${conflictData.incomingBranch}]\n${conflictData.incomingContent}`
    );
  };

  const handleSaveResolution = async () => {
    setResolving(true);
    setError('');
    try {
      await api.resolveConflict(
        wikiId,
        conflictData.incomingBranch,
        conflictData.currentBranch,
        conflictData.conflictFile,
        resolvedContent
      );
      setSuccess(true);
      setTimeout(() => {
        setConflictDialogOpen(false);
        setCurrentBranch(conflictData.currentBranch);
        onResolved();
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to resolve conflict');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConflictDialogOpen(false)}>
      <div className="bg-surface-panel border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {success ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-status-success/10 text-status-success flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-semibold text-content-primary">Conflict Resolved</h3>
            <p className="text-xs text-content-secondary mt-1">Changes cleanly merged into {conflictData.currentBranch}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border bg-surface-panel flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-status-error/10 text-status-error flex items-center justify-center">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-content-primary">Merge Conflict Detected</h3>
                  <p className="text-xs text-content-secondary font-mono">{conflictData.conflictFile}</p>
                </div>
              </div>
              <button
                onClick={() => setConflictDialogOpen(false)}
                className="p-1 rounded-md hover:bg-surface-hover text-content-tertiary hover:text-content-primary"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sub-header / Branch info & quick pick buttons */}
            <div className="px-5 py-3 bg-surface-bg border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono px-2 py-0.5 rounded bg-surface-panel border border-border text-content-primary">
                  HEAD ({conflictData.currentBranch})
                </span>
                <ArrowLeftRight size={12} className="text-content-tertiary" />
                <span className="font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
                  Incoming ({conflictData.incomingBranch})
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={handleUseCurrent}
                  className="px-2.5 py-1 rounded border border-border bg-surface-panel hover:bg-surface-hover text-content-primary font-medium transition-colors"
                >
                  Use Current (HEAD)
                </button>
                <button
                  onClick={handleUseIncoming}
                  className="px-2.5 py-1 rounded border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 font-medium transition-colors"
                >
                  Use Incoming
                </button>
                <button
                  onClick={handleKeepBoth}
                  className="px-2.5 py-1 rounded border border-border bg-surface-panel hover:bg-surface-hover text-content-secondary font-medium transition-colors"
                >
                  Keep Both
                </button>
              </div>
            </div>

            {/* Monaco Editor for Conflict Resolution */}
            <div className="flex-1 min-h-[360px] max-h-[460px] overflow-hidden bg-surface-panel border-b border-border">
              <MonacoEditor
                height="100%"
                language="markdown"
                theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                value={resolvedContent}
                onChange={(val) => setResolvedContent(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12 },
                }}
              />
            </div>

            {error && (
              <div className="px-5 py-2 bg-status-error/5 border-t border-status-error/20 text-xs text-status-error">
                {error}
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border bg-surface-panel flex items-center justify-between">
              <span className="text-xs text-content-tertiary">
                Remove all conflict markers before completing the merge
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConflictDialogOpen(false)}
                  className="px-3 py-1.5 text-xs text-content-secondary hover:text-content-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveResolution}
                  disabled={resolving || resolvedContent.includes('<<<<<<<')}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Check size={14} />
                  {resolving ? 'Merging...' : 'Resolve & Complete Merge'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
