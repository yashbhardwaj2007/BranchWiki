import path from 'path';
import { REPOS_DIR } from '../config';
import { ValidationError } from './errors';

export function getRepoPath(wikiId: string): string {
  if (!wikiId || typeof wikiId !== 'string') {
    throw new ValidationError('Invalid repository ID');
  }

  // Strictly allow alphanumeric, hyphens, and underscores
  const safeId = path.basename(wikiId.trim());
  if (!/^[a-zA-Z0-9_\-]+$/.test(safeId)) {
    throw new ValidationError('Repository ID contains invalid characters');
  }

  const resolved = path.resolve(REPOS_DIR, safeId);
  const resolvedBase = path.resolve(REPOS_DIR);

  if (!resolved.startsWith(resolvedBase)) {
    throw new ValidationError('Path traversal attempt detected');
  }

  return resolved;
}

export function validateFilePath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path is required');
  }

  // Reject null bytes and illegal control characters
  if (filePath.includes('\0') || /[\x00-\x1f\x7f]/.test(filePath)) {
    throw new ValidationError('File path contains illegal characters');
  }

  // Convert Windows backslashes to forward slashes for internal consistency
  let normalized = filePath.replace(/\\/g, '/').trim();

  // Strip leading slashes to prevent absolute path interpretation
  normalized = normalized.replace(/^\/+/, '');

  if (path.isAbsolute(normalized)) {
    throw new ValidationError('Absolute file paths are not permitted');
  }

  // Normalize path segments
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length === 0) {
    throw new ValidationError('Empty file path');
  }

  // Reject directory traversal segments
  for (const seg of segments) {
    if (seg === '..' || seg === '.') {
      throw new ValidationError('Path traversal sequences ("..") are not allowed');
    }
    // Protect Git metadata directory
    if (seg.toLowerCase() === '.git') {
      throw new ValidationError('Access to .git repository internal files is forbidden');
    }
  }

  return segments.join('/');
}

export function isValidBranchName(branch: string): boolean {
  if (!branch || typeof branch !== 'string') return false;
  const b = branch.trim();

  // Git reference format rules
  if (b.length === 0 || b.length > 255) return false;
  if (b.startsWith('.') || b.endsWith('.')) return false;
  if (b.startsWith('/') || b.endsWith('/')) return false;
  if (b.includes('//') || b.includes('..')) return false;
  if (b.endsWith('.lock')) return false;

  // Disallow forbidden Git characters: space, ~, ^, :, ?, *, [, \, @{
  if (/[\s~^:?*\[\\@\x00-\x1f\x7f]/.test(b)) return false;

  return true;
}
