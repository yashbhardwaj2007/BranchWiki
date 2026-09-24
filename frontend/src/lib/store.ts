import { create } from 'zustand';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export interface UserProfile {
  name: string;
  email: string;
  color: string;
}

export interface ConflictData {
  conflict: boolean;
  conflictFile: string;
  currentBranch: string;
  incomingBranch: string;
  currentContent: string;
  incomingContent: string;
  conflictMarkers: string;
}

interface WikiState {
  wikiId: string;
  wikiName: string;
  currentBranch: string;
  currentFile: string | null;
  fileContent: string;
  originalContent: string;
  isEditing: boolean;
  isDirty: boolean;
  files: FileNode[];
  branches: string[];
  viewMode: 'edit' | 'preview' | 'split';
  sidebarOpen: boolean;
  activePanel: 'files' | 'history' | 'branches' | 'diff' | null;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  commitDialogOpen: boolean;
  mergeDialogOpen: boolean;
  branchDialogOpen: boolean;
  conflictDialogOpen: boolean;
  conflictData: ConflictData | null;
  collaborators: Array<{ id: string; name: string; color: string; cursor?: { line: number; ch: number } }>;
  currentUser: UserProfile;
  typingCollaborator: string | null;
  modifiedFiles: string[];

  // Interactive UI enhancements
  theme: 'light' | 'dark';
  outlineOpen: boolean;
  shortcutsDialogOpen: boolean;
  cursorPos: { line: number; col: number };
  astFilterType: string | null;

  setWikiId: (id: string) => void;
  setWikiName: (name: string) => void;
  setCurrentBranch: (branch: string) => void;
  setCurrentFile: (file: string | null) => void;
  setFileContent: (content: string) => void;
  setOriginalContent: (content: string) => void;
  setIsEditing: (editing: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  setFiles: (files: FileNode[]) => void;
  setBranches: (branches: string[]) => void;
  setViewMode: (mode: 'edit' | 'preview' | 'split') => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: 'files' | 'history' | 'branches' | 'diff' | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCommitDialogOpen: (open: boolean) => void;
  setMergeDialogOpen: (open: boolean) => void;
  setBranchDialogOpen: (open: boolean) => void;
  setConflictDialogOpen: (open: boolean) => void;
  setConflictData: (data: ConflictData | null) => void;
  setCollaborators: (users: Array<{ id: string; name: string; color: string; cursor?: { line: number; ch: number } }>) => void;
  setCurrentUser: (user: UserProfile) => void;
  setTypingCollaborator: (name: string | null) => void;
  setModifiedFiles: (files: string[]) => void;

  setTheme: (theme: 'light' | 'dark') => void;
  setOutlineOpen: (open: boolean) => void;
  setShortcutsDialogOpen: (open: boolean) => void;
  setCursorPos: (pos: { line: number; col: number }) => void;
  setAstFilterType: (type: string | null) => void;
}

export const useWikiStore = create<WikiState>((set) => ({
  wikiId: 'demo-wiki',
  wikiName: 'Product Documentation',
  currentBranch: 'main',
  currentFile: null,
  fileContent: '',
  originalContent: '',
  isEditing: false,
  isDirty: false,
  files: [],
  branches: ['main'],
  viewMode: 'split',
  sidebarOpen: true,
  activePanel: 'files',
  commandPaletteOpen: false,
  searchOpen: false,
  commitDialogOpen: false,
  mergeDialogOpen: false,
  branchDialogOpen: false,
  conflictDialogOpen: false,
  conflictData: null,
  collaborators: [],
  currentUser: {
    name: 'Yash Bhaskar',
    email: 'yash@branchwiki.dev',
    color: '#0D9488',
  },
  typingCollaborator: null,
  modifiedFiles: [],

  theme: 'dark',
  outlineOpen: false,
  shortcutsDialogOpen: false,
  cursorPos: { line: 1, col: 1 },
  astFilterType: null,

  setWikiId: (id) => set({ wikiId: id }),
  setWikiName: (name) => set({ wikiName: name }),
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  setCurrentFile: (file) => set({ currentFile: file }),
  setFileContent: (content) => set({ fileContent: content }),
  setOriginalContent: (content) => set({ originalContent: content }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setFiles: (files) => set({ files }),
  setBranches: (branches) => set({ branches }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setCommitDialogOpen: (open) => set({ commitDialogOpen: open }),
  setMergeDialogOpen: (open) => set({ mergeDialogOpen: open }),
  setBranchDialogOpen: (open) => set({ branchDialogOpen: open }),
  setConflictDialogOpen: (open) => set({ conflictDialogOpen: open }),
  setConflictData: (data) => set({ conflictData: data }),
  setCollaborators: (users) => set({ collaborators: users }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setTypingCollaborator: (name) => set({ typingCollaborator: name }),
  setModifiedFiles: (files) => set({ modifiedFiles: files }),

  setTheme: (theme) => set({ theme }),
  setOutlineOpen: (open) => set({ outlineOpen: open }),
  setShortcutsDialogOpen: (open) => set({ shortcutsDialogOpen: open }),
  setCursorPos: (pos) => set({ cursorPos: pos }),
  setAstFilterType: (type) => set({ astFilterType: type }),
}));
