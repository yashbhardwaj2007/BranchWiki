const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Wikis
  listWikis: () => request('/wikis'),
  getWiki: (id: string) => request(`/wikis/${id}`),
  createWiki: (name: string, description: string) =>
    request('/wikis', { method: 'POST', body: JSON.stringify({ name, description }) }),

  // Files
  listFiles: (wikiId: string, branch?: string) =>
    request(`/wikis/${wikiId}/files${branch ? `?branch=${branch}` : ''}`),
  getFile: (wikiId: string, filePath: string, branch?: string) =>
    request(`/wikis/${wikiId}/file?path=${encodeURIComponent(filePath)}${branch ? `&branch=${branch}` : ''}`),
  saveFile: (wikiId: string, filePath: string, content: string) =>
    request(`/wikis/${wikiId}/file`, { method: 'PUT', body: JSON.stringify({ path: filePath, content }) }),
  deleteFile: (wikiId: string, filePath: string) =>
    request(`/wikis/${wikiId}/file?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' }),
  renameFile: (wikiId: string, oldPath: string, newPath: string) =>
    request(`/wikis/${wikiId}/file/rename`, { method: 'POST', body: JSON.stringify({ oldPath, newPath }) }),

  // Git
  commit: (wikiId: string, message: string, author?: { name: string; email: string }) =>
    request(`/wikis/${wikiId}/commit`, { method: 'POST', body: JSON.stringify({ message, author }) }),
  getCommits: (wikiId: string, branch?: string, count?: number) =>
    request(`/wikis/${wikiId}/commits?${branch ? `branch=${branch}&` : ''}${count ? `count=${count}` : ''}`),
  getCommitDiff: (wikiId: string, oid: string) =>
    request(`/wikis/${wikiId}/diff/commit/${oid}`),
  getStatus: (wikiId: string) => request(`/wikis/${wikiId}/status`),

  // Branches
  getBranches: (wikiId: string) => request(`/wikis/${wikiId}/branches`),
  createBranch: (wikiId: string, name: string, baseBranch?: string) =>
    request(`/wikis/${wikiId}/branches`, { method: 'POST', body: JSON.stringify({ name, baseBranch }) }),
  switchBranch: (wikiId: string, branch: string) =>
    request(`/wikis/${wikiId}/checkout`, { method: 'POST', body: JSON.stringify({ branch }) }),
  deleteBranch: (wikiId: string, name: string) =>
    request(`/wikis/${wikiId}/branches/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  // Diff
  getDiff: (wikiId: string, from: string, to: string) =>
    request(`/wikis/${wikiId}/diff?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),

  // Merge
  mergePreview: (wikiId: string, from: string, into: string) =>
    request(`/wikis/${wikiId}/merge/preview?from=${encodeURIComponent(from)}&into=${encodeURIComponent(into)}`),
  merge: (wikiId: string, from: string, into: string, simulateConflict?: boolean) =>
    request(`/wikis/${wikiId}/merge`, { method: 'POST', body: JSON.stringify({ from, into, simulateConflict }) }),
  resolveConflict: (wikiId: string, from: string, into: string, conflictFile: string, resolvedContent: string) =>
    request(`/wikis/${wikiId}/merge/resolve`, { method: 'POST', body: JSON.stringify({ from, into, conflictFile, resolvedContent }) }),

  // Search
  search: (wikiId: string, query: string, branch?: string) =>
    request(`/wikis/${wikiId}/search?q=${encodeURIComponent(query)}${branch ? `&branch=${branch}` : ''}`),
};
