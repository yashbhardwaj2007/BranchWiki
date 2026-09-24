import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'repositories', 'demo-wiki');

async function updateBranch() {
  await git.checkout({ fs, dir, ref: 'feature/api-docs' });
  const apiDocPath = path.join(dir, 'docs', 'api-reference.md');
  const apiContent = `# API Reference

Comprehensive API documentation for platform endpoints.

## Authentication

All requests require a Bearer token:

\`\`\`bash
curl -H "Authorization: Bearer my-token" https://api.example.com/v1/user
\`\`\`

## Endpoints

- \`GET /v1/wikis\` - List wikis
- \`POST /v1/wikis\` - Create wiki
- \`GET /v1/commits\` - View Git history

### Rate Limits

Standard tier: 100 req/min.
`;
  await fs.promises.writeFile(apiDocPath, apiContent);
  await git.add({ fs, dir, filepath: 'docs/api-reference.md' });

  // Also modify guides/react.md
  const reactPath = path.join(dir, 'guides', 'react.md');
  let reactContent = await fs.promises.readFile(reactPath, 'utf8');
  reactContent += '\n\n## Performance Optimization\n\nUse React Compiler and `useMemo` selectively for expensive computations.\n';
  await fs.promises.writeFile(reactPath, reactContent);
  await git.add({ fs, dir, filepath: 'guides/react.md' });

  await git.commit({
    fs,
    dir,
    message: 'Add API reference and React performance optimization guide',
    author: { name: 'Radhika', email: 'radhikakamal2004@gmail.com', timestamp: Math.floor(Date.now() / 1000) - 300 }
  });

  await git.checkout({ fs, dir, ref: 'main' });
  console.log('Successfully seeded feature/api-docs branch with realistic changes and switched back to main.');
}

updateBranch().catch(console.error);
