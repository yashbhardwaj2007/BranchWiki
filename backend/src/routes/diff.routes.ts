import { Router, Request, Response, NextFunction } from 'express';
import { GitService } from '../services/gitService';
import { DiffService, MarkdownBlockStats } from '../services/diffService';
import { getRepoPath } from '../utils/paths';

const router = Router();

// Diff between two refs (branches/commits)
router.get('/wikis/:wikiId/diff', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const from = req.query.from as string;
    const to = req.query.to as string;
    if (!from || !to) return res.status(400).json({ error: 'from and to refs are required' });
    
    const changes = await GitService.diff(repoPath, from, to);
    
    // Enrich with line-level diff AND syntax-aware Markdown AST diff
    const enriched = changes.map(change => {
      const lineDiff = DiffService.computeTextDiff(change.fromContent || '', change.toContent || '');
      const stats = DiffService.getDiffStats(lineDiff);
      const isMarkdown = change.filepath.endsWith('.md') || change.filepath.endsWith('.markdown');
      const astDiff = isMarkdown
        ? DiffService.computeMarkdownDiff(change.fromContent || '', change.toContent || '')
        : {
            blockStats: {
              headings: 0,
              paragraphs: 0,
              codeBlocks: 0,
              lists: 0,
              tables: 0,
              blockquotes: 0,
              totalBlocksChanged: 0,
            },
            blockChanges: [],
          };

      return {
        ...change,
        lineDiff,
        stats,
        astDiff,
      };
    });
    
    const totalStats = enriched.reduce((acc, c) => ({
      additions: acc.additions + c.stats.additions,
      deletions: acc.deletions + c.stats.deletions,
    }), { additions: 0, deletions: 0 });

    const totalBlockStats: MarkdownBlockStats = enriched.reduce((acc, c) => ({
      headings: acc.headings + c.astDiff.blockStats.headings,
      paragraphs: acc.paragraphs + c.astDiff.blockStats.paragraphs,
      codeBlocks: acc.codeBlocks + c.astDiff.blockStats.codeBlocks,
      lists: acc.lists + c.astDiff.blockStats.lists,
      tables: acc.tables + c.astDiff.blockStats.tables,
      blockquotes: acc.blockquotes + c.astDiff.blockStats.blockquotes,
      totalBlocksChanged: acc.totalBlocksChanged + c.astDiff.blockStats.totalBlocksChanged,
    }), {
      headings: 0,
      paragraphs: 0,
      codeBlocks: 0,
      lists: 0,
      tables: 0,
      blockquotes: 0,
      totalBlocksChanged: 0,
    });
    
    res.json({
      from,
      to,
      files: enriched,
      totalFiles: enriched.length,
      totalStats,
      totalBlockStats,
    });
  } catch (e) { next(e); }
});

// Diff for a specific commit
router.get('/wikis/:wikiId/diff/commit/:oid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoPath = getRepoPath(req.params.wikiId);
    const changes = await GitService.getCommitDiff(repoPath, req.params.oid);
    const enriched = changes.map((change: any) => {
      const lineDiff = DiffService.computeTextDiff(change.fromContent || '', change.toContent || '');
      const stats = DiffService.getDiffStats(lineDiff);
      const isMarkdown = change.filepath.endsWith('.md') || change.filepath.endsWith('.markdown');
      const astDiff = isMarkdown
        ? DiffService.computeMarkdownDiff(change.fromContent || '', change.toContent || '')
        : {
            blockStats: {
              headings: 0,
              paragraphs: 0,
              codeBlocks: 0,
              lists: 0,
              tables: 0,
              blockquotes: 0,
              totalBlocksChanged: 0,
            },
            blockChanges: [],
          };
      return { ...change, lineDiff, stats, astDiff };
    });
    res.json({ oid: req.params.oid, files: enriched });
  } catch (e) { next(e); }
});

export default router;
