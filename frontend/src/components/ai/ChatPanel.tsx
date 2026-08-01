'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon, MagnifyingGlassIcon, ExclamationTriangleIcon,
  ChartBarIcon, BellIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import MessageBubble from './MessageBubble';
import Markdown from './Markdown';
import type { AiChatMessage, AiChatStatus } from '@/lib/ai/types';

export const AI_SUGGESTIONS = [
  { icon: MagnifyingGlassIcon, text: 'Show me issues near my location', color: 'from-blue-500 to-indigo-600' },
  { icon: ChartBarIcon, text: 'Give me the city analytics summary', color: 'from-emerald-500 to-green-600' },
  { icon: ExclamationTriangleIcon, text: 'What are the top priority issues?', color: 'from-red-500 to-rose-600' },
  { icon: BellIcon, text: 'Any emergency alerts right now?', color: 'from-amber-500 to-orange-600' },
];

interface ChatPanelProps {
  messages: AiChatMessage[];
  status: AiChatStatus;
  error: string | null;
  streamingText: string;
  onSuggestion?: (text: string) => void;
  onRetry?: () => void;
  onRegenerate?: () => void;
  showSuggestions?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export default function ChatPanel({
  messages,
  status,
  error,
  streamingText,
  onSuggestion,
  onRetry,
  onRegenerate,
  showSuggestions = true,
  emptyTitle = 'How can I help?',
  emptySubtitle = 'Ask about issues near you, department status, analytics, emergency guidance or civic services.',
}: ChatPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText, status]);

  const isEmpty = messages.length === 0;

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
      {isEmpty && showSuggestions && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg mb-3">
            <SparklesIcon className="w-7 h-7 text-white" />
          </div>
          <p className="font-heading font-bold text-slate-800 dark:text-white">{emptyTitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">{emptySubtitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 max-w-md mx-auto">
            {AI_SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                onClick={() => onSuggestion?.(s.text)}
                className="glass-card p-3 text-left hover:shadow-lg transition-all group"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.text}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLastAssistant={isLast && msg.role === 'assistant'}
              canRegenerate={!!onRegenerate}
              onRegenerate={onRegenerate}
            />
          );
        })}
      </AnimatePresence>

      {status === 'streaming' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2 justify-start">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow">
            <SparklesIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="max-w-[85%] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 text-slate-800 dark:text-slate-100">
            {streamingText ? (
              <Markdown content={streamingText} />
            ) : (
              <div className="flex gap-1.5 py-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <span className="block text-[10px] text-slate-400 mt-1">Typing...</span>
          </div>
        </motion.div>
      )}

      {status === 'error' && error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md rounded-2xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 p-4 text-center"
        >
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          <p className="text-[11px] text-red-500/80 dark:text-red-400/80 mt-1">Your conversation is saved. You can retry safely.</p>
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      )}

      <div ref={endRef} />
    </div>
  );
}
