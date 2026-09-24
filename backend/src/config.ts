import path from 'path';

export const REPOS_DIR = path.join(process.cwd(), 'repositories');
export const PORT = process.env.PORT || 3001;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
export const DEFAULT_AUTHOR = { name: 'BranchWiki User', email: 'user@branchwiki.dev' };
