'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, CheckIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';
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

export default function MessageBubble({ message, isLastAssistant, onRegenerate, canRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow">
          <SparklesIcon className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] md:max-w-[78%] group/bubble relative ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-md'
              : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-md'
          }`}
        >
          <div className={isUser ? 'text-slate-200/90' : ''}>
            <Markdown content={message.content} />
          </div>
        </div>
        <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${isUser ? 'justify-end text-slate-400' : 'text-slate-400'}`}>
          <span>{formatTime(message.createdAt)}</span>
          {message.provider && !isUser && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400">
              {message.provider}
            </span>
          )}
          <button
            onClick={copy}
            className="opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Copy message"
          >
            {copied ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <CopyGlyph />}
          </button>
          {isLastAssistant && canRegenerate && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Regenerate response"
            >
              <ArrowPathIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow order-3">
          <UserIcon className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </motion.div>
  );
}

function CopyGlyph() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
