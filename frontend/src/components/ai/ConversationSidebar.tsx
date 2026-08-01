'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  XCircleIcon,
  InboxIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Pin } from 'lucide-react';
import type { AiConversationMeta } from '@/lib/ai/types';
import { getConversationPreviews, subscribePreviewUpdates } from '@/lib/ai/preview';

const PIN_KEY = 'fmc-ai-pinned';

interface ConversationSidebarProps {
  conversations: AiConversationMeta[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onClose?: () => void;
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

function readPinned(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PIN_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function ConversationSidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onClose,
}: ConversationSidebarProps) {
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Record<string, { preview: string; updatedAt: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setPinned(readPinned());
    setPreviews(getConversationPreviews());
    return subscribePreviewUpdates(() => setPreviews(getConversationPreviews()));
  }, []);

  const togglePin = (id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      try {
        localStorage.setItem(PIN_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const startRename = (c: AiConversationMeta) => {
    setEditingId(c.id);
    setDraft(c.title);
  };

  const commitRename = () => {
    const id = editingId;
    if (!id) return;
    const trimmed = draft.trim();
    if (trimmed && trimmed !== conversations.find((c) => c.id === id)?.title) {
      onRename?.(id, trimmed);
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId((cur) => (cur === id ? null : cur)), 4000);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

  const groups = useMemo(() => {
    const now = dayKey(new Date().toISOString());
    const yesterday = now - 86400000;
    const weekAgo = now - 7 * 86400000;
    const list = [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const pinnedList = list.filter((c) => pinned.includes(c.id));
    const rest = list.filter((c) => !pinned.includes(c.id));
    const buckets: Array<[string, AiConversationMeta[]]> = [['Pinned', pinnedList]];
    if (pinnedList.length) buckets.push(['', []]);
    const groupsMap: Array<[string, AiConversationMeta[]]> = [
      ['Today', []],
      ['Yesterday', []],
      ['Previous 7 days', []],
      ['Older', []],
    ];
    for (const c of rest) {
      const k = dayKey(c.updatedAt);
      if (k >= now) groupsMap[0][1].push(c);
      else if (k >= yesterday) groupsMap[1][1].push(c);
      else if (k >= weekAgo) groupsMap[2][1].push(c);
      else groupsMap[3][1].push(c);
    }
    for (const [label, items] of groupsMap) {
      if (items.length) buckets.push([label, items]);
    }
    return buckets.filter(([label]) => label !== '' || true);
  }, [filtered, pinned]);

  const rowBtn = `p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-all duration-150 active:scale-90`;

  return (
    <div className="flex flex-col h-full w-full bg-white/55 dark:bg-[#0c1424]/70 backdrop-blur-2xl border-r border-slate-200/70 dark:border-white/[0.07]">
      <div className="p-3.5 border-b border-slate-200/70 dark:border-white/[0.07] space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm text-slate-800 dark:text-white leading-tight">Conversations</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{conversations.length} saved in your account</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
              aria-label="Close conversation list"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-indigo-400"
        >
          <PlusIcon className="w-4 h-4" /> New conversation
        </button>

        <div className="relative">
          <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="w-full rounded-xl pl-8 pr-8 py-2 text-xs bg-white/70 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400/50 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <XCircleIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto ai-scrollbar p-2">
        {loading && conversations.length === 0 && (
          <div className="space-y-2 p-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-200/60 dark:bg-white/[0.06] skeleton" />
            ))}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/60 dark:bg-white/[0.06] flex items-center justify-center mb-3">
              <InboxIcon className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No conversations yet</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Start chatting with the FixMyCity AI</p>
          </div>
        )}

        {!loading && conversations.length > 0 && filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8">No conversations match “{query}”</p>
        )}

        {groups.map(
          ([label, items]) =>
            label === 'Pinned' && items.length === 0 ? null : (
              <div key={label}>
                {label !== '' && (
                  <p className="px-2 pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    {label}
                  </p>
                )}
                <div className="space-y-0.5">
                  <AnimatePresence initial={false}>
                    {items.map((c) => {
                      const isActive = activeId === c.id;
                      const preview = previews[c.id];
                      const isPinned = pinned.includes(c.id);
                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.18 }}
                          onClick={() => {
                            if (!isActive && !editingId) onSelect(c.id);
                          }}
                          className={`group relative flex items-start gap-2 px-2.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-sky-500/15 to-indigo-500/10 dark:from-sky-400/15 dark:to-indigo-400/10 border border-sky-400/40 dark:border-sky-400/25 shadow-lg shadow-sky-500/10'
                              : 'border border-transparent hover:bg-white/60 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active-bar"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-gradient-to-b from-sky-400 to-violet-500"
                            />
                          )}
                          {isPinned && !isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500 opacity-60" />
                          )}

                          <ChatBubbleLeftRightIcon
                            className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                              isActive ? 'text-sky-600 dark:text-sky-300' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />

                          {editingId === c.id ? (
                            <div className="flex-1 min-w-0 flex items-center gap-1">
                              <input
                                autoFocus
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitRename();
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                onBlur={commitRename}
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Rename conversation"
                                className="flex-1 min-w-0 rounded-lg px-2 py-1 text-xs bg-white dark:bg-white/10 border border-sky-400/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                              />
                              <button onClick={commitRename} className={rowBtn} aria-label="Save name">
                                <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                              </button>
                              <button onClick={() => setEditingId(null)} className={rowBtn} aria-label="Cancel rename">
                                <XMarkIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className={`text-xs font-medium truncate ${isActive ? 'text-sky-800 dark:text-sky-200' : 'text-slate-700 dark:text-slate-300'}`}
                                >
                                  {c.title}
                                </p>
                                {isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />}
                              </div>
                              {preview?.preview && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-snug">
                                  {preview.preview}
                                </p>
                              )}
                              <p className="text-[9px] text-slate-400 dark:text-slate-600 mt-0.5">
                                {timeAgo(c.updatedAt)} · {c.messageCount} msgs
                              </p>
                            </div>
                          )}

                          {editingId !== c.id && (
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 bg-white/70 dark:bg-[#0c1424]/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
                              <button onClick={(e) => { e.stopPropagation(); togglePin(c.id); }} className={rowBtn} title={isPinned ? 'Unpin' : 'Pin'} aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation'}>
                                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-500' : ''}`} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); startRename(c); }} className={rowBtn} title="Rename" aria-label="Rename conversation">
                                <PencilIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(c.id);
                                }}
                                className={`${rowBtn} ${confirmId === c.id ? 'text-white bg-red-500 hover:bg-red-600' : 'hover:text-red-500'}`}
                                title={confirmId === c.id ? 'Confirm delete' : 'Delete'}
                                aria-label={confirmId === c.id ? 'Confirm delete conversation' : 'Delete conversation'}
                              >
                                {confirmId === c.id ? <CheckIcon className="w-3.5 h-3.5" /> : <TrashIcon className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ),
        )}
      </div>

      <div className="p-3 border-t border-slate-200/70 dark:border-white/[0.07]">
        <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-relaxed flex items-start gap-1.5">
          <ArrowDownTrayIcon className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>Conversations are saved to your account and shared across every AI surface (page, popup, voice).</span>
        </p>
      </div>
    </div>
  );
}
