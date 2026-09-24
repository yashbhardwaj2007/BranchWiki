import { Router, Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/searchService';
import { getRepoPath } from '../utils/paths';

const router = Router();

router.get('/wikis/:wikiId/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const q = req.query.q as string;
    const branch = req.query.branch as string | undefined;
    if (!q) return res.status(400).json({ error: 'Query is required' });
    const results = await SearchService.searchWiki(repoPath, q, branch);
    res.json(results);
  } catch (e) { next(e); }
});

export default router;
