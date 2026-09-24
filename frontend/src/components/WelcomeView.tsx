'use client';

import React, { useEffect, useState } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  GitBranch,
  GitCommit,
  FileText,
  Clock,
  GitCompare,
  History,
  Keyboard,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  ShieldCheck,
  Copy,
  Check,
  Code2
} from 'lucide-react';

export function WelcomeView() {
  const {
    wikiId,
    wikiName,
    currentBranch,
    files,
    setActivePanel,
    setCurrentFile,
    setFileContent,
    setOriginalContent,
    setIsDirty,
    setShortcutsDialogOpen,
    setTypingCollaborator,
    collaborators,
    setCollaborators,
  } = useWikiStore();

  const [commits, setCommits] = useState<any[]>([]);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  useEffect(() => {
    api.getCommits(wikiId, currentBranch, 6).then(setCommits).catch(console.error);
  }, [wikiId, currentBranch]);

  const totalFiles = countFiles(files);

  const handleOpenReadme = async () => {
    try {
      const readmePath = 'README.md';
      const data = await api.getFile(wikiId, readmePath, currentBranch);
      setCurrentFile(readmePath);
      setFileContent(data.content);
      setOriginalContent(data.content);
      setIsDirty(false);
      setActivePanel('files');
    } catch {
      // If README doesn't exist, open first file if available
      const firstFile = findFirstFile(files);
      if (firstFile) {
        const data = await api.getFile(wikiId, firstFile, currentBranch);
        setCurrentFile(firstFile);
        setFileContent(data.content);
        setOriginalContent(data.content);
        setIsDirty(false);
        setActivePanel('files');
      }
    }
  };

  const handleCopySha = (sha: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 1500);
  };

  const handleSimulatePeer = () => {
    const peerUser = { id: 'peer-sim', name: 'Meetmux', color: '#8B5CF6' };
    const exists = collaborators.some(c => c.name === peerUser.name);
    if (!exists) {
      setCollaborators([...collaborators, peerUser]);
    }
    setTypingCollaborator('Meetmux');
    setTimeout(() => {
      setTypingCollaborator(null);
    }, 4500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bg">
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Hero Section */}
        <div className="relative mb-8 p-6 rounded-2xl bg-surface-panel border border-border overflow-hidden">
          {/* Subtle decorative glow in top-right */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-3">
                <Sparkles size={13} className="animate-spin-slow" />
                <span>Git-Backed Versioning & Live AST Diff Engine</span>
              </div>
              <h1 className="text-3xl font-bold text-content-primary tracking-tight mb-2">
                {wikiName}
              </h1>
              <p className="text-sm text-content-secondary max-w-xl leading-relaxed">
                A collaborative documentation workspace powered by real Git commits, tree branching, syntax-aware Markdown AST diffs, and live multiplayer synchronization.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                onClick={handleOpenReadme}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-all shadow-glow-teal active:scale-95"
              >
                <FileText size={16} />
                <span>Open Documentation</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setActivePanel('diff')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-hover border border-border text-content-primary text-xs font-medium hover:border-accent/40 transition-colors"
              >
                <GitCompare size={14} className="text-accent" />
                <span>Compare Branches</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats & Engine Health */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
          <div className="bg-surface-panel border border-border rounded-xl p-4 transition-colors hover:border-border-strong">
            <div className="flex items-center justify-between text-content-tertiary mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Documents</span>
              <FileText size={16} className="text-content-secondary" />
            </div>
            <div className="text-2xl font-bold text-content-primary">{totalFiles}</div>
            <div className="text-[11px] text-content-tertiary mt-1 flex items-center gap-1">
              <span>Markdown files</span>
            </div>
          </div>

          <div className="bg-surface-panel border border-border rounded-xl p-4 transition-colors hover:border-border-strong">
            <div className="flex items-center justify-between text-content-tertiary mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Branch</span>
              <GitBranch size={16} className="text-accent" />
            </div>
            <div className="text-xl font-bold font-mono text-content-primary truncate">{currentBranch}</div>
            <div className="text-[11px] text-accent mt-1 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>HEAD checkout</span>
            </div>
          </div>

          <div className="bg-surface-panel border border-border rounded-xl p-4 transition-colors hover:border-border-strong">
            <div className="flex items-center justify-between text-content-tertiary mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Git Commits</span>
              <GitCommit size={16} className="text-content-secondary" />
            </div>
            <div className="text-2xl font-bold text-content-primary">{commits.length}</div>
            <div className="text-[11px] text-content-tertiary mt-1 font-mono">
              {commits[0]?.oid ? commits[0].oid.substring(0, 7) : 'Initialized'}
            </div>
          </div>

          <div className="bg-surface-panel border border-border rounded-xl p-4 transition-colors hover:border-border-strong">
            <div className="flex items-center justify-between text-content-tertiary mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Sync Engine</span>
              <Zap size={16} className="text-status-success" />
            </div>
            <div className="text-base font-bold text-content-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span>Real-time</span>
            </div>
            <div className="text-[11px] text-content-tertiary mt-1">
              Socket.IO + isomorphic-git
            </div>
          </div>
        </div>

        {/* Quick Launchpad & Interactive Features */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-3">
            Quick Actions & Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setActivePanel('history')}
              className="group p-4 rounded-xl bg-surface-panel border border-border text-left hover:border-accent/40 hover:bg-surface-hover/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-content-primary group-hover:text-accent group-hover:bg-accent/10 transition-colors mb-3">
                  <History size={17} />
                </div>
                <h3 className="text-sm font-semibold text-content-primary mb-1 group-hover:text-accent transition-colors">
                  Interactive Git Graph
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Inspect SVG branch commit topologies, author metadata, and SHA parents.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                <span>View Commit Log</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => setActivePanel('diff')}
              className="group p-4 rounded-xl bg-surface-panel border border-border text-left hover:border-accent/40 hover:bg-surface-hover/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-content-primary group-hover:text-accent group-hover:bg-accent/10 transition-colors mb-3">
                  <Code2 size={17} />
                </div>
                <h3 className="text-sm font-semibold text-content-primary mb-1 group-hover:text-accent transition-colors">
                  Syntax AST Diff Viewer
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Compare branches with unified or side-by-side Markdown AST structural diffs.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                <span>Open Diff Inspector</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => setShortcutsDialogOpen(true)}
              className="group p-4 rounded-xl bg-surface-panel border border-border text-left hover:border-accent/40 hover:bg-surface-hover/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-content-primary group-hover:text-accent group-hover:bg-accent/10 transition-colors mb-3">
                  <Keyboard size={17} />
                </div>
                <h3 className="text-sm font-semibold text-content-primary mb-1 group-hover:text-accent transition-colors">
                  Keyboard Shortcuts
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Learn keybindings for rapid branch switching, split views, and command palette.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                <span>Press ? or click</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Recent Git Activity */}
        {commits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                Recent Commit Activity
              </h2>
              <button
                onClick={() => setActivePanel('history')}
                className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
              >
                <span>View complete history</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="bg-surface-panel border border-border rounded-xl divide-y divide-border overflow-hidden">
              {commits.map((commit: any) => (
                <div
                  key={commit.oid}
                  onClick={() => setActivePanel('history')}
                  className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-surface-hover/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-surface-hover border border-border flex items-center justify-center text-content-tertiary group-hover:text-accent group-hover:border-accent/30 transition-colors shrink-0">
                      <GitCommit size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-content-primary group-hover:text-accent transition-colors truncate">
                        {commit.message}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-content-tertiary mt-0.5">
                        <span className="text-content-secondary font-medium">{commit.author?.name}</span>
                        <span>·</span>
                        <span>{formatCommitTime(commit.author?.timestamp)}</span>
                        {commit.parent && commit.parent.length > 1 && (
                          <>
                            <span>·</span>
                            <span className="px-1.5 py-0.2 rounded bg-accent/10 text-accent font-semibold text-[10px]">
                              Merge
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleCopySha(commit.oid, e)}
                      className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-surface-hover hover:bg-surface-active text-content-secondary border border-border transition-colors"
                      title="Copy full SHA"
                    >
                      {copiedSha === commit.oid ? (
                        <Check size={11} className="text-status-success" />
                      ) : (
                        <Copy size={11} className="text-content-tertiary" />
                      )}
                      <span>{commit.oid.substring(0, 7)}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function countFiles(nodes: any[]): number {
  return nodes.reduce((count, node) => {
    if (node.type === 'file') return count + 1;
    if (node.children) return count + countFiles(node.children);
    return count;
  }, 0);
}

function findFirstFile(nodes: any[]): string | null {
  for (const node of nodes) {
    if (node.type === 'file') return node.path;
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}

function formatCommitTime(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
