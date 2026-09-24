import * as Diff from 'diff';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

export interface BlockChange {
  type: string;
  action: 'added' | 'removed' | 'modified';
  detail: string;
  depth?: number;
  lang?: string;
}

export interface MarkdownBlockStats {
  headings: number;
  paragraphs: number;
  codeBlocks: number;
  lists: number;
  tables: number;
  blockquotes: number;
  totalBlocksChanged: number;
}

export class DiffService {
  static computeTextDiff(oldText: string, newText: string): Diff.Change[] {
    return Diff.diffLines(oldText, newText);
  }

  static parseMarkdownAst(markdown: string) {
    try {
      return unified().use(remarkParse).use(remarkGfm).parse(markdown);
    } catch (e) {
      return { type: 'root', children: [] };
    }
  }

  private static getNodeText(node: any): string {
    if (!node) return '';
    if (typeof node.value === 'string') return node.value;
    if (Array.isArray(node.children)) {
      return node.children.map((c: any) => DiffService.getNodeText(c)).join(' ');
    }
    return '';
  }

  static computeMarkdownDiff(oldText: string, newText: string): {
    blockStats: MarkdownBlockStats;
    blockChanges: BlockChange[];
  } {
    const oldAst: any = DiffService.parseMarkdownAst(oldText);
    const newAst: any = DiffService.parseMarkdownAst(newText);

    const oldNodes = Array.isArray(oldAst.children) ? oldAst.children : [];
    const newNodes = Array.isArray(newAst.children) ? newAst.children : [];

    const stats: MarkdownBlockStats = {
      headings: 0,
      paragraphs: 0,
      codeBlocks: 0,
      lists: 0,
      tables: 0,
      blockquotes: 0,
      totalBlocksChanged: 0,
    };

    const blockChanges: BlockChange[] = [];

    // Map AST nodes to simplified signatures
    const simplify = (node: any) => ({
      type: node.type,
      text: DiffService.getNodeText(node).trim(),
      depth: node.depth,
      lang: node.lang,
    });

    const oldSimple = oldNodes.map(simplify);
    const newSimple = newNodes.map(simplify);

    // Use Diff to identify block changes
    const oldKeys = oldSimple.map((s: any) => `${s.type}:${s.depth || ''}:${s.text.slice(0, 40)}`);
    const newKeys = newSimple.map((s: any) => `${s.type}:${s.depth || ''}:${s.text.slice(0, 40)}`);

    const diffResult = Diff.diffArrays(oldKeys, newKeys);

    let oldIdx = 0;
    let newIdx = 0;

    diffResult.forEach((part) => {
      const count = part.count || 0;
      if (part.added) {
        for (let i = 0; i < count; i++) {
          const node = newSimple[newIdx + i];
          if (node) {
            DiffService.incrementStat(stats, node.type);
            blockChanges.push({
              type: node.type,
              action: 'added',
              detail: node.text.slice(0, 80) || `[New ${node.type}]`,
              depth: node.depth,
              lang: node.lang,
            });
          }
        }
        newIdx += count;
      } else if (part.removed) {
        for (let i = 0; i < count; i++) {
          const node = oldSimple[oldIdx + i];
          if (node) {
            DiffService.incrementStat(stats, node.type);
            blockChanges.push({
              type: node.type,
              action: 'removed',
              detail: node.text.slice(0, 80) || `[Removed ${node.type}]`,
              depth: node.depth,
              lang: node.lang,
            });
          }
        }
        oldIdx += count;
      } else {
        oldIdx += count;
        newIdx += count;
      }
    });

    stats.totalBlocksChanged = blockChanges.length;

    return {
      blockStats: stats,
      blockChanges: blockChanges.slice(0, 30),
    };
  }

  private static incrementStat(stats: MarkdownBlockStats, type: string) {
    switch (type) {
      case 'heading':
        stats.headings++;
        break;
      case 'paragraph':
        stats.paragraphs++;
        break;
      case 'code':
        stats.codeBlocks++;
        break;
      case 'list':
      case 'listItem':
        stats.lists++;
        break;
      case 'table':
        stats.tables++;
        break;
      case 'blockquote':
        stats.blockquotes++;
        break;
    }
  }

  static getDiffStats(diffs: Diff.Change[]) {
    let additions = 0;
    let deletions = 0;
    diffs.forEach(part => {
      if (part.added) additions += part.count || 0;
      if (part.removed) deletions += part.count || 0;
    });
    return { additions, deletions };
  }
}
