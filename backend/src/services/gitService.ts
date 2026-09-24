import git, { TREE } from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

export interface FileEntry {
  path: string;
  type: 'blob' | 'tree';
}

export class GitService {
  static async initRepo(repoPath: string) {
    await fs.promises.mkdir(repoPath, { recursive: true });
    await git.init({ fs, dir: repoPath, defaultBranch: 'main' });
  }

  static async getFileContent(repoPath: string, filePath: string, branch?: string) {
    try {
      if (branch) {
        const oid = await git.resolveRef({ fs, dir: repoPath, ref: branch });
        const { blob } = await git.readBlob({
          fs,
          dir: repoPath,
          oid,
          filepath: filePath,
        });
        return new TextDecoder().decode(blob);
      } else {
        const fullPath = path.join(repoPath, filePath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File ${filePath} not found`);
        }
        return await fs.promises.readFile(fullPath, 'utf-8');
      }
    } catch (error: any) {
      throw new Error(`File ${filePath} not found: ${error.message}`);
    }
  }

  static async writeFile(repoPath: string, filePath: string, content: string) {
    const fullPath = path.join(repoPath, filePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, content, 'utf-8');
    try {
      await git.add({ fs, dir: repoPath, filepath: filePath });
    } catch (e) {
      // Non-fatal if index add is delayed
    }
  }

  static async deleteFile(repoPath: string, filePath: string) {
    const fullPath = path.join(repoPath, filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
    try {
      await git.remove({ fs, dir: repoPath, filepath: filePath });
    } catch (e) {
      // Ignore if not in index
    }
  }

  static async stageRename(repoPath: string, oldPath: string, newPath: string) {
    try {
      await git.remove({ fs, dir: repoPath, filepath: oldPath });
      await git.add({ fs, dir: repoPath, filepath: newPath });
    } catch (e) {
      // Stage on next commit
    }
  }

  // Recursive file listing that supports both branches and working tree
  static async listFiles(repoPath: string, branch?: string): Promise<FileEntry[]> {
    if (branch) {
      try {
        const oid = await git.resolveRef({ fs, dir: repoPath, ref: branch });
        const fileList: FileEntry[] = [];

        await git.walk({
          fs,
          dir: repoPath,
          trees: [TREE({ ref: oid })],
          map: async function(filepath, [entry]) {
            if (filepath === '.') return;
            if (!entry) return;
            const type = await entry.type();
            if (type === 'blob') {
              fileList.push({ path: filepath, type: 'blob' });
            }
          },
        });

        return fileList;
      } catch (e) {
        return [];
      }
    } else {
      // Scan working tree recursively
      const fileList: FileEntry[] = [];

      async function scanDir(currentDir: string, relativePath: string = '') {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === '.git' || entry.name === 'node_modules') continue;
          const entryRel = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          const entryFull = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            await scanDir(entryFull, entryRel);
          } else if (entry.isFile()) {
            fileList.push({ path: entryRel, type: 'blob' });
          }
        }
      }

      if (fs.existsSync(repoPath)) {
        await scanDir(repoPath);
      }

      return fileList;
    }
  }

  static async commit(repoPath: string, message: string, author: { name: string; email: string }, parent?: string[]) {
    // Stage all changes
    const files = await this.listFiles(repoPath);
    for (const f of files) {
      try {
        await git.add({ fs, dir: repoPath, filepath: f.path });
      } catch (e) {}
    }

    return git.commit({
      fs,
      dir: repoPath,
      message,
      author,
      parent,
    });
  }

  static async getLog(repoPath: string, branch?: string, count: number = 50) {
    const ref = branch || 'HEAD';
    try {
      const commits = await git.log({ fs, dir: repoPath, ref, depth: count });
      return commits;
    } catch (e) {
      return [];
    }
  }

  static async getBranches(repoPath: string) {
    try {
      return await git.listBranches({ fs, dir: repoPath });
    } catch (e) {
      return [];
    }
  }

  static async getCurrentBranch(repoPath: string) {
    try {
      return await git.currentBranch({ fs, dir: repoPath, fullname: false }) || 'main';
    } catch (e) {
      return 'main';
    }
  }

  static async createBranch(repoPath: string, branchName: string, baseBranch?: string) {
    if (baseBranch) {
      await git.checkout({ fs, dir: repoPath, ref: baseBranch });
    }
    await git.branch({ fs, dir: repoPath, ref: branchName });
  }

  static async switchBranch(repoPath: string, branchName: string) {
    await git.checkout({ fs, dir: repoPath, ref: branchName });
  }

  static async deleteBranch(repoPath: string, branchName: string) {
    await git.deleteBranch({ fs, dir: repoPath, ref: branchName });
  }

  static async diff(repoPath: string, fromRef: string, toRef: string) {
    try {
      const fromOid = await git.resolveRef({ fs, dir: repoPath, ref: fromRef });
      const toOid = await git.resolveRef({ fs, dir: repoPath, ref: toRef });

      const changes: any[] = [];

      await git.walk({
        fs,
        dir: repoPath,
        trees: [TREE({ ref: fromOid }), TREE({ ref: toOid })],
        map: async function(filepath, [fromEntry, toEntry]) {
          if (filepath === '.') return;

          const fromType = fromEntry ? await fromEntry.type() : null;
          const toType = toEntry ? await toEntry.type() : null;

          if (fromType === 'tree' || toType === 'tree') return;

          const fromEntryOid = fromEntry ? await fromEntry.oid() : null;
          const toEntryOid = toEntry ? await toEntry.oid() : null;

          if (fromEntryOid !== toEntryOid) {
            let fromContent = '';
            if (fromEntry) {
              const c = await fromEntry.content();
              if (c) fromContent = new TextDecoder().decode(c);
            }
            let toContent = '';
            if (toEntry) {
              const c = await toEntry.content();
              if (c) toContent = new TextDecoder().decode(c);
            }

            changes.push({
              filepath,
              status: !fromEntry ? 'added' : !toEntry ? 'deleted' : 'modified',
              fromContent,
              toContent,
            });
          }
        },
      });

      return changes;
    } catch (e) {
      return [];
    }
  }

  static async merge(
    repoPath: string,
    fromBranch: string,
    intoBranch: string,
    simulateConflict: boolean = false
  ) {
    const intoOid = await git.resolveRef({ fs, dir: repoPath, ref: intoBranch });
    const fromOid = await git.resolveRef({ fs, dir: repoPath, ref: fromBranch });

    await git.checkout({ fs, dir: repoPath, ref: intoBranch });
    const changes = await this.diff(repoPath, intoBranch, fromBranch);

    if (changes.length === 0) {
      return { success: true, message: 'Already up to date', commitOid: intoOid };
    }

    // 1. Check for real merge conflicts using common ancestor (merge base)
    let mergeBaseOids: string[] = [];
    try {
      mergeBaseOids = await git.findMergeBase({ fs, dir: repoPath, oids: [intoOid, fromOid] });
    } catch (e) {}

    const baseOid = mergeBaseOids[0];
    let detectedConflict: any = null;

    if (baseOid) {
      // Diff base -> intoBranch and base -> fromBranch
      const intoChanges = await this.diff(repoPath, baseOid, intoBranch);
      const fromChanges = await this.diff(repoPath, baseOid, fromBranch);

      const intoModified = new Map(intoChanges.map(c => [c.filepath, c]));

      for (const fromChange of fromChanges) {
        const intoChange = intoModified.get(fromChange.filepath);
        if (intoChange && intoChange.toContent !== fromChange.toContent) {
          // Both branches modified this file differently since merge-base
          detectedConflict = {
            filepath: fromChange.filepath,
            currentContent: intoChange.toContent,
            incomingContent: fromChange.toContent,
          };
          break;
        }
      }
    }

    // 2. Either real conflict detected OR simulated conflict demo requested
    if (detectedConflict || (simulateConflict && changes.length > 0)) {
      const conflictFile = detectedConflict || changes.find(c => c.filepath.endsWith('.md')) || changes[0];
      const currentContent = conflictFile.currentContent ?? conflictFile.fromContent;
      const incomingContent = conflictFile.incomingContent ?? conflictFile.toContent;

      const conflictMarkers = `<<<<<<< HEAD (${intoBranch})\n${currentContent}\n=======\n${incomingContent}\n>>>>>>> ${fromBranch}`;

      return {
        success: false,
        conflict: true,
        conflictFile: conflictFile.filepath,
        currentBranch: intoBranch,
        incomingBranch: fromBranch,
        currentContent,
        incomingContent,
        conflictMarkers,
      };
    }

    // 3. Clean merge: apply incoming branch changes
    for (const change of changes) {
      if (change.status === 'deleted') {
        await this.deleteFile(repoPath, change.filepath);
      } else {
        await this.writeFile(repoPath, change.filepath, change.toContent);
      }
    }

    // Create real Git merge commit with two parents [intoOid, fromOid]
    const commitOid = await this.commit(
      repoPath,
      `Merge branch '${fromBranch}' into ${intoBranch}`,
      { name: 'BranchWiki Merge', email: 'merge@branchwiki.dev' },
      [intoOid, fromOid]
    );

    return { success: true, commitOid };
  }

  static async resolveConflict(
    repoPath: string,
    fromBranch: string,
    intoBranch: string,
    conflictFile: string,
    resolvedContent: string
  ) {
    const intoOid = await git.resolveRef({ fs, dir: repoPath, ref: intoBranch });
    const fromOid = await git.resolveRef({ fs, dir: repoPath, ref: fromBranch });

    await git.checkout({ fs, dir: repoPath, ref: intoBranch });
    await this.writeFile(repoPath, conflictFile, resolvedContent);

    const changes = await this.diff(repoPath, intoBranch, fromBranch);
    for (const change of changes) {
      if (change.filepath === conflictFile) continue;
      if (change.status === 'deleted') {
        await this.deleteFile(repoPath, change.filepath);
      } else {
        await this.writeFile(repoPath, change.filepath, change.toContent);
      }
    }

    // Create real merge commit with resolved conflicts
    const commitOid = await this.commit(
      repoPath,
      `Merge branch '${fromBranch}' into ${intoBranch} (resolved conflict in ${conflictFile})`,
      { name: 'BranchWiki Merge', email: 'merge@branchwiki.dev' },
      [intoOid, fromOid]
    );

    return { success: true, commitOid };
  }

  static async getCommitDiff(repoPath: string, commitOid: string) {
    const commits = await git.log({ fs, dir: repoPath, ref: commitOid, depth: 2 });
    if (commits.length < 2) {
      // Root commit - diff against empty tree
      const changes: any[] = [];
      const currentCommit = commits[0];
      const fileList = await this.listFiles(repoPath, currentCommit.oid);
      for (const file of fileList) {
        const content = await this.getFileContent(repoPath, file.path, currentCommit.oid);
        changes.push({
          filepath: file.path,
          status: 'added',
          fromContent: '',
          toContent: content,
        });
      }
      return changes;
    }
    return this.diff(repoPath, commits[1].oid, commits[0].oid);
  }

  static async getStatus(repoPath: string) {
    return git.statusMatrix({ fs, dir: repoPath });
  }
}
