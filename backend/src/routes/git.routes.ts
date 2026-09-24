import { Router, Request, Response, NextFunction } from 'express';
import { GitService } from '../services/gitService';
import { getRepoPath } from '../utils/paths';
import { DEFAULT_AUTHOR } from '../config';

const router = Router();

// Commit changes
router.post('/wikis/:wikiId/commit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const { message, author } = req.body;
    if (!message) return res.status(400).json({ error: 'Commit message is required' });
    const oid = await GitService.commit(repoPath, message, author || DEFAULT_AUTHOR);
    res.json({ oid, message });
  } catch (e) { next(e); }
});

// Get commit history
router.get('/wikis/:wikiId/commits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const branch = req.query.branch as string | undefined;
    const count = parseInt(req.query.count as string) || 50;
    const commits = await GitService.getLog(repoPath, branch, count);
    res.json(commits.map(c => ({
      oid: c.oid,
      message: c.commit.message,
      author: c.commit.author,
      committer: c.commit.committer,
      parent: c.commit.parent,
    })));
  } catch (e) { next(e); }
});

// Get commit details
router.get('/wikis/:wikiId/commits/:oid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const diff = await GitService.getCommitDiff(repoPath, req.params.oid);
    res.json(diff);
  } catch (e) { next(e); }
});

// Get working tree status
router.get('/wikis/:wikiId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const matrix = await GitService.getStatus(repoPath);
    // statusMatrix returns [filepath, HEAD, workdir, stage]
    // 1=exist, 0=absent, 2=modified
    const changes = matrix
      .filter(([_, head, workdir, stage]) => head !== 1 || workdir !== 1 || stage !== 1)
      .map(([filepath, head, workdir, stage]) => {
        let status = 'unmodified';
        if (head === 0 && workdir === 2) status = 'added';
        else if (head === 1 && workdir === 0) status = 'deleted';
        else if (head === 1 && workdir === 2) status = 'modified';
        return { filepath, status, head, workdir, stage };
      });
    res.json(changes);
  } catch (e) { next(e); }
});

export default router;
