import { GitService } from './gitService';

export class SearchService {
  static async searchWiki(repoPath: string, query: string, branch?: string) {
    const files = await GitService.listFiles(repoPath, branch);
    const results = [];
    
    for (const file of files) {
      if (file.type !== 'blob') continue;
      
      const content = await GitService.getFileContent(repoPath, file.path, branch);
      const lines = content.split('\n');
      const matches = [];
      
      if (file.path.toLowerCase().includes(query.toLowerCase())) {
        matches.push({ type: 'filename', path: file.path });
      }
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          matches.push({ type: 'content', line: index + 1, text: line });
        }
      });
      
      if (matches.length > 0) {
        results.push({ path: file.path, matches });
      }
    }
    
    return results;
  }
}
