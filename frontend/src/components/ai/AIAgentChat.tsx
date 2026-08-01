'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  TrashIcon,
  PlusIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  ArrowPathIcon,
  CheckIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAiChat } from '@/hooks/useAiChat';
import Markdown from '@/components/ai/Markdown';
import { saveConversationPreview } from '@/lib/ai/preview';
import type { AiChatMessage, AiChatStatus } from '@/lib/ai/types';

const BUBBLE_SIZE = 60;
const CHAT_WIDTH = 380;
const CHAT_HEIGHT = 520;
const EDGE_MARGIN = 12;
const DEFAULT_MARGIN = 20;
const DRAG_THRESHOLD = 6;
const POSITION_KEY = 'fixmycity:ai-bubble-position';

interface Position {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function clampBubblePosition(x: number, y: number): Position {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    x: clamp(x, EDGE_MARGIN, vw - BUBBLE_SIZE - EDGE_MARGIN),
    y: clamp(y, EDGE_MARGIN, vh - BUBBLE_SIZE - EDGE_MARGIN),
  };
}

function loadPosition(): Position {
  if (typeof window === 'undefined') return { x: EDGE_MARGIN, y: EDGE_MARGIN };
  try {
    const raw = window.localStorage.getItem(POSITION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Position>;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return clampBubblePosition(parsed.x, parsed.y);
      }
    }
  } catch {
    /* corrupted storage - fall back to default corner */
  }
  return clampBubblePosition(window.innerWidth - BUBBLE_SIZE - DEFAULT_MARGIN, window.innerHeight - BUBBLE_SIZE - DEFAULT_MARGIN);
}

