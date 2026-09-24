'use client';

import React, { useState, useEffect } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  GitCompare,
  Plus,
  Minus,
  FileText,
  Heading,
  Type,
  Code2,
  List,
  Table,
  Quote,
  Columns,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

interface AlignedDiffRow {
  fromLineNumber?: number;
  fromText?: string;
  fromType: 'normal' | 'removed' | 'empty';
  toLineNumber?: number;
  toText?: string;
  toType: 'normal' | 'added' | 'empty';
}

function buildAlignedDiff(lineDiff: any[]): AlignedDiffRow[] {
  if (!lineDiff || lineDiff.length === 0) return [];

  const rows: AlignedDiffRow[] = [];
  let fromLine = 0;
  let toLine = 0;

  let i = 0;
  while (i < lineDiff.length) {
    const current = lineDiff[i];

    if (!current.added && !current.removed) {
      // Unchanged lines
      const lines = current.value.split('\n');
      if (lines[lines.length - 1] === '') lines.pop();

      for (const line of lines) {
        fromLine++;
        toLine++;
        rows.push({
          fromLineNumber: fromLine,
          fromText: line,
          fromType: 'normal',
          toLineNumber: toLine,
          toText: line,
          toType: 'normal',
        });
      }
      i++;
    } else {
      // Gather consecutive removals and additions to align them side-by-side
      const removedLines: string[] = [];
      const addedLines: string[] = [];

      while (i < lineDiff.length && (lineDiff[i].added || lineDiff[i].removed)) {
        const part = lineDiff[i];
        const lines = part.value.split('\n');
        if (lines[lines.length - 1] === '') lines.pop();

        if (part.removed) {
          removedLines.push(...lines);
        } else if (part.added) {
          addedLines.push(...lines);
        }
        i++;
      }

      const maxCount = Math.max(removedLines.length, addedLines.length);
      for (let j = 0; j < maxCount; j++) {
        const hasRemoved = j < removedLines.length;
        const hasAdded = j < addedLines.length;

        if (hasRemoved) fromLine++;
        if (hasAdded) toLine++;

        rows.push({
          fromLineNumber: hasRemoved ? fromLine : undefined,
          fromText: hasRemoved ? removedLines[j] : undefined,
          fromType: hasRemoved ? 'removed' : 'empty',
          toLineNumber: hasAdded ? toLine : undefined,
          toText: hasAdded ? addedLines[j] : undefined,
          toType: hasAdded ? 'added' : 'empty',
        });
      }
    }
  }

  return rows;
}

