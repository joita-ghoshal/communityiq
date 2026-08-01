'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, CheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { Check, Copy, ThumbsUp, ThumbsDown, Share2, Download, RefreshCw } from 'lucide-react';
import Markdown from './Markdown';
import type { AiChatMessage } from '@/lib/ai/types';

interface MessageBubbleProps {
  message: AiChatMessage;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatFullTime(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const toolBtn =
  'flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ai-focus-ring';

export default function MessageBubble({ message, isLastAssistant, onRegenerate, canRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [shared, setShared] = useState(false);
  const isUser = message.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const share = async () => {
    const payload = message.content;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'FixMyCity AI response', text: payload });
        return;
      }
      throw new Error('no share');
    } catch {
      await navigator.clipboard.writeText(payload);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    }
  };

  const exportMd = () => {
    const blob = new Blob([message.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixmycity-ai-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-end justify-end gap-2.5 group/bubble"
      >
        <div className="max-w-[85%] md:max-w-[72%] min-w-0">
          <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 px-4 py-3">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
          </div>
          <div className="flex items-center gap-1.5 mt-1 justify-end">
            <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
            <button
              onClick={copy}
              className={`${toolBtn} !h-6 !w-6`}
              title="Copy message"
              aria-label="Copy message"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-start gap-3 group/bubble"
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25 mt-1">
        <SparklesIcon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="ai-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold font-display text-slate-700 dark:text-slate-200">
                FixMyCity AI
              </span>
              {message.provider && (
                <span className="px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-medium uppercase tracking-wide">
                  {message.provider}
                </span>
              )}
              <span className="text-[10px] text-slate-400 hidden sm:inline" title={formatFullTime(message.createdAt)}>
                {formatFullTime(message.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={copy} className={toolBtn} title="Copy response" aria-label="Copy response">
                {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {isLastAssistant && canRegenerate && onRegenerate && (
                <button onClick={onRegenerate} className={toolBtn} title="Regenerate response" aria-label="Regenerate response">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
                className={`${toolBtn} ${feedback === 'like' ? '!text-sky-500 !bg-sky-500/10' : ''}`}
                title="Like response"
                aria-label="Like response"
                aria-pressed={feedback === 'like'}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
                className={`${toolBtn} ${feedback === 'dislike' ? '!text-rose-500 !bg-rose-500/10' : ''}`}
                title="Dislike response"
                aria-label="Dislike response"
                aria-pressed={feedback === 'dislike'}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={share} className={toolBtn} title="Share response" aria-label="Share response">
                {shared ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={exportMd} className={toolBtn} title="Export as Markdown" aria-label="Export response">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="px-4 py-3 ai-markdown">
            <Markdown content={message.content} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