const AI_SUGGESTIONS = [
  { icon: MagnifyingGlassIcon, text: 'Show me issues near my location', color: 'from-blue-500 to-indigo-600' },
  { icon: ChartBarIcon, text: 'Give me the city analytics summary', color: 'from-emerald-500 to-green-600' },
  { icon: ExclamationTriangleIcon, text: 'What are the top priority issues?', color: 'from-red-500 to-rose-600' },
  { icon: BellIcon, text: 'Any emergency alerts right now?', color: 'from-amber-500 to-orange-600' },
];

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function CopyGlyph() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function LegacyMessageBubble({
  message,
  isLastAssistant,
  onRegenerate,
  canRegenerate,
}: {
  message: AiChatMessage;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
}) {
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

function LegacyChatBody({
  messages,
  status,
  error,
  streamingText,
  onSuggestion,
  onRetry,
  onRegenerate,
  emptyTitle,
  emptySubtitle,
}: {
  messages: AiChatMessage[];
  status: AiChatStatus;
  error: string | null;
  streamingText: string;
  onSuggestion?: (text: string) => void;
  onRetry?: () => void;
  onRegenerate?: () => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText, status]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
      {isEmpty && (
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
            <LegacyMessageBubble
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

function LegacyChatComposer({
  disabled,
  isStreaming,
  onSend,
  placeholder = 'Ask me anything...',
}: {
  disabled?: boolean;
  isStreaming?: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser');
      return;
    }
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex-shrink-0">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'AI is responding...' : placeholder}
          disabled={disabled || isStreaming}
          rows={1}
          className="flex-1 resize-none px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed max-h-[120px]"
        />
        <button
          onClick={toggleMic}
          disabled={isStreaming}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40'
          }`}
          title={isRecording ? 'Stop recording' : 'Voice input'}
        >
          {isRecording ? <StopIcon className="w-[18px] h-[18px]" /> : <MicrophoneIcon className="w-[18px] h-[18px]" />}
        </button>
        <button
          onClick={submit}
          disabled={!input.trim() || disabled || isStreaming}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:shadow-lg transition-all flex-shrink-0"
          title="Send"
        >
          {isStreaming ? <ArrowPathIcon className="w-[18px] h-[18px] animate-spin" /> : <PaperAirplaneIcon className="w-[18px] h-[18px]" />}
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 text-center">AI can make mistakes — verify important civic info.</p>
    </div>
  );
}

export default function AIAgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [bubblePos, setBubblePos] = useState<Position>(loadPosition);
  const livePosRef = useRef<Position>(bubblePos);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    dragging: boolean;
  } | null>(null);

  const {
    activeId,
    messages,
    status,
    error,
    streamingText,
    send,
    regenerate,
    retry,
    newChat,
    deleteConversation,
    refreshList,
  } = useAiChat({ autoLoadLatest: true });

  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      },
      () => {},
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    if (!activeId || !messages.length) return;
    const last = messages[messages.length - 1];
    if (last.role === 'user') return;
    saveConversationPreview(activeId, last.content);
  }, [activeId, messages]);

  const previousMessageCount = useRef(0);
  useEffect(() => {
    if (!isOpen && messages.length > previousMessageCount.current) {
      setUnread(true);
    }
    previousMessageCount.current = messages.length;
  }, [messages, isOpen]);

  useEffect(() => {
    const onResize = () => {
      const clamped = clampBubblePosition(livePosRef.current.x, livePosRef.current.y);
      livePosRef.current = clamped;
      setBubblePos(clamped);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setUnread(false);
    if (minimized) setMinimized(false);
    refreshList();
  };

  const handleClose = () => setIsOpen(false);

  const applyPosition = (pos: Position) => {
    livePosRef.current = pos;
    setBubblePos(pos);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const origin = livePosRef.current;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: origin.x,
      originY: origin.y,
      dragging: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!drag.dragging) {
      drag.dragging = true;
      setIsDragging(true);
    }
    applyPosition(clampBubblePosition(drag.originX + dx, drag.originY + dy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (drag.dragging) {
      const clamped = clampBubblePosition(livePosRef.current.x, livePosRef.current.y);
      applyPosition(clamped);
      try {
        window.localStorage.setItem(POSITION_KEY, JSON.stringify(clamped));
      } catch {
        /* storage unavailable - keep in-memory position */
      }
    } else {
      handleOpen();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
  };

  const handleBubbleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  const chatPosition = useMemo(() => {
    if (typeof window === 'undefined') return { left: EDGE_MARGIN, top: EDGE_MARGIN };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const onRight = bubblePos.x + BUBBLE_SIZE / 2 > vw / 2;
    const onBottom = bubblePos.y + BUBBLE_SIZE / 2 > vh / 2;
    let left = onRight ? bubblePos.x + BUBBLE_SIZE - CHAT_WIDTH : bubblePos.x;
    let top = onBottom ? bubblePos.y - CHAT_HEIGHT - EDGE_MARGIN : bubblePos.y + BUBBLE_SIZE + EDGE_MARGIN;
    left = clamp(left, EDGE_MARGIN, vw - CHAT_WIDTH - EDGE_MARGIN);
    top = clamp(top, EDGE_MARGIN, vh - CHAT_HEIGHT - EDGE_MARGIN);
    return { left, top };
  }, [bubblePos]);

  const isStreaming = status === 'streaming';

  return (
    <>
      {!isOpen && (
        <motion.div
          role="button"
          tabIndex={0}
          aria-label="Open AI chat"
          title="Drag to move · Click to open"
          className="fixed left-0 top-0 z-[9999] cursor-grab active:cursor-grabbing select-none touch-none focus-visible:outline-2 focus-visible:outline-sky-500"
          initial={{ x: bubblePos.x, y: bubblePos.y, scale: 0, opacity: 0 }}
          animate={{ x: bubblePos.x, y: bubblePos.y, scale: 1, opacity: 1 }}
          transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onKeyDown={handleBubbleKeyDown}
        >
          <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-2xl relative">
            <div className="absolute inset-0 rounded-full animate-pulse-glow" />
            <SparklesIcon className="w-7 h-7 text-white relative z-10" />
            {unread && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            className="fixed z-[9999]"
            style={{ left: chatPosition.left, top: chatPosition.top }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.25 }}
          >
            <div className="w-[380px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm">CommunityIQ AI</p>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'error' ? 'bg-red-400' : 'bg-green-400'}`} />
                      <span className="text-xs text-white/80">{status === 'error' ? 'Needs attention' : 'AI Online'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (activeId && window.confirm('Delete this conversation?')) deleteConversation(activeId);
                      else newChat();
                    }}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    title="Clear conversation"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setMinimized(!minimized);
                    }}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    title={minimized ? 'Maximize' : 'Minimize'}
                  >
                    {minimized ? (
                      <PlusIcon className="w-3.5 h-3.5 rotate-45" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    title="Close"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {!minimized && (
                <>
                  <LegacyChatBody
                    messages={messages}
                    status={status}
                    error={error}
                    streamingText={streamingText}
                    onSuggestion={(text) => send(text, locationRef.current)}
                    onRetry={() => retry(locationRef.current)}
                    onRegenerate={() => regenerate(locationRef.current)}
                    emptyTitle="Hi! Ask me anything"
                    emptySubtitle="Same engine as the AI Assistant page — your conversations stay in sync."
                  />
                  <LegacyChatComposer
                    disabled={status === 'loading'}
                    isStreaming={isStreaming}
                    onSend={(text) => send(text, locationRef.current)}
                    placeholder="Ask me anything..."
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
