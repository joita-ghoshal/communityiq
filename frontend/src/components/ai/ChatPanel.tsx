'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon, MagnifyingGlassIcon, ExclamationTriangleIcon,
  ChartBarIcon, BellIcon, ArrowPathIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import MessageBubble from './MessageBubble';
import Markdown from './Markdown';
import type { AiChatMessage, AiChatStatus } from '@/lib/ai/types';

export const AI_SUGGESTIONS = [
  { icon: MagnifyingGlassIcon, text: 'Show me issues near my location', color: 'from-sky-500 to-blue-600', glow: 'shadow-blue-500/25' },
  { icon: ChartBarIcon, text: 'Give me the city analytics summary', color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/25' },
  { icon: ExclamationTriangleIcon, text: 'What are the top priority issues?', color: 'from-rose-500 to-red-600', glow: 'shadow-rose-500/25' },
  { icon: BellIcon, text: 'Any emergency alerts right now?', color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/25' },
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
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin px-3 md:px-6 py-4 md:py-6 space-y-6">
      {isEmpty && showSuggestions && status !== 'streaming' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-full flex flex-col items-center justify-center text-center py-6 md:py-10"
        >
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-3xl bg-sky-500/30 dark:bg-sky-500/20 blur-2xl animate-pulse-glow" />
            <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-slate-800 dark:text-white tracking-tight">
            <span className="ai-gradient-text">{emptyTitle}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2.5 max-w-md mx-auto leading-relaxed">
            {emptySubtitle}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 w-full max-w-lg">
            {AI_SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.35, ease: 'easeOut' }}
                onClick={() => onSuggestion?.(s.text)}
                className="ai-panel group p-3.5 rounded-2xl text-left hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 ai-focus-ring"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2.5 shadow-lg ${s.glow} group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 leading-snug">{s.text}</p>
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

      {status === 'loading' && messages.length === 0 && (
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/70 to-indigo-600/70 flex-shrink-0" />
              <div className="ai-card flex-1 p-4 space-y-2.5 max-w-[85%]">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-24 ai-skeleton-line" />
                  <div className="h-3 w-12 ai-skeleton-line" />
                </div>
                <div className="h-3 w-full ai-skeleton-line" />
                <div className="h-3 w-11/12 ai-skeleton-line" />
                <div className="h-3 w-3/4 ai-skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'streaming' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25 mt-1">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <div className="ai-card flex-1 min-w-0 max-w-[85%]">
            <div className="flex items-center justify-between px-4 pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-display text-slate-700 dark:text-slate-200">FixMyCity AI</span>
                <span className="text-[10px] text-slate-400">responding</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-sky-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" /> live
              </span>
            </div>
            <div className="px-4 py-3 ai-markdown">
              {streamingText ? (
                <Markdown content={streamingText} className="streaming-caret" />
              ) : (
                <div className="flex items-center gap-1.5 py-2">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {status === 'error' && error && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mx-auto max-w-md rounded-2xl border border-red-200/80 dark:border-red-800/50 bg-white/80 dark:bg-red-950/30 backdrop-blur-xl p-5 text-center shadow-lg shadow-red-500/5"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/25">
            <ExclamationTriangleIcon className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          <p className="text-[11px] text-red-500/80 dark:text-red-400/80 mt-1">Your conversation is saved. You can retry safely.</p>
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-rose-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all ai-focus-ring"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      )}

      <div ref={endRef} />
    </div>
  );
}
