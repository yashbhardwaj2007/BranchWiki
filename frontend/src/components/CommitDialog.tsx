'use client';

import React, { useState, useEffect } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import { GitCommit, X, Check, Plus, Minus } from 'lucide-react';

export function CommitDialog({ onCommit }: { onCommit: () => void }) {
  const { commitDialogOpen, setCommitDialogOpen, wikiId, currentBranch } = useWikiStore();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<any[]>([]);
  const [committing, setCommitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (commitDialogOpen) {
      api.getStatus(wikiId).then(setStatus).catch(console.error);
      setMessage('');
      setSuccess(null);
    }
  }, [commitDialogOpen, wikiId]);

  const handleCommit = async () => {
    if (!message.trim()) return;
    setCommitting(true);
    try {
      const result = await api.commit(wikiId, message);
      setSuccess(result.oid?.substring(0, 7));
      setTimeout(() => {
        setCommitDialogOpen(false);
        onCommit();
      }, 1500);
    } catch (e: any) {
      console.error('Commit failed:', e);
    } finally {
      setCommitting(false);
    }
  };

  if (!commitDialogOpen) return null;

  const additions = status.filter(s => s.status === 'added' || s.status === 'modified').length;
  const deletions = status.filter(s => s.status === 'deleted').length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/20" onClick={() => setCommitDialogOpen(false)}>
      <div className="bg-surface-panel border border-border rounded-lg shadow-xl w-[480px] overflow-hidden" onClick={e => e.stopPropagation()}>
        {success ? (
          <div className="px-6 py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-status-success/10 text-status-success flex items-center justify-center mx-auto mb-3">
              <Check size={20} />
            </div>
            <p className="text-sm font-medium text-content-primary">Committed to {currentBranch}</p>
            <p className="text-xs font-mono text-content-tertiary mt-1">{success}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <GitCommit size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-content-primary">Commit changes</h3>
              </div>
              <button onClick={() => setCommitDialogOpen(false)} className="p-1 rounded hover:bg-surface-hover text-content-tertiary">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <input
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommit(); } }}
                placeholder="Describe your changes..."
                className="w-full text-sm px-3 py-2 rounded border border-border bg-surface-bg outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              />

              {status.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-3 text-xs text-content-secondary mb-2">
                    <span className="flex items-center gap-1 text-status-success"><Plus size={12} />{additions}</span>
                    <span className="flex items-center gap-1 text-status-error"><Minus size={12} />{deletions}</span>
                  </div>
                  <div className="bg-surface-bg rounded border border-border max-h-32 overflow-y-auto">
                    {status.map((s: any) => (
                      <div key={s.filepath} className="px-3 py-1.5 text-xs flex items-center gap-2 border-b border-border last:border-0">
                        <span className={`font-mono ${s.status === 'added' ? 'text-status-success' : s.status === 'deleted' ? 'text-status-error' : 'text-status-warning'}`}>
                          {s.status === 'added' ? 'A' : s.status === 'deleted' ? 'D' : 'M'}
                        </span>
                        <span className="text-content-primary truncate">{s.filepath}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-bg">
              <span className="text-xs text-content-tertiary">Committing to <span className="font-mono font-medium text-content-secondary">{currentBranch}</span></span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCommitDialogOpen(false)} className="px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  disabled={!message.trim() || committing}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {committing ? 'Committing...' : 'Commit'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
