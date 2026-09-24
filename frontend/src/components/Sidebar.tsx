'use client';

import React, { useState, useEffect } from 'react';
import { useWikiStore, FileNode } from '@/lib/store';
import { api } from '@/lib/api';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  History,
  GitCompare,
  RefreshCw,
  FolderPlus,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import clsx from 'clsx';

function FileTreeItem({
  node,
  depth = 0,
  modifiedPaths,
  onRefresh,
}: {
  node: FileNode;
  depth?: number;
  modifiedPaths: Set<string>;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const { currentFile, setCurrentFile, setActivePanel, wikiId } = useWikiStore();

  const handleClick = async () => {
    if (isRenaming) return;
    if (node.type === 'folder') {
      setExpanded(!expanded);
    } else {
      setActivePanel('files');
      try {
        const data = await api.getFile(wikiId, node.path);
        setCurrentFile(node.path);
        useWikiStore.getState().setFileContent(data.content);
        useWikiStore.getState().setOriginalContent(data.content);
        useWikiStore.getState().setIsDirty(false);
      } catch (e) {
        console.error('Failed to load file:', e);
      }
    }
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewName(node.name);
    setIsRenaming(true);
  };

  const handleConfirmRename = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    if (!newName.trim() || newName === node.name) {
      setIsRenaming(false);
      return;
    }

    try {
      const parentDir = node.path.includes('/') ? node.path.substring(0, node.path.lastIndexOf('/')) : '';
      const finalNewPath = parentDir ? `${parentDir}/${newName.trim()}` : newName.trim();

      await api.renameFile(wikiId, node.path, finalNewPath);
      if (currentFile === node.path) {
        setCurrentFile(finalNewPath);
      }
      setIsRenaming(false);
      onRefresh();
    } catch (err: any) {
      alert(`Rename failed: ${err.message || 'Error renaming file'}`);
      setIsRenaming(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${node.name}"? This will remove it from the working tree.`)) {
      try {
        await api.deleteFile(wikiId, node.path);
        if (currentFile === node.path) {
          setCurrentFile(null);
        }
        onRefresh();
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
    }
  };

  const isSelected = currentFile === node.path;
  const isModified = modifiedPaths.has(node.path);

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={clsx(
          'w-full flex items-center justify-between py-1 px-2 text-xs rounded transition-colors text-left group cursor-pointer min-h-[26px]',
          isSelected
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-content-primary hover:bg-surface-hover'
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
          {node.type === 'folder' ? (
            <>
              {expanded ? <ChevronDown size={13} className="text-content-tertiary flex-shrink-0" /> : <ChevronRight size={13} className="text-content-tertiary flex-shrink-0" />}
              {expanded ? <FolderOpen size={14} className="text-accent flex-shrink-0" /> : <Folder size={14} className="text-content-secondary flex-shrink-0" />}
            </>
          ) : (
            <>
              <span className="w-3 flex-shrink-0" />
              <FileText size={13} className={clsx('flex-shrink-0', isSelected ? 'text-accent' : 'text-content-tertiary')} />
            </>
          )}

          {isRenaming ? (
            <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename(e);
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="w-full text-xs font-mono px-1 py-0.5 rounded border border-accent bg-surface-bg outline-none"
              />
              <button onClick={handleConfirmRename} className="p-0.5 text-accent hover:bg-accent/10 rounded">
                <Check size={12} />
              </button>
              <button onClick={() => setIsRenaming(false)} className="p-0.5 text-content-tertiary hover:bg-surface-hover rounded">
                <X size={12} />
              </button>
            </div>
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>

        {/* Modified status dot or actions on hover */}
        {!isRenaming && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {isModified && !hovered && (
              <span className="w-1.5 h-1.5 rounded-full bg-status-warning" title="Uncommitted changes" />
            )}
            {hovered && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleStartRename}
                  className="p-0.5 rounded text-content-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
                  title="Rename"
                >
                  <Pencil size={11} />
                </button>
                {node.type === 'file' && (
                  <button
                    onClick={handleDelete}
                    className="p-0.5 rounded text-content-tertiary hover:text-status-error hover:bg-status-error/10 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {node.type === 'folder' && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              modifiedPaths={modifiedPaths}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ onFileSelect }: { onFileSelect: () => void }) {
  const { files, activePanel, setActivePanel, wikiId, setFiles } = useWikiStore();
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [modifiedPaths, setModifiedPaths] = useState<Set<string>>(new Set());

  const fetchStatus = async () => {
    try {
      const statusList = await api.getStatus(wikiId);
      const modified = new Set<string>(statusList.map((s: any) => s.filepath));
      setModifiedPaths(modified);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wikiId]);

  const handleCreateFile = async () => {
    if (!nameInput.trim()) return;
    try {
      const filePath = nameInput.endsWith('.md') ? nameInput : `${nameInput}.md`;
      await api.saveFile(
        wikiId,
        filePath,
        `# ${nameInput.replace('.md', '')}\n\nStart writing documentation here...\n`
      );
      setCreatingFile(false);
      setNameInput('');
      const updatedFiles = await api.listFiles(wikiId);
      setFiles(updatedFiles);
      fetchStatus();
    } catch (e) {
      console.error('Failed to create file:', e);
    }
  };

  const handleCreateFolder = async () => {
    if (!nameInput.trim()) return;
    try {
      const folderPath = nameInput.replace(/\/+$/, '');
      const placeholderFile = `${folderPath}/README.md`;
      await api.saveFile(
        wikiId,
        placeholderFile,
        `# ${folderPath}\n\nFolder documentation overview.\n`
      );
      setCreatingFolder(false);
      setNameInput('');
      const updatedFiles = await api.listFiles(wikiId);
      setFiles(updatedFiles);
      fetchStatus();
    } catch (e) {
      console.error('Failed to create folder:', e);
    }
  };

  const handleRefresh = async () => {
    const updatedFiles = await api.listFiles(wikiId);
    setFiles(updatedFiles);
    fetchStatus();
  };

  return (
    <aside className="w-60 bg-surface-panel border-r border-border flex flex-col flex-shrink-0 overflow-hidden">
      {/* Navigation tabs */}
      <div className="flex items-center border-b border-border bg-surface-panel flex-shrink-0">
        {[
          { id: 'files' as const, icon: FileText, label: 'Files' },
          { id: 'history' as const, icon: History, label: 'History' },
          { id: 'diff' as const, icon: GitCompare, label: 'Compare' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2',
              activePanel === id
                ? 'border-accent text-accent'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            )}
            title={label}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Explorer Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {activePanel === 'files' && (
          <>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
                Documents
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleRefresh}
                  className="p-1 rounded hover:bg-surface-hover text-content-tertiary hover:text-content-primary transition-colors"
                  title="Refresh tree"
                >
                  <RefreshCw size={11} />
                </button>
                <button
                  onClick={() => {
                    setCreatingFolder(true);
                    setCreatingFile(false);
                    setNameInput('');
                  }}
                  className="p-1 rounded hover:bg-surface-hover text-content-tertiary hover:text-content-primary transition-colors"
                  title="New folder"
                >
                  <FolderPlus size={13} />
                </button>
                <button
                  onClick={() => {
                    setCreatingFile(true);
                    setCreatingFolder(false);
                    setNameInput('');
                  }}
                  className="p-1 rounded hover:bg-surface-hover text-content-tertiary hover:text-content-primary transition-colors"
                  title="New document"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Inline creation input for file or folder */}
            {(creatingFile || creatingFolder) && (
              <div className="px-3 mb-2">
                <div className="text-[10px] text-content-tertiary mb-1">
                  {creatingFolder ? 'New folder name:' : 'New document name:'}
                </div>
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      creatingFolder ? handleCreateFolder() : handleCreateFile();
                    }
                    if (e.key === 'Escape') {
                      setCreatingFile(false);
                      setCreatingFolder(false);
                      setNameInput('');
                    }
                  }}
                  onBlur={() => {
                    if (!nameInput) {
                      setCreatingFile(false);
                      setCreatingFolder(false);
                    }
                  }}
                  placeholder={creatingFolder ? 'guides' : 'setup.md'}
                  className="w-full text-xs font-mono px-2 py-1 rounded border border-accent bg-surface-bg outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>
            )}

            {/* Tree listing */}
            <div className="px-1">
              {files.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  modifiedPaths={modifiedPaths}
                  onRefresh={handleRefresh}
                />
              ))}
              {files.length === 0 && (
                <div className="px-3 py-8 text-center text-xs text-content-tertiary">
                  No documents found
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
