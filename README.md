# BranchWiki 🌿

> **Collaborative documentation with the workflow discipline of Git.**

BranchWiki is an open-source collaborative Markdown wiki backed by real Git versioning (powered by `isomorphic-git`). It brings the power of branches, commits, side-by-side visual diffs, and merge workflows into an editorial writing experience designed for engineering teams.

---

## 🏗️ Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │            Next.js Frontend             │
                      │     (App Router, Tailwind, Monaco)      │
                      └─────────────┬───────────────────────────┘
                                    │
                       HTTP (REST)  │  WebSockets (Socket.IO + Yjs)
                                    │
                      ┌─────────────▼───────────────────────────┐
                      │          Express.js Backend             │
                      │    (TypeScript, Services, Routes)       │
                      └─────────────┬───────────────────────────┘
                                    │
                                    ▼
                      ┌─────────────────────────────────────────┐
                      │          Git Storage Layer              │
                      │   (isomorphic-git on disk storage)      │
                      └─────────────────────────────────────────┘
```

- **Frontend**: Next.js 14, Tailwind CSS, `@monaco-editor/react`, `react-markdown` with GFM, Zustand state store, Lucide icons, `socket.io-client`.
- **Backend**: Express.js with TypeScript, `isomorphic-git` for real Git operations, Socket.IO for keystroke-level collaboration and presence, Unified/Remark for syntax-aware Markdown AST diffs.
- **Git as Source of Truth**: Documents, history, branches, diffs, and merges are executed directly against Git repositories on disk (`repositories/demo-wiki/.git`).

---

## 🎨 Visual Identity & Design System

The application deliberately rejects generic SaaS dashboard aesthetics in favor of a calm, technical, editorial developer-tool aesthetic:

- **Surface palette**: `#F7F7F5` workspace canvas with crisp `#FFFFFF` panels.
- **Typography**: Inter for editorial reading, JetBrains Mono for commit hashes, paths, and branch names.
- **Accent**: Restrained teal (`#0D9488`) used strictly for active branches, diff additions, and primary actions.
- **Diff viewer**: Side-by-side comparison with green/red additions/deletions and AST block metadata badges.

---

## 🌟 Key Highlights & Hackathon Features

### 1. 🌿 True Git-Backed Versioning
- Real Git repository initialized on disk using `isomorphic-git`.
- Every commit creates a genuine Git SHA with author metadata, parent pointers, and commit messages.
- Full branch creation, deletion, and branch switching.

### 2. ⚡ Real-Time Keystroke Collaboration
- Instant document synchronization across browser tabs/windows using WebSockets.
- Presence tracking with live collaborator avatar badges and active collaborator counts.
- **Live Typing Indicator**: Real-time *"● Rahul is typing..."* visual feedback.
- **Demo Persona Switcher**: Click the user avatar in the top right to instantly switch identities (Yash Bhaskar / Rahul Sharma / Alex Chen) to demo multi-user collaboration in split windows.

### 3. 📊 Visual Commit & Branch Graph (SVG)
- Interactive branch timeline with SVG curved connector paths and branch-colored commit nodes.
- Shows branch lanes, short SHAs, commit messages, authors, and relative timestamps.
- Click any node to immediately view its file-level diff and additions/deletions.

### 4. 🔍 Syntax-Aware Markdown AST Diff Viewer
- Side-by-side diff with line numbers and change gutters.
- Uses `unified` and `remark-parse` to construct AST trees and detect structural block changes:
  - Headings changed/added
  - Paragraphs modified
  - Code blocks added
  - Lists and tables updated
- Displays a dedicated **Changed Blocks** summary bar (e.g. *5 headings, 4 paragraphs, 1 code block, 1 list*).

### 5. 🔀 Merge Workflows & 3-Way Conflict Resolution
- **Merge Preview**: Displays incoming commits count, total files changed, and addition/deletion lines before merging.
- **Conflict Resolution UI**: Interactive dialog displaying `<<<<<<< HEAD` vs `>>>>>>> incoming` markers with 3 one-click resolution actions:
  - *Use Current (HEAD)*
  - *Use Incoming*
  - *Keep Both*
  - *Manual Resolution* in an embedded Monaco editor.
- Demo mode includes a *"Simulate Merge Conflict"* option in the merge dialog.