export function DiffViewer() {
  const { wikiId, branches, astFilterType, setAstFilterType } = useWikiStore();
  const [fromBranch, setFromBranch] = useState('main');
  const [toBranch, setToBranch] = useState('');
  const [diffData, setDiffData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffLayout, setDiffLayout] = useState<'split' | 'unified'>('split');

  useEffect(() => {
    const nonMain = branches.find(b => b !== 'main');
    if (nonMain) setToBranch(nonMain);
  }, [branches]);

  const handleCompare = async () => {
    if (!fromBranch || !toBranch || fromBranch === toBranch) return;
    setLoading(true);
    try {
      const data = await api.getDiff(wikiId, fromBranch, toBranch);
      setDiffData(data);
      if (data.files?.length > 0) setSelectedFile(data.files[0].filepath);
    } catch (e) {
      console.error('Diff failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromBranch && toBranch && fromBranch !== toBranch) {
      handleCompare();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromBranch, toBranch]);

  const selectedDiff = diffData?.files?.find((f: any) => f.filepath === selectedFile);
  const alignedRows = selectedDiff ? buildAlignedDiff(selectedDiff.lineDiff) : [];

  const totalAdditions = diffData?.totalStats?.additions || 0;
  const totalDeletions = diffData?.totalStats?.deletions || 0;
  const totalChanges = totalAdditions + totalDeletions || 1;
  const addPercentage = Math.round((totalAdditions / totalChanges) * 100);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-bg">
      {/* Compare top header */}
      <div className="px-4 py-3 border-b border-border bg-surface-panel flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GitCompare size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-content-primary">Compare branches</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Visual ratio bar */}
            {diffData && (
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-content-tertiary">Changes:</span>
                <div className="w-24 h-2 bg-surface-hover rounded-full overflow-hidden flex border border-border/60">
                  <div className="bg-status-success h-full transition-all" style={{ width: `${addPercentage}%` }} />
                  <div className="bg-status-error h-full transition-all" style={{ width: `${100 - addPercentage}%` }} />
                </div>
                <span className="font-mono text-[11px] text-content-secondary font-medium">
                  {totalAdditions}++ / {totalDeletions}--
                </span>
              </div>
            )}

            {/* Layout mode switcher */}
            <div className="flex items-center bg-surface-bg rounded-md border border-border p-0.5 shadow-2xs">
              <button
                onClick={() => setDiffLayout('split')}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors',
                  diffLayout === 'split' ? 'bg-surface-panel text-accent shadow-xs' : 'text-content-secondary hover:text-content-primary'
                )}
                title="Side-by-side diff"
              >
                <Columns size={12} />
                <span>Split</span>
              </button>
              <button
                onClick={() => setDiffLayout('unified')}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors',
                  diffLayout === 'unified' ? 'bg-surface-panel text-accent shadow-xs' : 'text-content-secondary hover:text-content-primary'
                )}
                title="Unified diff"
              >
                <AlignLeft size={12} />
                <span>Unified</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <select
            value={fromBranch}
            onChange={(e) => setFromBranch(e.target.value)}
            className="text-xs font-mono px-3 py-1.5 rounded-md border border-border bg-surface-bg outline-none focus:border-accent"
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <span className="text-content-tertiary text-xs font-mono">...</span>
          <select
            value={toBranch}
            onChange={(e) => setToBranch(e.target.value)}
            className="text-xs font-mono px-3 py-1.5 rounded-md border border-border bg-surface-bg outline-none focus:border-accent"
          >
            <option value="">Select branch</option>
            {branches.filter(b => b !== fromBranch).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <button
            onClick={handleCompare}
            disabled={!fromBranch || !toBranch || fromBranch === toBranch || loading}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-md transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>

          {diffData && (
            <div className="ml-auto flex items-center gap-3 text-xs">
              <span className="text-content-secondary font-medium">{diffData.totalFiles} files changed</span>
              <span className="text-status-success font-semibold flex items-center gap-0.5">
                <Plus size={11} />{diffData.totalStats?.additions || 0}
              </span>
              <span className="text-status-error font-semibold flex items-center gap-0.5">
                <Minus size={11} />{diffData.totalStats?.deletions || 0}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive AST Changed Blocks Bar */}
      {diffData?.totalBlockStats && diffData.totalBlockStats.totalBlocksChanged > 0 && (
        <div className="px-4 py-2 border-b border-border bg-surface-panel flex items-center gap-2 flex-wrap flex-shrink-0 text-xs">
          <span className="font-semibold text-content-tertiary uppercase text-[10px] tracking-wider mr-1">
            AST Blocks:
          </span>

          <button
            onClick={() => setAstFilterType(null)}
            className={clsx(
              'px-2 py-0.5 rounded text-[11px] font-medium transition-all border',
              !astFilterType
                ? 'bg-accent/15 border-accent text-accent'
                : 'border-border bg-surface-bg text-content-secondary hover:text-content-primary'
            )}
          >
            All Blocks ({diffData.totalBlockStats.totalBlocksChanged})
          </button>

          {diffData.totalBlockStats.headings > 0 && (
            <button
              onClick={() => setAstFilterType(astFilterType === 'heading' ? null : 'heading')}
              className={clsx(
                'flex items-center gap-1 font-medium px-2 py-0.5 rounded text-[11px] transition-all border',
                astFilterType === 'heading'
                  ? 'bg-accent/15 border-accent text-accent ring-1 ring-accent'
                  : 'bg-surface-bg border-border text-content-secondary hover:border-content-tertiary'
              )}
            >
              <Heading size={11} className="text-accent" />
              <span>{diffData.totalBlockStats.headings} heading{diffData.totalBlockStats.headings !== 1 ? 's' : ''}</span>
            </button>
          )}

          {diffData.totalBlockStats.paragraphs > 0 && (
            <button
              onClick={() => setAstFilterType(astFilterType === 'paragraph' ? null : 'paragraph')}
              className={clsx(
                'flex items-center gap-1 font-medium px-2 py-0.5 rounded text-[11px] transition-all border',
                astFilterType === 'paragraph'
                  ? 'bg-accent/15 border-accent text-accent ring-1 ring-accent'
                  : 'bg-surface-bg border-border text-content-secondary hover:border-content-tertiary'
              )}
            >
              <Type size={11} className="text-accent" />
              <span>{diffData.totalBlockStats.paragraphs} paragraph{diffData.totalBlockStats.paragraphs !== 1 ? 's' : ''}</span>
            </button>
          )}

          {diffData.totalBlockStats.codeBlocks > 0 && (
            <button
              onClick={() => setAstFilterType(astFilterType === 'code' ? null : 'code')}
              className={clsx(
                'flex items-center gap-1 font-medium px-2 py-0.5 rounded text-[11px] transition-all border',
                astFilterType === 'code'
                  ? 'bg-accent/15 border-accent text-accent ring-1 ring-accent'
                  : 'bg-surface-bg border-border text-content-secondary hover:border-content-tertiary'
              )}
            >
              <Code2 size={11} className="text-accent" />
              <span>{diffData.totalBlockStats.codeBlocks} code block{diffData.totalBlockStats.codeBlocks !== 1 ? 's' : ''}</span>
            </button>
          )}

          {diffData.totalBlockStats.lists > 0 && (
            <button
              onClick={() => setAstFilterType(astFilterType === 'list' ? null : 'list')}
              className={clsx(
                'flex items-center gap-1 font-medium px-2 py-0.5 rounded text-[11px] transition-all border',
                astFilterType === 'list'
                  ? 'bg-accent/15 border-accent text-accent ring-1 ring-accent'
                  : 'bg-surface-bg border-border text-content-secondary hover:border-content-tertiary'
              )}
            >
              <List size={11} className="text-accent" />
              <span>{diffData.totalBlockStats.lists} list{diffData.totalBlockStats.lists !== 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      )}

      {/* Main diff viewer area */}
      {diffData && (
        <div className="flex-1 flex overflow-hidden">
          {/* Changed file list sidebar */}
          <div className="w-56 border-r border-border bg-surface-panel overflow-y-auto flex-shrink-0">
            <div className="px-3 py-2 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
              Changed files ({diffData.files?.length || 0})
            </div>
            {diffData.files?.map((file: any) => (
              <button
                key={file.filepath}
                onClick={() => setSelectedFile(file.filepath)}
                className={clsx(
                  'w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between',
                  selectedFile === file.filepath
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-content-primary hover:bg-surface-hover'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={13} className={clsx('flex-shrink-0', file.status === 'added' ? 'text-status-success' : file.status === 'deleted' ? 'text-status-error' : 'text-status-warning')} />
                  <span className="truncate font-mono text-xs">{file.filepath}</span>
                </div>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${file.status === 'added' ? 'text-status-success' : file.status === 'deleted' ? 'text-status-error' : 'text-status-warning'}`}>
                  {file.status === 'added' ? '+A' : file.status === 'deleted' ? '−D' : '•M'}
                </span>
              </button>
            ))}

            {/* Per-file structural AST change summary */}
            {selectedDiff?.astDiff?.blockChanges?.length > 0 && (
              <div className="mx-3 mt-4 mb-2 pt-3 border-t border-border">
                <div className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider mb-2">
                  Structural Diff
                </div>
                <div className="space-y-1.5">
                  {selectedDiff.astDiff.blockChanges.slice(0, 10).map((bc: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-tight">
                      <span className={`font-mono font-bold flex-shrink-0 ${bc.action === 'added' ? 'text-status-success' : bc.action === 'removed' ? 'text-status-error' : 'text-status-warning'}`}>
                        {bc.action === 'added' ? '+' : bc.action === 'removed' ? '−' : '~'}
                      </span>
                      <div className="min-w-0">
                        <span className="text-content-tertiary capitalize font-mono text-[10px]">
                          {bc.type}{bc.depth ? `(h${bc.depth})` : ''}:{' '}
                        </span>
                        <span className="text-content-secondary truncate block">{bc.detail?.slice(0, 36)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Diff Content View */}
          <div className="flex-1 overflow-auto">
            {selectedDiff && (
              <div className="min-w-[700px]">
                {/* File header bar */}
                <div className="sticky top-0 bg-surface-hover/95 backdrop-blur-xs border-b border-border px-4 py-2 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-content-primary">{selectedDiff.filepath}</span>
                    <span className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      selectedDiff.status === 'added' ? 'bg-diff-add text-diff-add-text' :
                      selectedDiff.status === 'deleted' ? 'bg-diff-remove text-diff-remove-text' :
                      'bg-status-warning/10 text-status-warning'
                    )}>
                      {selectedDiff.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-status-success font-semibold">+{selectedDiff.stats?.additions || 0}</span>
                    <span className="text-status-error font-semibold">−{selectedDiff.stats?.deletions || 0}</span>
                  </div>
                </div>

                {/* Diff rendering: Split vs Unified */}
                {diffLayout === 'split' ? (
                  /* True aligned side-by-side view */
                  <div>
                    {/* Column Headers */}
                    <div className="flex border-b border-border text-xs font-mono text-content-secondary">
                      <div className="flex-1 px-4 py-1.5 bg-diff-remove/20 border-r border-border font-semibold flex items-center justify-between">
                        <span>{fromBranch} (Base)</span>
                        <span className="text-[10px] opacity-75">Original</span>
                      </div>
                      <div className="flex-1 px-4 py-1.5 bg-diff-add/20 font-semibold flex items-center justify-between">
                        <span>{toBranch} (Incoming)</span>
                        <span className="text-[10px] opacity-75">Modified</span>
                      </div>
                    </div>

                    {/* Aligned rows */}
                    <div className="font-mono text-xs select-text">
                      {alignedRows.map((row, idx) => {
                        const isLeftRemoved = row.fromType === 'removed';
                        const isRightAdded = row.toType === 'added';
                        const isLeftEmpty = row.fromType === 'empty';
                        const isRightEmpty = row.toType === 'empty';

                        return (
                          <div key={idx} className="flex min-h-[22px] border-b border-border/10 hover:brightness-95 transition-colors">
                            {/* Left Pane (fromBranch) */}
                            <div className={clsx(
                              'flex-1 flex border-r border-border overflow-hidden',
                              isLeftRemoved ? 'bg-diff-remove text-diff-remove-text' : isLeftEmpty ? 'bg-surface-hover/30' : 'bg-surface-panel text-content-primary'
                            )}>
                              <span className="w-10 flex-shrink-0 text-right pr-2 py-0.5 text-content-tertiary select-none text-[10px] bg-surface-hover/40 border-r border-border/20">
                                {row.fromLineNumber || ''}
                              </span>
                              <span className="w-4 flex-shrink-0 text-center py-0.5 select-none text-[11px] font-bold">
                                {isLeftRemoved ? '−' : ''}
                              </span>
                              <span className="px-2 py-0.5 whitespace-pre-wrap break-all flex-1 min-w-0">
                                {row.fromText !== undefined ? (row.fromText || ' ') : ''}
                              </span>
                            </div>

                            {/* Right Pane (toBranch) */}
                            <div className={clsx(
                              'flex-1 flex overflow-hidden',
                              isRightAdded ? 'bg-diff-add text-diff-add-text' : isRightEmpty ? 'bg-surface-hover/30' : 'bg-surface-panel text-content-primary'
                            )}>
                              <span className="w-10 flex-shrink-0 text-right pr-2 py-0.5 text-content-tertiary select-none text-[10px] bg-surface-hover/40 border-r border-border/20">
                                {row.toLineNumber || ''}
                              </span>
                              <span className="w-4 flex-shrink-0 text-center py-0.5 select-none text-[11px] font-bold">
                                {isRightAdded ? '+' : ''}
                              </span>
                              <span className="px-2 py-0.5 whitespace-pre-wrap break-all flex-1 min-w-0">
                                {row.toText !== undefined ? (row.toText || ' ') : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Unified diff view */
                  <div className="font-mono text-xs select-text divide-y divide-border/15">
                    {selectedDiff.lineDiff?.map((part: any, pIdx: number) => {
                      const isAdd = part.added;
                      const isRemove = part.removed;
                      const bg = isRemove ? 'bg-diff-remove' : isAdd ? 'bg-diff-add' : 'bg-surface-panel';
                      const textColor = isRemove ? 'text-diff-remove-text' : isAdd ? 'text-diff-add-text' : 'text-content-primary';
                      const prefix = isRemove ? '−' : isAdd ? '+' : ' ';
                      const lines = part.value.split('\n');
                      if (lines[lines.length - 1] === '') lines.pop();

                      return lines.map((line: string, lIdx: number) => (
                        <div key={`${pIdx}-${lIdx}`} className={`flex min-h-[22px] py-0.5 ${bg} ${textColor}`}>
                          <span className="w-6 flex-shrink-0 text-center select-none font-bold text-content-tertiary">
                            {prefix}
                          </span>
                          <span className="px-2 whitespace-pre-wrap break-all flex-1">{line || ' '}</span>
                        </div>
                      ));
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!diffData && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-content-tertiary">
          <GitCompare size={36} className="mb-3 opacity-30 text-content-tertiary" />
          <p className="text-sm font-medium text-content-secondary">Select two branches to compare</p>
          <p className="text-xs text-content-tertiary mt-1">Inspect line-level and structural Markdown AST diffs</p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center text-content-tertiary text-xs">
          Computing branch diff and AST structures...
        </div>
      )}
    </div>
  );
}
