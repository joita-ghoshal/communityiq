'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  CheckIcon,
  ArrowPathIcon,
  UserIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import Markdown from './Markdown';
import type { AiChatMessage } from '@/lib/ai/types';

interface MessageBubbleProps {
  message: AiChatMessage;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
  compact?: boolean;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessageBubble({ message, isLastAssistant, onRegenerate, canRegenerate, compact }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const isUser = message.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'FixMyCity AI response', text: message.content });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copy();
  };

  const exportMessage = () => {
    const blob = new Blob([message.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixmycity-ai-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const iconBtn = `p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all duration-150 active:scale-90`;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="flex items-end gap-2 justify-end"
      >
        <div className={`max-w-[85%] md:max-w-[70%] ${compact ? 'order-2' : 'order-2'}`}>
          <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg shadow-blue-600/20">
            <div className="absolute inset-0 rounded-2xl rounded-br-md bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right">{formatTime(message.createdAt)}</p>
        </div>
        <div className={`w-7 h-7 ${compact ? 'w-6 h-6' : ''} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/30 ring-2 ring-white/40 dark:ring-white/10`}>
          <UserIcon className="w-3.5 h-3.5 text-white" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex items-start gap-2.5 justify-start group/bubble"
    >
      <div className={`w-8 h-8 ${compact ? 'w-7 h-7' : ''} rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/30 ring-2 ring-white/50 dark:ring-white/15 relative mt-0.5`}>
        <SparklesIcon className="w-4 h-4 text-white" />
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
      </div>

      <div className="max-w-[85%] md:max-w-[78%] min-w-0">
        <div className="ai-card rounded-2xl rounded-tl-md overflow-hidden">
          <div className={`flex items-center gap-2 px-4 ${compact ? 'pt-2.5 pb-0' : 'pt-3 pb-0'} border-b border-slate-200/60 dark:border-white/5`}>
            <span className="text-xs font-semibold font-heading text-slate-700 dark:text-slate-200">FixMyCity AI</span>
            {(message.model || message.provider) && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500/10 to-violet-500/10 border border-sky-500/20 dark:border-indigo-400/25 text-[9px] font-medium uppercase tracking-wide text-sky-700 dark:text-sky-300">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                {message.model || message.provider}
              </span>
            )}
            <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500" title={formatDateTime(message.createdAt)}>
              {formatTime(message.createdAt)}
            </span>
          </div>

          <div className={`${compact ? 'px-3.5 py-2.5' : 'px-4 py-3'} text-slate-800 dark:text-slate-100`}>
            <Markdown content={message.content} />
          </div>
        </div>

        <div className="flex items-center gap-0.5 mt-1.5 pl-1 opacity-100 md:opacity-0 md:group-hover/bubble:opacity-100 md:focus-within:opacity-100 transition-opacity duration-200">
          <button onClick={copy} className={iconBtn} title="Copy message" aria-label="Copy message">
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
          </button>
          {isLastAssistant && canRegenerate && onRegenerate && (
            <button onClick={onRegenerate} className={iconBtn} title="Regenerate response" aria-label="Regenerate response">
              <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setVote(vote === 'up' ? null : 'up')}
            className={`${iconBtn} ${vote === 'up' ? 'text-emerald-500 hover:text-emerald-500' : ''}`}
            title="Like response"
            aria-label="Like response"
            aria-pressed={vote === 'up'}
          >
            <ThumbsUp className="w-3.5 h-3.5" fill={vote === 'up' ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setVote(vote === 'down' ? null : 'down')}
            className={`${iconBtn} ${vote === 'down' ? 'text-rose-500 hover:text-rose-500' : ''}`}
            title="Dislike response"
            aria-label="Dislike response"
            aria-pressed={vote === 'down'}
          >
            <ThumbsDown className="w-3.5 h-3.5" fill={vote === 'down' ? 'currentColor' : 'none'} />
          </button>
          <button onClick={share} className={iconBtn} title="Share response" aria-label="Share response">
            <ShareIcon className="w-3.5 h-3.5" />
          </button>
          <button onClick={exportMessage} className={iconBtn} title="Export as Markdown" aria-label="Export as Markdown">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
