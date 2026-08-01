'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BellIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import MessageBubble from './MessageBubble';
import Markdown from './Markdown';
import type { AiChatMessage, AiChatStatus } from '@/lib/ai/types';

export const AI_SUGGESTIONS = [
  { icon: MagnifyingGlassIcon, text: 'Show me issues near my location', color: 'from-sky-500 to-blue-600' },
  { icon: ChartBarIcon, text: 'Give me the city analytics summary', color: 'from-emerald-500 to-teal-600' },
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
  compact?: boolean;
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
  compact,
}: ChatPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText, status]);

  const isEmpty = messages.length === 0;
  const isInitialLoading = status === 'loading' && isEmpty;

  return (
    <div
      ref={scrollContainerRef}
      className={`flex-1 overflow-y-auto ai-scrollbar ${compact ? 'px-3 py-4 space-y-4' : 'px-4 sm:px-6 lg:px-10 py-6 space-y-6'} relative`}
      aria-live="polite"
    >
      {isEmpty && showSuggestions && (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <div className="relative mx-auto mb-6">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500/40 to-violet-500/40 blur-2xl animate-pulse-glow" />
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 ring-1 ring-white/40 dark:ring-white/20">
                <SparklesIcon className="w-9 h-9 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight ai-gradient-text mb-3"
          >
            {emptyTitle}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed"
          >
            {emptySubtitle}
          </motion.p>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 w-full ${compact ? 'max-w-md' : 'max-w-xl'}`}>
            {AI_SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 + 0.08 * i, type: 'spring', stiffness: 260, damping: 22 }}
                onClick={() => onSuggestion?.(s.text)}
                className="group ai-card rounded-2xl p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 focus-visible:outline-2 focus-visible:outline-sky-500"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2.5 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">{s.text}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {isInitialLoading && (
        <div className="space-y-5 pt-4">
          {[0, 1].map((i) => (
            <div key={i} className={`flex gap-3 ${i === 1 ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-white/10 skeleton flex-shrink-0" />
              <div className={`flex-1 max-w-[70%] space-y-2.5 ${i === 1 ? 'text-right' : ''}`}>
                <div className="h-3.5 rounded-full bg-slate-200/70 dark:bg-white/10 skeleton w-3/4" />
                <div className="h-3.5 rounded-full bg-slate-200/70 dark:bg-white/10 skeleton w-1/2" />
                <div className="h-3.5 rounded-full bg-slate-200/70 dark:bg-white/10 skeleton w-2/3" />
              </div>
            </div>
          ))}
        </div>
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
              compact={compact}
            />
          );
        })}
      </AnimatePresence>

      {status === 'streaming' && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5 justify-start">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/30 ring-2 ring-white/50 dark:ring-white/15 mt-0.5">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <div className="ai-card rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%] md:max-w-[78%] min-w-[160px] text-slate-800 dark:text-slate-100">
            {streamingText ? (
              <>
                <Markdown content={streamingText} />
                <span className="streaming-caret" aria-hidden="true" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 py-1" aria-label="AI is thinking">
                  <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                  <span className="typing-dot" style={{ animationDelay: '150ms' }} />
                  <span className="typing-dot" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 animate-pulse">
                  Thinking through the city data...
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {status === 'error' && error && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mx-auto max-w-md rounded-2xl border border-red-300/50 dark:border-red-500/30 bg-red-50/80 dark:bg-red-950/40 backdrop-blur-xl p-5 text-center shadow-lg shadow-red-500/10"
          role="alert"
        >
          <div className="w-10 h-10 mx-auto rounded-xl bg-red-500/15 flex items-center justify-center mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
          <p className="text-[11px] text-red-500/80 dark:text-red-400/70 mt-1.5">
            Your conversation is saved. You can retry safely.
          </p>
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-red-400"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      )}

      <div ref={endRef} />
    </div>
  );
}
