'use client';

import React, { useState } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import { GitBranch, X } from 'lucide-react';

export function BranchDialog({ onCreated }: { onCreated: () => void }) {
  const { branchDialogOpen, setBranchDialogOpen, wikiId, currentBranch, branches } = useWikiStore();
  const [name, setName] = useState('');
  const [baseBranch, setBaseBranch] = useState(currentBranch);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.createBranch(wikiId, name, baseBranch);
      setBranchDialogOpen(false);
      setName('');
      onCreated();
    } catch (e: any) {
      setError(e.message || 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  if (!branchDialogOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/20" onClick={() => setBranchDialogOpen(false)}>
      <div className="bg-surface-panel border border-border rounded-lg shadow-xl w-[420px] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-content-primary">Create branch</h3>
          </div>
          <button onClick={() => setBranchDialogOpen(false)} className="p-1 rounded hover:bg-surface-hover text-content-tertiary">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">Branch name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s/g, '-'))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="feature/my-branch"
              className="w-full text-sm font-mono px-3 py-2 rounded border border-border bg-surface-bg outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">Base branch</label>
            <select
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
              className="w-full text-sm font-mono px-3 py-2 rounded border border-border bg-surface-bg outline-none focus:border-accent"
            >
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-status-error">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-surface-bg">
          <button onClick={() => setBranchDialogOpen(false)} className="px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="px-4 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create branch'}
          </button>
        </div>
      </div>
    </div>
  );
}
