import fs from 'fs';
import path from 'path';
import git from 'isomorphic-git';
import { REPOS_DIR } from './config';

const DEMO_WIKI_ID = 'demo-wiki';
const DEMO_REPO_PATH = path.join(REPOS_DIR, DEMO_WIKI_ID);
const AUTHOR = { name: 'Yash Bhaskar', email: 'yash@branchwiki.dev' };
const AUTHOR2 = { name: 'Rahul Sharma', email: 'rahul@branchwiki.dev' };

const FILES: Record<string, string> = {
  'README.md': `# Product Documentation

Welcome to the product documentation for our platform. This wiki contains all the technical documentation, guides, and references for our engineering team.

## Quick Links

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Contributing](docs/contributing.md)
- [React Guide](guides/react.md)
- [Node.js Guide](guides/node.md)
- [Deployment](guides/deployment.md)

## About

This documentation is maintained by the engineering team and is version-controlled using Git-backed collaboration.
`,

  'docs/getting-started.md': `# Getting Started

This guide will help you set up your development environment and get started with our platform.

## Prerequisites

- Node.js 18 or later
- npm or yarn
- Git
- PostgreSQL 14+

## Installation

1. Clone the repository:

\`\`\`bash
git clone https://github.com/team/platform.git
cd platform
\`\`\`

2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` with your database credentials and API keys.

4. Run database migrations:

\`\`\`bash
npm run db:migrate
\`\`\`

5. Start the development server:

\`\`\`bash
npm run dev
\`\`\`

The application will be available at \`http://localhost:3000\`.

## Project Structure

\`\`\`
src/
  components/    # React components
  pages/         # Next.js pages
  lib/           # Utility functions
  api/           # API routes
  styles/        # CSS modules
\`\`\`

## Next Steps

- Read the [Architecture Guide](architecture.md) to understand the system design
- Check the [Contributing Guide](contributing.md) for development workflows
- Explore the [React Guide](../guides/react.md) for frontend patterns
`,

  'docs/architecture.md': `# Architecture

Our platform follows a layered architecture designed for scalability and maintainability.

## System Overview

The platform consists of three main layers:

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + Zustand

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Authentication**: JWT + OAuth 2.0

### Data Layer
- **Primary Database**: PostgreSQL
- **Cache**: Redis
- **Search**: Elasticsearch
- **File Storage**: S3-compatible object storage

## API Design

We follow RESTful conventions with consistent error handling:

\`\`\`json
{
  "data": {},
  "error": null,
  "meta": {
    "page": 1,
    "total": 100
  }
}
\`\`\`

## Deployment

See the [Deployment Guide](../guides/deployment.md) for infrastructure details.
`,

  'docs/contributing.md': `# Contributing

Thank you for contributing to our platform. This document outlines our development workflow.

## Branch Strategy

- \`main\` — production-ready code
- \`develop\` — integration branch
- \`feature/*\` — new features
- \`fix/*\` — bug fixes
- \`docs/*\` — documentation updates

## Pull Request Process

1. Create a branch from \`main\`
2. Make your changes
3. Write or update tests
4. Submit a pull request
5. Address review feedback
6. Merge after approval

## Code Standards

- Use TypeScript strict mode
- Follow ESLint configuration
- Write unit tests for business logic
- Document public APIs
- Use conventional commit messages

## Commit Message Format

\`\`\`
type(scope): description

[optional body]
\`\`\`

Types: \`feat\`, \`fix\`, \`docs\`, \`style\`, \`refactor\`, \`test\`, \`chore\`
`,

  'guides/react.md': `# React Development Guide

Our frontend is built with React and Next.js. This guide covers our patterns and conventions.

## Component Structure

We organize components by feature:

\`\`\`
components/
  auth/
    LoginForm.tsx
    SignupForm.tsx
  dashboard/
    DashboardLayout.tsx
    StatsCard.tsx
  shared/
    Button.tsx
    Input.tsx
    Modal.tsx
\`\`\`

## State Management

We use a combination of:
- **React Query** for server state
- **Zustand** for client state
- **React Context** for theme/auth

### React Query Example

\`\`\`tsx
import { useQuery } from '@tanstack/react-query';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  });
}
\`\`\`

## Styling

Use Tailwind CSS utility classes. Avoid inline styles.

\`\`\`tsx
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
      {children}
    </div>
  );
}
\`\`\`
`,

  'guides/node.md': `# Node.js Backend Guide

Our backend runs on Node.js with Express. This guide covers server-side patterns.

## Service Architecture

We follow a service-oriented architecture:

\`\`\`
services/
  userService.ts
  authService.ts
  notificationService.ts
\`\`\`

Each service encapsulates business logic and data access.

### Service Example

\`\`\`typescript
import { prisma } from '../lib/prisma';

export class UserService {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserInput) {
    return prisma.user.create({ data });
  }
}
\`\`\`

## Middleware

Custom middleware follows this pattern:

\`\`\`typescript
import { Request, Response, NextFunction } from 'express';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
\`\`\`

## Error Handling

Use custom error classes:

\`\`\`typescript
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}
\`\`\`
`,

  'guides/deployment.md': `# Deployment Guide

This document covers our deployment process and infrastructure.

## Environments

| Environment | URL | Branch |
|------------|-----|--------|
| Production | app.example.com | main |
| Staging | staging.example.com | develop |
| Preview | pr-*.example.com | feature/* |

## CI/CD Pipeline

Our pipeline runs on GitHub Actions:

1. **Lint** — ESLint + Prettier
2. **Test** — Unit and integration tests
3. **Build** — Next.js production build
4. **Deploy** — Automated deployment

## Docker

Build the application:

\`\`\`bash
docker build -t platform:latest .
\`\`\`

Run locally:

\`\`\`bash
docker compose up -d
\`\`\`

## Environment Variables

| Variable | Description | Required |
|----------|------------|----------|
| DATABASE_URL | PostgreSQL connection | Yes |
| REDIS_URL | Redis connection | Yes |
| JWT_SECRET | Auth signing key | Yes |
| S3_BUCKET | File storage bucket | Yes |

## Monitoring

We use:
- **Datadog** for APM and logging
- **Sentry** for error tracking
- **PagerDuty** for alerting
`,
};

