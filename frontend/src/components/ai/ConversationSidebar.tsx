'use client';
import { motion } from 'framer-motion';
import { PlusIcon, TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import type { AiConversationMeta } from '@/lib/ai/types';

interface ConversationSidebarProps {
  conversations: AiConversationMeta[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
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

export default function ConversationSidebar({ conversations, activeId, loading, onSelect, onNew, onDelete }: ConversationSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium hover:shadow-lg transition-all"
        >
          <PlusIcon className="w-4 h-4" /> New conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {loading && conversations.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">Loading conversations...</p>
        )}
        {!loading && conversations.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">No conversations yet</p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
              activeId === c.id
                ? 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 flex-shrink-0 opacity-60" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{c.title}</p>
              <p className="text-[10px] opacity-60">{timeAgo(c.updatedAt)} · {c.messageCount} msgs</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this conversation?')) onDelete(c.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-opacity"
              title="Delete conversation"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <motion.div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 leading-relaxed">
        Conversations are saved to your account and shared across every AI surface (page, popup, voice).
      </motion.div>
    </div>
  );
}
