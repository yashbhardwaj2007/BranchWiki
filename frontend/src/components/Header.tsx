'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWikiStore, UserProfile } from '@/lib/store';
import { api } from '@/lib/api';
import {
  GitBranch,
  Search,
  ChevronDown,
  GitCommit,
  GitMerge,
  Check,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
  Sparkles,
  Command,
} from 'lucide-react';
import clsx from 'clsx';

const PRESET_USERS: UserProfile[] = [
  { name: 'Yash Bhaskar', email: 'yash@branchwiki.dev', color: '#0D9488' },
  { name: 'Rahul Sharma', email: 'rahul@branchwiki.dev', color: '#6366F1' },
  { name: 'Alex Chen', email: 'alex@branchwiki.dev', color: '#F59E0B' },
];

export function Header({ onRefresh }: { onRefresh: () => void }) {
  const {
    wikiName,
    currentBranch,
    branches,
    sidebarOpen,
    setSidebarOpen,
    setCurrentBranch,
    setSearchOpen,
    setCommandPaletteOpen,
    setCommitDialogOpen,
    setBranchDialogOpen,
    setMergeDialogOpen,
    wikiId,
    currentFile,
    setCurrentFile,
    setFiles,
    setBranches,
    currentUser,
    setCurrentUser,
    theme,
    setTheme,
    fileContent,
    setFileContent,
    setTypingCollaborator,
    collaborators,
  } = useWikiStore();

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply theme class to document root
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSwitchBranch = async (branch: string) => {
    try {
      await api.switchBranch(wikiId, branch);
      setCurrentBranch(branch);
      setBranchDropdownOpen(false);
      setCurrentFile(null);
      const [files, branchData] = await Promise.all([
        api.listFiles(wikiId),
        api.getBranches(wikiId),
      ]);
      setFiles(files);
      setBranches(branchData.branches);
    } catch (e) {
      console.error('Failed to switch branch:', e);
    }
  };

  // One-click live peer collaboration demo trigger
  const handleSimulatePeerEdit = () => {
    setTypingCollaborator('Rahul Sharma');
    setTimeout(() => {
      if (currentFile) {
        const addition = `\n\n> 💡 **Peer Note (${new Date().toLocaleTimeString()} by Rahul)**:\n> Real-time peer collaboration verified with automatic AST diff tracking!\n`;
        setFileContent(fileContent + addition);
      }
      setTimeout(() => setTypingCollaborator(null), 1500);
    }, 1200);
  };

  return (
    <header className="h-[52px] bg-surface-panel border-b border-border flex items-center px-4 gap-3 flex-shrink-0 z-30">
      {/* Left: toggle sidebar + brand */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-1.5 rounded-md hover:bg-surface-hover text-content-secondary hover:text-content-primary transition-colors"
        title={sidebarOpen ? 'Collapse sidebar (⌘B)' : 'Expand sidebar (⌘B)'}
      >
        {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeft size={17} />}
      </button>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center shadow-glow-teal transition-transform hover:scale-105">
          <span className="text-white text-xs font-bold font-mono">B</span>
        </div>
        <span className="font-semibold text-sm text-content-primary tracking-tight">BranchWiki</span>
        <span className="text-content-tertiary text-xs">/</span>
        <span className="text-xs text-content-secondary font-medium">{wikiName}</span>
      </div>

      {/* Center: Interactive File Breadcrumb */}
      {currentFile && (
        <div className="hidden md:flex items-center gap-1 ml-3 px-2 py-0.5 rounded-md bg-surface-bg border border-border/60 text-xs text-content-secondary">
          <span className="text-content-tertiary">/</span>
          {currentFile.split('/').map((part, i, arr) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-content-tertiary">/</span>}
              <span className={i === arr.length - 1 ? 'text-accent font-semibold' : 'text-content-secondary'}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {/* Instant Peer Collab Demo Trigger */}
        <button
          onClick={handleSimulatePeerEdit}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-accent bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all active:scale-95"
          title="Simulate live collaborator typing and editing in real-time"
        >
          <Sparkles size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
          <span>Simulate Peer Edit</span>
        </button>

        {/* Search & Command palette */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border text-content-secondary text-xs hover:bg-surface-hover hover:text-content-primary transition-colors shadow-2xs"
          title="Open Command Palette (⌘K)"
        >
          <Search size={13} />
          <span className="hidden sm:inline">Commands</span>
          <kbd className="hidden sm:inline text-[10px] text-content-tertiary bg-surface-hover px-1 py-0.5 rounded font-mono border border-border/40">
            ⌘K
          </kbd>
        </button>

        {/* Branch dropdown */}
        <div className="relative" ref={branchDropdownRef}>
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs hover:bg-surface-hover transition-colors font-mono shadow-2xs"
          >
            <GitBranch size={13} className="text-accent" />
            <span className="font-medium text-content-primary max-w-[120px] truncate">{currentBranch}</span>
            <ChevronDown size={11} className="text-content-tertiary" />
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-64 bg-surface-panel border border-border rounded-lg shadow-elevated z-50 py-1 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                Current Branch
              </div>
              <div className="px-3 py-1 text-xs font-mono text-accent font-medium flex items-center justify-between bg-accent/5">
                <span>{currentBranch}</span>
                <Check size={13} className="text-accent" />
              </div>
              <div className="border-t border-border my-1" />
              <div className="px-3 py-1.5 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                Available Branches
              </div>
              {branches.map((branch) => (
                <button
                  key={branch}
                  onClick={() => handleSwitchBranch(branch)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-surface-hover transition-colors text-left"
                >
                  <span className={`font-mono ${branch === currentBranch ? 'text-accent font-medium' : 'text-content-primary'}`}>
                    {branch}
                  </span>
                  {branch === currentBranch && <Check size={12} className="text-accent" />}
                </button>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => {
                    setBranchDropdownOpen(false);
                    setBranchDialogOpen(true);
                  }}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs hover:bg-surface-hover transition-colors text-left text-accent font-medium"
                >
                  <Plus size={13} />
                  <span>Create branch...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Git actions */}
        <button
          onClick={() => setCommitDialogOpen(true)}
          className="p-1.5 rounded-md border border-border hover:bg-surface-hover text-content-secondary hover:text-content-primary transition-colors shadow-2xs"
          title="Create Git commit"
        >
          <GitCommit size={15} />
        </button>

        <button
          onClick={() => setMergeDialogOpen(true)}
          className="p-1.5 rounded-md border border-border hover:bg-surface-hover text-content-secondary hover:text-content-primary transition-colors shadow-2xs"
          title="Merge branches"
        >
          <GitMerge size={15} />
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-md border border-border hover:bg-surface-hover text-content-secondary hover:text-content-primary transition-colors shadow-2xs"
          title={`Switch to ${theme === 'dark' ? 'Light (Editorial)' : 'Dark (Obsidian)'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
        </button>

        {/* Collaborator Persona Selector */}
        <div className="relative ml-1" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs transition-transform active:scale-95 ring-2 ring-transparent hover:ring-accent/40"
            style={{ backgroundColor: currentUser.color }}
            title={`Active Persona: ${currentUser.name}`}
          >
            {currentUser.name.charAt(0)}
          </button>

          {userDropdownOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-60 bg-surface-panel border border-border rounded-lg shadow-elevated z-50 py-1 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                Active Collaborator (Demo)
              </div>
              {PRESET_USERS.map((user) => (
                <button
                  key={user.email}
                  onClick={() => {
                    setCurrentUser(user);
                    setUserDropdownOpen(false);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left',
                    currentUser.email === user.email ? 'bg-accent/10' : 'hover:bg-surface-hover'
                  )}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-content-primary truncate">{user.name}</p>
                    <p className="text-[10px] text-content-tertiary truncate">{user.email}</p>
                  </div>
                  {currentUser.email === user.email && <Check size={13} className="text-accent flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