async function seed() {
  console.log('🌱 Seeding BranchWiki demo data...\n');

  // Clean up existing
  if (fs.existsSync(DEMO_REPO_PATH)) {
    await fs.promises.rm(DEMO_REPO_PATH, { recursive: true, force: true });
  }
  await fs.promises.mkdir(DEMO_REPO_PATH, { recursive: true });

  // Init repo
  await git.init({ fs, dir: DEMO_REPO_PATH, defaultBranch: 'main' });
  console.log('  ✓ Initialized git repository');

  // Write README and docs first
  const firstBatchFiles = ['README.md', 'docs/getting-started.md', 'docs/architecture.md', 'docs/contributing.md'];
  for (const filePath of firstBatchFiles) {
    const fullPath = path.join(DEMO_REPO_PATH, filePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, FILES[filePath]);
    await git.add({ fs, dir: DEMO_REPO_PATH, filepath: filePath });
  }

  await git.commit({
    fs,
    dir: DEMO_REPO_PATH,
    message: 'Initial documentation',
    author: { ...AUTHOR, timestamp: Math.floor(Date.now() / 1000) - 86400 },
  });
  console.log('  ✓ Commit: Initial documentation');

  // Write guides
  const secondBatchFiles = ['guides/react.md', 'guides/node.md', 'guides/deployment.md'];
  for (const filePath of secondBatchFiles) {
    const fullPath = path.join(DEMO_REPO_PATH, filePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, FILES[filePath]);
    await git.add({ fs, dir: DEMO_REPO_PATH, filepath: filePath });
  }

  await git.commit({
    fs,
    dir: DEMO_REPO_PATH,
    message: 'Add development guides',
    author: { ...AUTHOR2, timestamp: Math.floor(Date.now() / 1000) - 3600 },
  });
  console.log('  ✓ Commit: Add development guides');

  // Make a small update
  const updatedGettingStarted = FILES['docs/getting-started.md'].replace(
    '## Next Steps',
    '## Troubleshooting\n\nIf you encounter issues during setup:\n\n- Ensure Node.js version is 18+: `node --version`\n- Clear npm cache: `npm cache clean --force`\n- Delete `node_modules` and reinstall\n\n## Next Steps'
  );
  await fs.promises.writeFile(path.join(DEMO_REPO_PATH, 'docs/getting-started.md'), updatedGettingStarted);
  await git.add({ fs, dir: DEMO_REPO_PATH, filepath: 'docs/getting-started.md' });

  await git.commit({
    fs,
    dir: DEMO_REPO_PATH,
    message: 'Add troubleshooting section to getting started',
    author: { ...AUTHOR, timestamp: Math.floor(Date.now() / 1000) - 600 },
  });
  console.log('  ✓ Commit: Add troubleshooting section');

  // Create a feature branch
  await git.branch({ fs, dir: DEMO_REPO_PATH, ref: 'feature/api-docs' });
  console.log('  ✓ Branch: feature/api-docs created');

  // Write metadata
  const metadataPath = path.join(REPOS_DIR, 'wikis.json');
  const metadata = [{
    id: DEMO_WIKI_ID,
    name: 'Product Documentation',
    description: 'Engineering team documentation and guides',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }];
  await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log('  ✓ Wiki metadata saved');

  console.log('\n✅ Seeding complete! Demo wiki ready at: ' + DEMO_REPO_PATH);
}

export { seed };

// Run directly if called from command line
if (typeof require !== 'undefined' && require.main === module) {
  seed().catch(console.error);
}
