'use client';

import React, { useState, useEffect } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import { GitMerge, X, Check, Plus, Minus, AlertTriangle, ShieldAlert } from 'lucide-react';

export function MergeDialog({ onMerge }: { onMerge: () => void }) {
  const {
    mergeDialogOpen,
    setMergeDialogOpen,
    wikiId,
    branches,
    currentBranch,
    setConflictData,
    setConflictDialogOpen,
  } = useWikiStore();

  const [fromBranch, setFromBranch] = useState('');
  const [intoBranch, setIntoBranch] = useState('main');
  const [preview, setPreview] = useState<any>(null);
  const [merging, setMerging] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [simulateConflict, setSimulateConflict] = useState(false);

  useEffect(() => {
    if (mergeDialogOpen) {
      const nonMain = branches.find(b => b !== 'main') || '';
      setFromBranch(nonMain);
      setIntoBranch('main');
      setPreview(null);
      setSuccess(false);
      setError('');
      setSimulateConflict(false);
    }
  }, [mergeDialogOpen, branches]);

  const loadPreview = async () => {
    if (!fromBranch || !intoBranch || fromBranch === intoBranch) return;
    try {
      const p = await api.mergePreview(wikiId, fromBranch, intoBranch);
      setPreview(p);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (fromBranch && intoBranch && fromBranch !== intoBranch) {
      loadPreview();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromBranch, intoBranch]);

  const handleMerge = async () => {
    setMerging(true);
    setError('');
    try {
      const result = await api.merge(wikiId, fromBranch, intoBranch, simulateConflict);
      if (result.conflict) {
        setConflictData(result);
        setMergeDialogOpen(false);
        setConflictDialogOpen(true);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        setMergeDialogOpen(false);
        onMerge();
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  if (!mergeDialogOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/20" onClick={() => setMergeDialogOpen(false)}>
      <div className="bg-surface-panel border border-border rounded-lg shadow-xl w-[480px] overflow-hidden" onClick={e => e.stopPropagation()}>
        {success ? (
          <div className="px-6 py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-status-success/10 text-status-success flex items-center justify-center mx-auto mb-3">
              <Check size={20} />
            </div>
            <p className="text-sm font-medium text-content-primary">Branch merged into {intoBranch}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <GitMerge size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-content-primary">Merge branch</h3>
              </div>
              <button onClick={() => setMergeDialogOpen(false)} className="p-1 rounded hover:bg-surface-hover text-content-tertiary">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-content-secondary mb-1">From</label>
                  <select value={fromBranch} onChange={(e) => setFromBranch(e.target.value)}
                    className="w-full text-sm font-mono px-3 py-2 rounded border border-border bg-surface-bg outline-none focus:border-accent">
                    <option value="">Select branch</option>
                    {branches.filter(b => b !== intoBranch).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="pt-5 text-content-tertiary">→</div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-content-secondary mb-1">Into</label>
                  <select value={intoBranch} onChange={(e) => setIntoBranch(e.target.value)}
                    className="w-full text-sm font-mono px-3 py-2 rounded border border-border bg-surface-bg outline-none focus:border-accent">
                    {branches.filter(b => b !== fromBranch).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {preview && (
                <div className="bg-surface-bg rounded border border-border p-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold text-content-primary">{preview.commits}</p>
                      <p className="text-xs text-content-tertiary">Commits</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-content-primary">{preview.filesChanged}</p>
                      <p className="text-xs text-content-tertiary">Files changed</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-status-success">+{preview.stats?.additions || 0}</span>
                        <span className="text-sm text-status-error">−{preview.stats?.deletions || 0}</span>
                      </div>
                      <p className="text-xs text-content-tertiary">Lines</p>
                    </div>
                  </div>
                  {preview.files?.length > 0 && (
                    <div className="mt-3 border-t border-border pt-2">
                      <div className="text-[10px] uppercase font-medium text-content-tertiary mb-1">Affected Files</div>
                      {preview.files.map((f: any) => (
                        <div key={f.filepath} className="text-xs text-content-secondary py-0.5 font-mono flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${f.status === 'added' ? 'bg-status-success' : 'bg-status-warning'}`} />
                          {f.filepath}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Demo test conflict toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="simulateConflict"
                  checked={simulateConflict}
                  onChange={(e) => setSimulateConflict(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="simulateConflict" className="text-xs text-content-secondary cursor-pointer flex items-center gap-1">
                  <ShieldAlert size={12} className="text-status-warning" />
                  Simulate Merge Conflict for demo
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-status-error bg-status-error/5 rounded px-3 py-2">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-surface-bg">
              <button onClick={() => setMergeDialogOpen(false)} className="px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary">
                Cancel
              </button>
              <button
                onClick={handleMerge}
                disabled={!fromBranch || !intoBranch || fromBranch === intoBranch || merging}
                className="px-4 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded transition-colors disabled:opacity-50"
              >
                {merging ? 'Merging...' : simulateConflict ? 'Test Conflict Resolution' : 'Merge branch'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
