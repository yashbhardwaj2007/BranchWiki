import { Router, Request, Response, NextFunction } from 'express';
import { GitService } from '../services/gitService';
import { getRepoPath, isValidBranchName } from '../utils/paths';
import { ValidationError, ConflictError } from '../utils/errors';

const router = Router();

router.get('/wikis/:wikiId/branches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const branches = await GitService.getBranches(repoPath);
    const current = await GitService.getCurrentBranch(repoPath);
    res.json({ branches, current });
  } catch (e) { next(e); }
});

router.get('/wikis/:wikiId/branches/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const current = await GitService.getCurrentBranch(repoPath);
    res.json({ current });
  } catch (e) { next(e); }
});

router.post('/wikis/:wikiId/branches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const { name, baseBranch } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    const trimmedName = name.trim();
    if (!isValidBranchName(trimmedName)) {
      return res.status(400).json({
        error: 'Invalid branch name. Names cannot contain spaces, "..", "~", "^", ":", "?", "*", or control characters.'
      });
    }

    const existingBranches = await GitService.getBranches(repoPath);
    if (existingBranches.includes(trimmedName)) {
      return res.status(409).json({ error: `Branch '${trimmedName}' already exists` });
    }

    await GitService.createBranch(repoPath, trimmedName, baseBranch);
    res.status(201).json({ name: trimmedName, baseBranch: baseBranch || 'HEAD' });
  } catch (e) { next(e); }
});

router.post('/wikis/:wikiId/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const { branch } = req.body;
    if (!branch || typeof branch !== 'string') {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    const existingBranches = await GitService.getBranches(repoPath);
    if (!existingBranches.includes(branch.trim())) {
      return res.status(404).json({ error: `Branch '${branch}' not found` });
    }

    await GitService.switchBranch(repoPath, branch.trim());
    res.json({ current: branch.trim() });
  } catch (e) { next(e); }
});

router.delete('/wikis/:wikiId/branches/:name(*)', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const branchName = req.params.name || (req.params as any)[0];

    if (!branchName) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    if (branchName === 'main' || branchName === 'master') {
      return res.status(400).json({ error: `Cannot delete default branch '${branchName}'` });
    }

    const current = await GitService.getCurrentBranch(repoPath);
    if (current === branchName) {
      return res.status(400).json({ error: `Cannot delete the currently checked-out branch '${branchName}'. Switch to another branch first.` });
    }

    await GitService.deleteBranch(repoPath, branchName);
    res.json({ success: true, deleted: branchName });
  } catch (e) { next(e); }
});

export default router;
