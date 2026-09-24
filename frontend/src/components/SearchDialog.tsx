'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWikiStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Search, FileText, X } from 'lucide-react';

export function SearchDialog() {
  const { searchOpen, setSearchOpen, wikiId, setCurrentFile, setActivePanel } = useWikiStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.search(wikiId, query);
        setResults(r);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, wikiId]);

  const handleSelect = async (filePath: string) => {
    try {
      const data = await api.getFile(wikiId, filePath);
      setCurrentFile(filePath);
      useWikiStore.getState().setFileContent(data.content);
      useWikiStore.getState().setOriginalContent(data.content);
      useWikiStore.getState().setIsDirty(false);
      setActivePanel('files');
      setSearchOpen(false);
    } catch (e) {
      console.error('Failed to open file:', e);
    }
  };

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/20" onClick={() => setSearchOpen(false)}>
      <div className="bg-surface-panel border border-border rounded-lg shadow-xl w-[520px] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={16} className="text-content-tertiary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="flex-1 text-sm outline-none bg-transparent text-content-primary placeholder:text-content-tertiary"
          />
          <button onClick={() => setSearchOpen(false)} className="p-1 rounded hover:bg-surface-hover text-content-tertiary">
            <X size={14} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-content-tertiary">Searching...</div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="px-4 py-6 text-center text-sm text-content-tertiary">No results found</div>
          )}
          {results.map((result) => (
            <button
              key={result.path}
              onClick={() => handleSelect(result.path)}
              className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-content-tertiary" />
                <span className="text-sm font-medium text-content-primary">{result.path.split('/').pop()}</span>
              </div>
              <p className="text-xs text-content-tertiary mt-0.5 font-mono">{result.path}</p>
              {result.matches?.filter((m: any) => m.type === 'content').slice(0, 2).map((m: any, i: number) => (
                <p key={i} className="text-xs text-content-secondary mt-1 truncate">L{m.line}: {m.text.trim()}</p>
              ))}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
