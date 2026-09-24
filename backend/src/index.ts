import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PORT, CORS_ORIGIN } from './config';
import { setupCollaboration } from './collaboration/socketHandler';
import wikiRoutes from './routes/wiki.routes';
import fileRoutes from './routes/file.routes';
import gitRoutes from './routes/git.routes';
import branchRoutes from './routes/branch.routes';
import diffRoutes from './routes/diff.routes';
import mergeRoutes from './routes/merge.routes';
import searchRoutes from './routes/search.routes';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

// Mount routes
app.use('/api', wikiRoutes);
app.use('/api', fileRoutes);
app.use('/api', gitRoutes);
app.use('/api', branchRoutes);
app.use('/api', diffRoutes);
app.use('/api', mergeRoutes);
app.use('/api', searchRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

setupCollaboration(io);

server.listen(PORT, () => {
  console.log(`\n  🌿 BranchWiki backend running on http://localhost:${PORT}\n`);
});