### 6. 📁 Lightweight Document Explorer
- Expandable / collapsible directory tree.
- Create new Markdown documents or folders.
- Delete files with confirmation.
- Modified status indicator (amber dot next to files with uncommitted working tree changes).

### 7. ⌨️ Command Palette & Fast Full-Text Search
- Global keyboard shortcut: `Cmd/Ctrl + K` to trigger the command palette.
- Fast full-text search across all documents with highlighted line matches and line numbers.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- npm

### 2. Run the Backend
```bash
cd backend
npm install
npm run seed     # Seeds realistic demo documentation with 3 commits and feature branch
npm run dev      # Runs Express server on http://localhost:3001
```

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev      # Runs Next.js app on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Recommended Hackathon Demo Flow

Follow this sequence during judging:

1. **Explore the Workspace**:
   - The app opens with the **Product Documentation** wiki overview.
   - Click files in the left sidebar tree: `docs/getting-started.md`, `docs/architecture.md`, `guides/react.md`.

2. **Edit & Real-Time Sync**:
   - Open `docs/getting-started.md`.
   - Open a second browser window / incognito tab side-by-side.
   - In window 2, switch the user avatar to **Rahul Sharma**.
   - Type in window 2 — notice window 1 immediately updates in real-time and shows *"● Rahul is typing..."*!

3. **Save & Commit Changes**:
   - Edit a paragraph in window 1 — notice the amber unsaved indicator.
   - Press `Cmd/Ctrl + S` or click **Save**.
   - Click the commit button in the top bar (or `Cmd/Ctrl + K` → "Commit changes").
   - Review the staged additions/deletions and commit message: `"Improve platform installation steps"`.
   - Click **Commit** — observe the real Git commit SHA.

4. **Inspect Interactive SVG Git Graph**:
   - Click the **History** tab in the sidebar.
   - Switch between **Graph** and **List** view.
   - See the SVG lanes connecting commits with branch-colored nodes (`#0D9488` for main, `#6366F1` for feature branches).
   - Click any commit to view line-level diffs on the right inspector.

5. **Compare Branches in Side-by-Side Diff**:
   - Click the **Compare** tab in the sidebar.
   - Select `main` vs `feature/api-docs`.
   - Click **Compare** to view:
     - The **Changed Blocks Bar** (*5 headings, 4 paragraphs, 1 code block, 1 list*).
     - The side-by-side diff with green additions and red deletions.

6. **Demonstrate Conflict Resolution**:
   - Click the Git Merge icon in the header.
   - Select `feature/api-docs` → `main`.
   - Check the **"Simulate Merge Conflict for demo"** checkbox.
   - Click **Test Conflict Resolution** — the Conflict Resolution dialog opens!
   - Demonstrate clicking **"Use Incoming"** or **"Use Current"**, or edit manually in Monaco.
   - Click **"Resolve & Complete Merge"** — the merge is cleanly committed!

7. **Verify Merged Main Branch**:
   - Switch back to the document explorer.
   - Notice the new document `docs/api-reference.md` is now part of the `main` branch!

---

## 📡 API Reference

All backend routes are mounted under `/api`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wikis` | List all wiki repositories |
| `POST` | `/api/wikis` | Create a new wiki repository |
| `GET` | `/api/wikis/:id/files` | Get document file tree |
| `GET` | `/api/wikis/:id/file?path=...` | Read file content from working tree or branch |
| `PUT` | `/api/wikis/:id/file` | Save/write document content |
| `DELETE` | `/api/wikis/:id/file?path=...` | Delete document |
| `GET` | `/api/wikis/:id/branches` | List all Git branches |
| `POST` | `/api/wikis/:id/branches` | Create new branch |
| `POST` | `/api/wikis/:id/checkout` | Switch active branch |
| `GET` | `/api/wikis/:id/commits` | Get commit log with author and parent SHAs |
| `POST` | `/api/wikis/:id/commit` | Create real Git commit |
| `GET` | `/api/wikis/:id/diff?from=...&to=...` | Side-by-side diff with AST block stats |
| `GET` | `/api/wikis/:id/merge/preview` | Preview commits and line stats before merge |
| `POST` | `/api/wikis/:id/merge` | Perform Git merge with conflict detection |
| `POST` | `/api/wikis/:id/merge/resolve` | Resolve conflict and complete merge |
| `GET` | `/api/wikis/:id/search?q=...` | Full-text search across documents |
