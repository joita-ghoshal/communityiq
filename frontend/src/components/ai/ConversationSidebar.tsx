'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, TrashIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Pin, PinOff, Pencil, Check, X, Search, MessageSquareText, Mic } from 'lucide-react';
import { getConversationPreviews, removeConversationPreview, subscribePreviewUpdates } from '@/lib/ai/preview';
import type { AiConversationMeta } from '@/lib/ai/types';

const PINNED_KEY = 'fmc-ai-pinned';

interface ConversationSidebarProps {
  conversations: AiConversationMeta[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, title: string) => void;
}

function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return '';
  }
}

function safeStampAgo(t: number | string) {
  try {
    return timeAgo(new Date(t).toISOString());
  } catch {
    return '';
  }
}

function dayGroup(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
    if (dayDiff <= 0) return 'Today';
    if (dayDiff === 1) return 'Yesterday';
    if (dayDiff < 7) return 'Previous 7 days';
    return 'Older';
  } catch {
    return 'Older';
  }
}

const GROUP_ORDER = ['Pinned', 'Today', 'Yesterday', 'Previous 7 days', 'Older'];

export default function ConversationSidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: ConversationSidebarProps) {
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);
  const [, setPreviewTick] = useState(0);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      setPinned(JSON.parse(localStorage.getItem(PINNED_KEY) || '[]') || []);
    } catch {
      /* ignore */
    }
    const unsub = subscribePreviewUpdates(() => setPreviewTick((t) => t + 1));
    return unsub;
  }, []);

  const previews = getConversationPreviews();
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  useEffect(() => {
    const onStorage = () => setPreviewTick((t) => t + 1);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const togglePin = (id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      try {
        localStorage.setItem(PINNED_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const startRename = (c: AiConversationMeta) => {
    setRenamingId(c.id);
    setDraft(c.title);
  };

  const commitRename = () => {
    if (renamingId && draft.trim() && onRename) {
      onRename(renamingId, draft.trim());
    }
    setRenamingId(null);
  };

  const armDelete = (id: string) => {
    if (deleteArmedId === id) {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
      removeConversationPreview(id);
      onDelete(id);
      setDeleteArmedId(null);
      return;
    }
    setDeleteArmedId(id);
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    deleteTimer.current = setTimeout(() => setDeleteArmedId(null), 3000);
  };

  useEffect(() => () => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = conversations.filter((c) => {
      if (!q) return true;
      const preview = previewsRef.current[c.id]?.text?.toLowerCase() || '';
      return c.title.toLowerCase().includes(q) || preview.includes(q);
    });
    const groups: Record<string, AiConversationMeta[]> = {};
    const unpinned = filtered.filter((c) => !pinned.includes(c.id));
    for (const c of unpinned) {
      const g = dayGroup(c.updatedAt);
      (groups[g] = groups[g] || []).push(c);
    }
    const result: { group: string; items: AiConversationMeta[] }[] = [];
    const pinnedItems = filtered.filter((c) => pinned.includes(c.id));
    if (pinnedItems.length) result.push({ group: 'Pinned', items: pinnedItems });
    for (const g of GROUP_ORDER.slice(1)) {
      if (groups[g]?.length) result.push({ group: g, items: groups[g] });
    }
    return result;
  }, [conversations, query, pinned]);

  return (
    <div className="w-full h-full ai-panel border-r-0 rounded-none flex flex-col min-h-0">
      <div className="p-3.5 border-b border-slate-200/70 dark:border-slate-700/40 space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-sky-500" />
            <span className="text-xs font-semibold font-display uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conversations
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">{conversations.length}</span>
        </div>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/45 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ai-focus-ring"
        >
          <PlusIcon className="w-4 h-4" /> New conversation
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-4 min-h-0">
        {loading && conversations.length === 0 && (
          <div className="space-y-2 p-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl p-3 bg-white/60 dark:bg-slate-800/50 space-y-2">
                <div className="h-3 w-3/4 ai-skeleton-line" />
                <div className="h-2 w-1/2 ai-skeleton-line" />
              </div>
            ))}
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="text-center py-10 px-4">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No conversations yet</p>
            <p className="text-[10px] text-slate-400/80 mt-1">Ask something to get started</p>
          </div>
        )}
        {grouped.length === 0 && conversations.length > 0 && (
          <p className="text-xs text-slate-400 text-center py-8">No conversations match &quot;{query}&quot;</p>
        )}
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group}
            </p>
            <ul className="space-y-0.5" role="list">
              <AnimatePresence initial={false}>
                {items.map((c) => {
                  const isActive = activeId === c.id;
                  const preview = previews[c.id];
                  const isArmed = deleteArmedId === c.id;
                  const isPinned = pinned.includes(c.id);
                  const isRenaming = renamingId === c.id;
                  return (
                    <motion.li
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="group relative"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelect(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect(c.id);
                          }
                        }}
                        className={`relative rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200 ai-focus-ring ${
                          isActive
                            ? 'bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-indigo-500/15 ring-1 ring-sky-500/30 dark:from-sky-500/20 dark:via-blue-500/15 dark:to-indigo-500/20 dark:ring-sky-400/30'
                            : 'hover:bg-white/70 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-sky-400 to-indigo-500" />
                        )}
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isActive
                                ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {c.isVoice ? (
                              <Mic className="w-3.5 h-3.5" />
                            ) : (
                              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {isRenaming ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  value={draft}
                                  onChange={(e) => setDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitRename();
                                    if (e.key === 'Escape') setRenamingId(null);
                                  }}
                                  onBlur={commitRename}
                                  aria-label="Rename conversation"
                                  className="w-full px-1.5 py-0.5 rounded-md text-xs bg-white dark:bg-slate-800 border border-sky-400 dark:border-sky-500 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                />
                                <button
                                  onClick={commitRename}
                                  className="p-0.5 rounded text-emerald-500 hover:bg-emerald-500/10"
                                  aria-label="Save rename"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className={`text-xs font-medium truncate ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {c.title}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                  {preview?.text || 'No messages yet'}
                                </p>
                                <p className="text-[10px] text-slate-400/90 dark:text-slate-500 mt-0.5">
                                  {preview ? safeStampAgo(preview.at) : timeAgo(c.updatedAt)} · {c.messageCount} msgs
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(c.id);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            isPinned ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10'
                          }`}
                          title={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                          aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                          aria-pressed={isPinned}
                        >
                          {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(c);
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
                          title="Rename conversation"
                          aria-label="Rename conversation"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            armDelete(c.id);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            isArmed
                              ? 'text-white bg-red-500 hover:bg-red-600'
                              : 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'
                          }`}
                          title={isArmed ? 'Click again to confirm delete' : 'Delete conversation'}
                          aria-label={isArmed ? 'Confirm delete conversation' : 'Delete conversation'}
                        >
                          {isArmed ? <Check className="w-3 h-3" /> : <TrashIcon className="w-3 h-3" />}
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-200/70 dark:border-slate-700/40">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Saved to your account — shared across the AI Assistant page, popup and voice.
        </p>
      </div>
    </div>
  );
}
