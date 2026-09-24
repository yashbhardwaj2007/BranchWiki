import { Router, Request, Response, NextFunction } from 'express';
import { GitService } from '../services/gitService';
import { DiffService } from '../services/diffService';
import { getRepoPath } from '../utils/paths';

const router = Router();

// Merge preview
router.get('/wikis/:wikiId/merge/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const from = req.query.from as string;
    const into = req.query.into as string;
    if (!from || !into) return res.status(400).json({ error: 'from and into are required' });
    
    const changes = await GitService.diff(repoPath, into, from);
    const stats = changes.reduce((acc: any, c: any) => {
      const d = DiffService.computeTextDiff(c.fromContent || '', c.toContent || '');
      const s = DiffService.getDiffStats(d);
      return { additions: acc.additions + s.additions, deletions: acc.deletions + s.deletions };
    }, { additions: 0, deletions: 0 });
    
    // Count commits unique to from branch
    const fromLog = await GitService.getLog(repoPath, from);
    const intoLog = await GitService.getLog(repoPath, into);
    const intoOids = new Set(intoLog.map(c => c.oid));
    const uniqueCommits = fromLog.filter(c => !intoOids.has(c.oid));
    
    res.json({
      from,
      into,
      filesChanged: changes.length,
      commits: uniqueCommits.length,
      stats,
      files: changes.map(c => ({ filepath: c.filepath, status: c.status }))
    });
  } catch (e) { next(e); }
});

// Perform Merge
router.post('/wikis/:wikiId/merge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const { from, into, simulateConflict } = req.body;
    if (!from || !into) return res.status(400).json({ error: 'from and into are required' });
    
    const result = await GitService.merge(repoPath, from, into, Boolean(simulateConflict));
    res.json(result);
  } catch (e) { next(e); }
});

// Resolve Merge Conflict
router.post('/wikis/:wikiId/merge/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const { from, into, conflictFile, resolvedContent } = req.body;
    if (!from || !into || !conflictFile || resolvedContent === undefined) {
      return res.status(400).json({ error: 'from, into, conflictFile, and resolvedContent are required' });
    }

    const result = await GitService.resolveConflict(repoPath, from, into, conflictFile, resolvedContent);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;
