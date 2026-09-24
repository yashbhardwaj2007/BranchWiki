import { Router, Request, Response, NextFunction } from 'express';
import { WikiService } from '../services/wikiService';

const router = Router();

router.get('/wikis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wikis = await WikiService.listWikis();
    res.json(wikis);
  } catch (e) { next(e); }
});

router.post('/wikis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const wiki = await WikiService.createWiki(name, description || '');
    res.status(201).json(wiki);
  } catch (e) { next(e); }
});

router.get('/wikis/:wikiId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wiki = await WikiService.getWiki(req.params.wikiId);
    if (!wiki) return res.status(404).json({ error: 'Wiki not found' });
    res.json(wiki);
  } catch (e) { next(e); }
});

router.delete('/wikis/:wikiId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await WikiService.deleteWiki(req.params.wikiId);
    if (!deleted) return res.status(404).json({ error: 'Wiki not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
