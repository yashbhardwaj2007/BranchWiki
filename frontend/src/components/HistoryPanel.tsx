'use client';

import React, { useEffect, useState } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  GitCommit,
  GitBranch,
  GitGraph,
  List,
  Plus,
  Minus,
  User,
  Calendar,
  FileText,
  Copy,
  Check,
  Search,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

interface CommitItem {
  oid: string;
  message: string;
  author: {
    name: string;
    email: string;
    timestamp: number;
  };
  parent: string[];
}

export function HistoryPanel() {
  const { wikiId, currentBranch } = useWikiStore();
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [commitDiff, setCommitDiff] = useState<any>(null);
  const [viewStyle, setViewStyle] = useState<'graph' | 'list'>('graph');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getCommits(wikiId, currentBranch, 50)
      .then((data) => {
        setCommits(data);
        if (data.length > 0 && !selectedCommit) {
          handleSelectCommit(data[0].oid);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wikiId, currentBranch]);

  const handleSelectCommit = async (oid: string) => {
    setSelectedCommit(oid);
    try {
      const diff = await api.getCommitDiff(wikiId, oid);
      setCommitDiff(diff);
    } catch (e) {
      console.error('Failed to load commit diff:', e);
    }
  };

  const handleCopySha = (e: React.MouseEvent, sha: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  // Filter commits
  const filteredCommits = commits.filter(
    (c) =>
      c.message.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.author?.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.oid.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Assign graph tracks / lanes to commits for SVG rendering
  const graphNodes = filteredCommits.map((commit, index) => {
    const isFeature =
      commit.message.toLowerCase().includes('feature') ||
      commit.message.toLowerCase().includes('api reference') ||
      commit.message.toLowerCase().includes('react setup');
    const isMerge = commit.parent && commit.parent.length > 1;
    const lane = isFeature ? 1 : 0;
    const color = isMerge ? '#F59E0B' : lane === 0 ? '#0D9488' : '#6366F1';

    return {
      ...commit,
      lane,
      color,
      isMerge,
      y: index * 68 + 34,
      x: lane === 0 ? 32 : 68,
    };
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-surface-bg">
      {/* Left panel: Interactive Git Graph & Timeline */}
      <div className="w-[430px] border-r border-border bg-surface-panel flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch size={15} className="text-accent" />
              <h3 className="text-sm font-semibold text-content-primary">Git Graph & Timeline</h3>
            </div>
            <p className="text-xs text-content-tertiary mt-0.5">
              branch: <span className="font-mono text-content-secondary font-medium">{currentBranch}</span>
            </p>
          </div>

          <div className="flex items-center rounded-md border border-border bg-surface-bg p-0.5 shadow-2xs">
            <button
              onClick={() => setViewStyle('graph')}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors',
                viewStyle === 'graph' ? 'bg-surface-panel text-accent shadow-xs' : 'text-content-secondary hover:text-content-primary'
              )}
              title="Interactive Graph View"
            >
              <GitGraph size={13} />
              <span>Graph</span>
            </button>
            <button
              onClick={() => setViewStyle('list')}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors',
                viewStyle === 'list' ? 'bg-surface-panel text-accent shadow-xs' : 'text-content-secondary hover:text-content-primary'
              )}
              title="Compact List View"
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Search commits filter */}
        <div className="px-3 py-2 border-b border-border bg-surface-hover/20">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-bg border border-border/80 text-xs">
            <Search size={12} className="text-content-tertiary flex-shrink-0" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter commits by message or author..."
              className="bg-transparent outline-none flex-1 text-xs text-content-primary placeholder:text-content-tertiary"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="text-content-tertiary hover:text-content-primary text-[10px]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Graph representation */}
        <div className="flex-1 overflow-y-auto">
          {viewStyle === 'graph' ? (
            <div className="relative p-2">
              <svg
                className="absolute top-0 left-0 pointer-events-none z-10"
                style={{ height: `${graphNodes.length * 68 + 40}px`, width: '100px' }}
              >
                {/* SVG connection paths */}
                {graphNodes.map((node, i) => {
                  if (i === graphNodes.length - 1) return null;
                  const nextNode = graphNodes[i + 1];
                  const isCurved = node.lane !== nextNode.lane;
                  const pathD = isCurved
                    ? `M ${node.x} ${node.y} C ${node.x} ${(node.y + nextNode.y) / 2}, ${nextNode.x} ${(node.y + nextNode.y) / 2}, ${nextNode.x} ${nextNode.y}`
                    : `M ${node.x} ${node.y} L ${nextNode.x} ${nextNode.y}`;

                  return (
                    <path
                      key={`path-${node.oid}-${nextNode.oid}`}
                      d={pathD}
                      fill="none"
                      stroke={node.lane === 0 ? '#0D9488' : '#6366F1'}
                      strokeWidth="2.5"
                      strokeDasharray={isCurved ? '4 3' : 'none'}
                      opacity="0.75"
                    />
                  );
                })}

                {/* SVG commit dots */}
                {graphNodes.map((node) => {
                  const isSelected = selectedCommit === node.oid;
                  return (
                    <g key={`dot-${node.oid}`}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 8 : 6}
                        fill={isSelected ? node.color : 'var(--surface-panel)'}
                        stroke={node.color}
                        strokeWidth="2.5"
                        className="transition-all duration-150"
                      />
                      {node.isMerge ? (
                        <circle cx={node.x} cy={node.y} r={3} fill="#F59E0B" />
                      ) : node.lane === 1 ? (
                        <circle cx={node.x} cy={node.y} r={2} fill="#6366F1" />
                      ) : null}
                    </g>
                  );
                })}
              </svg>

              {/* Commit rows aligned with SVG dots */}
              <div className="space-y-1 relative z-20">
                {graphNodes.map((node) => {
                  const isSelected = selectedCommit === node.oid;
                  const isCopied = copiedSha === node.oid;

                  return (
                    <div
                      key={node.oid}
                      onClick={() => handleSelectCommit(node.oid)}
                      className={clsx(
                        'h-[64px] pl-24 pr-3 py-2 rounded-lg cursor-pointer transition-all flex flex-col justify-center border group relative',
                        isSelected
                          ? 'bg-accent/10 border-accent/40 shadow-xs'
                          : 'bg-surface-panel border-border/40 hover:bg-surface-hover hover:border-border'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={clsx('text-xs font-semibold truncate', isSelected ? 'text-accent' : 'text-content-primary')}>
                          {node.message}
                        </p>
                        <button
                          onClick={(e) => handleCopySha(e, node.oid)}
                          className={clsx(
                            'font-mono text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors flex-shrink-0',
                            isCopied
                              ? 'bg-status-success/15 text-status-success'
                              : 'bg-surface-bg text-content-tertiary hover:text-content-primary hover:bg-surface-hover'
                          )}
                          title="Copy commit SHA"
                        >
                          {isCopied ? <Check size={10} /> : <Copy size={10} />}
                          <span>{node.oid.substring(0, 7)}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-content-tertiary">
                        <span className="truncate">{node.author?.name}</span>
                        <span>{formatTime(node.author?.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Traditional list view */
            <div className="divide-y divide-border">
              {filteredCommits.map((commit) => {
                const isSelected = selectedCommit === commit.oid;
                const isCopied = copiedSha === commit.oid;

                return (
                  <button
                    key={commit.oid}
                    onClick={() => handleSelectCommit(commit.oid)}
                    className={clsx(
                      'w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-start gap-2.5',
                      isSelected ? 'bg-accent/10 border-l-2 border-l-accent' : ''
                    )}
                  >
                    <GitCommit size={14} className={clsx('mt-0.5 flex-shrink-0', isSelected ? 'text-accent' : 'text-content-tertiary')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-content-primary truncate">{commit.message}</p>
                        <button
                          onClick={(e) => handleCopySha(e, commit.oid)}
                          className="font-mono text-[10px] text-content-tertiary hover:text-content-primary flex items-center gap-1"
                        >
                          {isCopied ? <Check size={10} className="text-status-success" /> : null}
                          <span>{commit.oid.substring(0, 7)}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-content-tertiary mt-1">
                        <span>{commit.author?.name}</span>
                        <span>·</span>
                        <span>{formatTime(commit.author?.timestamp)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Commit Diff Inspector */}
      <div className="flex-1 overflow-y-auto">
        {selectedCommit && commitDiff ? (
          <div className="p-6 max-w-4xl mx-auto">
            {/* Commit Header Card */}
            {(() => {
              const current = commits.find((c) => c.oid === selectedCommit);
              return (
                <div className="bg-surface-panel border border-border rounded-xl p-5 mb-6 shadow-xs">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h2 className="text-base font-semibold text-content-primary leading-snug">
                        {current?.message || 'Commit details'}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-semibold text-content-tertiary tracking-wider">
                          Commit SHA:
                        </span>
                        <span className="font-mono text-xs text-accent font-medium">
                          {selectedCommit}
                        </span>
                        <button
                          onClick={(e) => handleCopySha(e, selectedCommit)}
                          className="p-1 rounded text-content-tertiary hover:text-content-primary"
                          title="Copy Full SHA"
                        >
                          {copiedSha === selectedCommit ? <Check size={12} className="text-status-success" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-xs font-semibold">
                        Verified Git Commit
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-content-secondary border-t border-border pt-3">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-content-tertiary" />
                      <span>{current?.author?.name} ({current?.author?.email})</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-content-tertiary" />
                      <span>{current?.author?.timestamp ? new Date(current.author.timestamp * 1000).toLocaleString() : ''}</span>
                    </div>
                    {current?.parent && current.parent.length > 1 && (
                      <>
                        <span>·</span>
                        <span className="text-status-warning font-semibold flex items-center gap-1">
                          <ShieldCheck size={13} /> Merge Commit (Parents: {current.parent.map(p => p.slice(0, 7)).join(', ')})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Changed Files Diffs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-content-secondary px-1">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Changed Files ({commitDiff.files?.length || 0})
                </span>
              </div>

              {commitDiff.files?.map((file: any) => (
                <div key={file.filepath} className="bg-surface-panel border border-border rounded-xl overflow-hidden shadow-xs">
                  <div className="px-4 py-2.5 bg-surface-hover/50 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-accent" />
                      <span className="text-xs font-mono font-medium text-content-primary">{file.filepath}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-status-success flex items-center font-medium">
                        <Plus size={11} />{file.stats?.additions || 0}
                      </span>
                      <span className="text-status-error flex items-center font-medium">
                        <Minus size={11} />{file.stats?.deletions || 0}
                      </span>
                    </div>
                  </div>

                  {/* Line diff renderer */}
                  <div className="font-mono text-xs overflow-x-auto divide-y divide-border/20">
                    {file.lineDiff?.map((part: any, i: number) => {
                      const isAdd = part.added;
                      const isRemove = part.removed;
                      const bg = isRemove ? 'bg-diff-remove' : isAdd ? 'bg-diff-add' : '';
                      const textColor = isRemove ? 'text-diff-remove-text' : isAdd ? 'text-diff-add-text' : 'text-content-primary';
                      const prefix = isRemove ? '−' : isAdd ? '+' : ' ';
                      const lines = part.value.split('\n');
                      if (lines[lines.length - 1] === '') lines.pop();

                      return lines.map((line: string, j: number) => (
                        <div key={`${i}-${j}`} className={`flex py-0.5 px-3 min-h-[22px] ${bg} ${textColor}`}>
                          <span className="w-5 text-center select-none text-content-tertiary mr-2 flex-shrink-0 font-bold">
                            {prefix}
                          </span>
                          <span className="whitespace-pre-wrap break-all flex-1">{line || ' '}</span>
                        </div>
                      ));
                    })}
                  </div>
                </div>
              ))}

              {(!commitDiff.files || commitDiff.files.length === 0) && (
                <div className="text-center py-10 text-xs text-content-tertiary">
                  Initial commit or no modifications relative to parent.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-content-tertiary">
            <GitCommit size={36} className="mb-2 opacity-30 text-content-tertiary" />
            <p className="text-sm font-medium text-content-secondary">Select a commit from the graph</p>
            <p className="text-xs text-content-tertiary mt-0.5">Inspect file-level diffs and author metadata</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp?: number): string {
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
