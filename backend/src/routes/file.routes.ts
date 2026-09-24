import { Router, Request, Response, NextFunction } from 'express';
import { GitService } from '../services/gitService';
import { getRepoPath, validateFilePath } from '../utils/paths';
import fs from 'fs';
import path from 'path';

const router = Router();

// List all files as a tree structure
router.get('/wikis/:wikiId/files', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const branch = req.query.branch as string | undefined;
    const files = await GitService.listFiles(repoPath, branch);
    
    // Build tree structure
    interface TreeNode {
      name: string;
      path: string;
      type: 'file' | 'folder';
      children?: TreeNode[];
    }
    
    const tree: TreeNode[] = [];
    const fileList = files
      .map(f => f.path)
      .filter(p => !p.startsWith('.git') && !p.includes('/.git'))
      .sort();
    
    for (const filePath of fileList) {
      const parts = filePath.split('/');
      let current = tree;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const existingNode = current.find(n => n.name === part);
        
        if (existingNode) {
          if (existingNode.children) {
            current = existingNode.children;
          }
        } else {
          const newNode: TreeNode = {
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            type: isFile ? 'file' : 'folder',
            ...(isFile ? {} : { children: [] })
          };
          current.push(newNode);
          if (!isFile && newNode.children) {
            current = newNode.children;
          }
        }
      }
    }
    
    res.json(tree);
  } catch (e) { next(e); }
});

// Get file content
router.get('/wikis/:wikiId/file', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const filePath = validateFilePath(req.query.path as string);
    const branch = req.query.branch as string | undefined;
    if (!filePath) return res.status(400).json({ error: 'path is required' });
    const content = await GitService.getFileContent(repoPath, filePath, branch);
    res.json({ path: filePath, content });
  } catch (e: any) {
    if (e.message && e.message.includes('not found')) {
      return res.status(404).json({ error: e.message });
    }
    next(e);
  }
});

// Create or update file
router.put('/wikis/:wikiId/file', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: 'path is required' });
    const safePath = validateFilePath(filePath);
    await GitService.writeFile(repoPath, safePath, content ?? '');
    res.json({ path: safePath, success: true });
  } catch (e) { next(e); }
});

// Rename file or folder
router.post('/wikis/:wikiId/file/rename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'oldPath and newPath are required' });
    }

    const safeOld = validateFilePath(oldPath);
    const safeNew = validateFilePath(newPath);

    const fullOld = path.join(repoPath, safeOld);
    const fullNew = path.join(repoPath, safeNew);

    if (!fs.existsSync(fullOld)) {
      return res.status(404).json({ error: `File or folder '${safeOld}' not found` });
    }

    if (fs.existsSync(fullNew)) {
      return res.status(409).json({ error: `Destination '${safeNew}' already exists` });
    }

    await fs.promises.mkdir(path.dirname(fullNew), { recursive: true });
    await fs.promises.rename(fullOld, fullNew);

    // Track removal of old path in Git index and addition of new path
    await GitService.stageRename(repoPath, safeOld, safeNew);

    res.json({ success: true, oldPath: safeOld, newPath: safeNew });
  } catch (e) { next(e); }
});

// Delete file
router.delete('/wikis/:wikiId/file', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const filePath = validateFilePath(req.query.path as string);
    await GitService.deleteFile(repoPath, filePath);
    res.json({ success: true, deleted: filePath });
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    next(e);
  }
});

export default router;
