import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { PORT, CORS_ORIGIN, REPOS_DIR } from './config';
import { setupCollaboration } from './collaboration/socketHandler';
import { seed } from './seed';
import wikiRoutes from './routes/wiki.routes';
import fileRoutes from './routes/file.routes';
import gitRoutes from './routes/git.routes';
import branchRoutes from './routes/branch.routes';
import diffRoutes from './routes/diff.routes';
import mergeRoutes from './routes/merge.routes';
import searchRoutes from './routes/search.routes';

const app = express();
const server = createServer(app);

// Allow CORS from configured origin or reflect request origin
const corsOptions: cors.CorsOptions = {
  origin: CORS_ORIGIN === '*' ? true : (CORS_ORIGIN || true),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors(corsOptions));
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

async function startServer() {
  // Ensure demo repository exists with initial commits so isomorphic-git has a valid HEAD
  try {
    const demoGitDir = path.join(REPOS_DIR, 'demo-wiki', '.git');
    const headFile = path.join(demoGitDir, 'HEAD');
    if (!fs.existsSync(headFile)) {
      console.log('🌱 No demo-wiki found or missing HEAD. Auto-seeding initial repository...');
      await seed();
    }
  } catch (err) {
    console.error('Warning: Auto-seed encountered an issue:', err);
  }

  server.listen(PORT, () => {
    console.log(`\n  🌿 BranchWiki backend running on http://localhost:${PORT}\n`);
  });
}

startServer();
