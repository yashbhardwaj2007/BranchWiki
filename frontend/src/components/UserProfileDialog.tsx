'use client';

import React, { useState, useEffect } from 'react';
import { useWikiStore } from '@/lib/store';
import { User, Mail, Palette, Check, X, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const COLOR_OPTIONS = [
  '#0D9488', // Teal
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EF4444', // Red
];

const PRESET_USERS = [
  { name: 'Yash Bhaskar', email: 'yash@branchwiki.dev', color: '#0D9488' },
  { name: 'Rahul Sharma', email: 'rahul@branchwiki.dev', color: '#6366F1' },
  { name: 'Alex Chen', email: 'alex@branchwiki.dev', color: '#EC4899' },
];

export function UserProfileDialog() {
  const {
    userProfileDialogOpen,
    setUserProfileDialogOpen,
    currentUser,
    setCurrentUser,
  } = useWikiStore();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [color, setColor] = useState(currentUser.color);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (userProfileDialogOpen) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setColor(currentUser.color);
      setSavedMessage(false);
    }
  }, [userProfileDialogOpen, currentUser]);

  if (!userProfileDialogOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated = {
      name: name.trim(),
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@branchwiki.dev`,
      color,
    };

    setCurrentUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('branchwiki_user', JSON.stringify(updated));
    }

    setSavedMessage(true);
    setTimeout(() => {
      setUserProfileDialogOpen(false);
      setSavedMessage(false);
    }, 800);
  };

  const handleSelectPreset = (preset: typeof PRESET_USERS[0]) => {
    setName(preset.name);
    setEmail(preset.email);
    setColor(preset.color);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={() => setUserProfileDialogOpen(false)}
    >
      <div
        className="bg-surface-panel border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface-panel">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-content-primary">Author Profile & Identity</h3>
              <p className="text-[11px] text-content-tertiary">Set the name and email recorded on your Git commits</p>
            </div>
          </div>
          <button
            onClick={() => setUserProfileDialogOpen(false)}
            className="p-1 rounded-md hover:bg-surface-hover text-content-tertiary hover:text-content-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">
              Full Name
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-2.5 text-content-tertiary" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Yash Bhaskar"
                required
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface-bg border border-border rounded-lg outline-none focus:border-accent text-content-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-2.5 text-content-tertiary" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. yash@branchwiki.dev"
                required
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface-bg border border-border rounded-lg outline-none focus:border-accent text-content-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1.5 flex items-center gap-1.5">
              <Palette size={13} />
              <span>Avatar Color</span>
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={clsx(
                    'w-6 h-6 rounded-full transition-transform flex items-center justify-center',
                    color === c ? 'scale-110 ring-2 ring-accent ring-offset-2 ring-offset-surface-panel' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={11} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick presets */}
          <div className="pt-2 border-t border-border">
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block mb-2">
              Or Pick Demo Persona:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_USERS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={clsx(
                    'px-2.5 py-1.5 rounded-lg border text-left text-xs transition-colors flex items-center gap-2',
                    name === preset.name
                      ? 'border-accent bg-accent/10 text-accent font-medium'
                      : 'border-border bg-surface-bg hover:bg-surface-hover text-content-secondary'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="truncate">{preset.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-content-tertiary">
              {savedMessage ? '✓ Profile Saved!' : 'Saved in browser session'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUserProfileDialogOpen(false)}
                className="px-3 py-1.5 text-xs text-content-secondary hover:text-content-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-all shadow-glow-teal active:scale-95 flex items-center gap-1.5"
              >
                <Check size={13} />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
