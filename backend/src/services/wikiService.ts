import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { REPOS_DIR } from '../config';
import { GitService } from './gitService';

export interface WikiMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export class WikiService {
  private static getMetadataPath() {
    return path.join(REPOS_DIR, 'wikis.json');
  }

  private static async getWikis(): Promise<WikiMetadata[]> {
    const metaPath = this.getMetadataPath();
    if (!fs.existsSync(metaPath)) {
      await fs.promises.mkdir(REPOS_DIR, { recursive: true });
      await fs.promises.writeFile(metaPath, JSON.stringify([]));
      return [];
    }
    const data = await fs.promises.readFile(metaPath, 'utf-8');
    return JSON.parse(data);
  }

  private static async saveWikis(wikis: WikiMetadata[]) {
    await fs.promises.writeFile(this.getMetadataPath(), JSON.stringify(wikis, null, 2));
  }

  static async createWiki(name: string, description: string): Promise<WikiMetadata> {
    const id = uuidv4();
    const newWiki: WikiMetadata = { id, name, description, createdAt: new Date().toISOString() };
    const wikis = await this.getWikis();
    wikis.push(newWiki);
    await this.saveWikis(wikis);
    
    const repoPath = path.join(REPOS_DIR, id);
    await GitService.initRepo(repoPath);
    return newWiki;
  }

  static async getWiki(id: string): Promise<WikiMetadata | undefined> {
    const wikis = await this.getWikis();
    return wikis.find(w => w.id === id);
  }

  static async listWikis(): Promise<WikiMetadata[]> {
    return await this.getWikis();
  }

  static async deleteWiki(id: string): Promise<boolean> {
    const wikis = await this.getWikis();
    const filtered = wikis.filter(w => w.id !== id);
    if (filtered.length === wikis.length) return false;
    
    await this.saveWikis(filtered);
    const repoPath = path.join(REPOS_DIR, id);
    if (fs.existsSync(repoPath)) {
      await fs.promises.rm(repoPath, { recursive: true, force: true });
    }
    return true;
  }
}
