'use client';

import React, { useEffect, useCallback } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { EditorArea } from './EditorArea';
import { WelcomeView } from './WelcomeView';
import { CommitDialog } from './CommitDialog';
import { BranchDialog } from './BranchDialog';
import { MergeDialog } from './MergeDialog';
import { SearchDialog } from './SearchDialog';
import { CommandPalette } from './CommandPalette';
import { DiffViewer } from './DiffViewer';
import { HistoryPanel } from './HistoryPanel';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';
import { StatusBar } from './StatusBar';
import { ShortcutsDialog } from './ShortcutsDialog';

export function AppShell() {
  const {
    wikiId,
    currentFile,
    sidebarOpen,
    activePanel,
    setFiles,
    setBranches,
    setCurrentBranch,
    setSidebarOpen,
    setViewMode,
    setActivePanel,
    setCommitDialogOpen,
    setShortcutsDialogOpen,
    setCommandPaletteOpen,
  } = useWikiStore();

  const loadData = useCallback(async () => {
    try {
      const [files, branchData] = await Promise.all([
        api.listFiles(wikiId),
        api.getBranches(wikiId),
      ]);
      setFiles(files);
      setBranches(branchData.branches);
      setCurrentBranch(branchData.current);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }, [wikiId, setFiles, setBranches, setCurrentBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs or textarea unless with modifier
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen(!useWikiStore.getState().sidebarOpen);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        setCommitDialogOpen(true);
      } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        setViewMode('edit');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setViewMode('preview');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        setViewMode('split');
      } else if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setActivePanel('history');
      } else if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setActivePanel('diff');
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen, setSidebarOpen, setCommitDialogOpen, setViewMode, setActivePanel, setShortcutsDialogOpen]);

  return (
    <div className="h-screen flex flex-col bg-surface-bg overflow-hidden text-content-primary">
      <Header onRefresh={loadData} />
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && <Sidebar onFileSelect={loadData} />}
        <main className="flex-1 flex overflow-hidden">
          {activePanel === 'diff' ? (
            <DiffViewer />
          ) : activePanel === 'history' ? (
            <HistoryPanel />
          ) : currentFile ? (
            <EditorArea onSave={loadData} />
          ) : (
            <WelcomeView />
          )}
        </main>
      </div>

      {/* Developer status bar */}
      <StatusBar />

      {/* Dialogs and Modals */}
      <CommitDialog onCommit={loadData} />
      <BranchDialog onCreated={loadData} />
      <MergeDialog onMerge={loadData} />
      <ConflictResolutionDialog onResolved={loadData} />
      <SearchDialog />
      <CommandPalette />
      <ShortcutsDialog />
    </div>
  );
}
