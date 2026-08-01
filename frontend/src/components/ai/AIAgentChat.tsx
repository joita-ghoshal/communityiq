'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { SparklesIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAiChat } from '@/hooks/useAiChat';
import ChatPanel from '@/components/ai/ChatPanel';
import ChatComposer from '@/components/ai/ChatComposer';

const FAB_KEY = 'fmc-ai-fab-pos';
const FAB_SIZE = 60;
const FAB_MARGIN = 20;
const DRAG_THRESHOLD = 6;

export default function AIAgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread] = useState(false);
  const [snappedSide, setSnappedSide] = useState<'left' | 'right'>('right');

  const fabRef = useRef<HTMLDivElement>(null);
  const fabX = useMotionValue(0);
  const fabY = useMotionValue(0);
  const basePos = useRef({ x: 0, y: 0 });
  const dragSession = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);

  const clampPos = useCallback((p: { x: number; y: number }) => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
    const inset = 3;
    return {
      x: Math.min(Math.max(inset, Math.round(p.x)), Math.max(inset, vw - FAB_SIZE - inset)),
      y: Math.min(Math.max(inset, Math.round(p.y)), Math.max(inset, vh - FAB_SIZE - inset)),
    };
  }, []);

  useEffect(() => {
    let initial = {
      x: Math.max(0, window.innerWidth - FAB_SIZE - FAB_MARGIN),
      y: Math.max(0, window.innerHeight - FAB_SIZE - FAB_MARGIN),
    };
    try {
      const raw = localStorage.getItem(FAB_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.x === 'number' && typeof p?.y === 'number') initial = clampPos(p);
      }
    } catch {
      /* corrupted storage */
    }
    basePos.current = initial;
    fabX.set(initial.x);
    fabY.set(initial.y);

    const onResize = () => {
      const c = clampPos({ x: fabX.get(), y: fabY.get() });
      basePos.current = c;
      fabX.set(c.x);
      fabY.set(c.y);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampPos, fabX, fabY]);

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

  const previousMessageCount = useRef(0);
  useEffect(() => {
    if (!isOpen && messages.length > previousMessageCount.current) {
      setUnread(true);
    }
    previousMessageCount.current = messages.length;
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnread(false);
    if (minimized) setMinimized(false);
    refreshList();
  };

  const handleClose = () => setIsOpen(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    basePos.current = { x: fabX.get(), y: fabY.get() };
    dragSession.current = { startX: e.clientX, startY: e.clientY, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture not supported */
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = dragSession.current;
    if (!s) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    s.moved = true;
    const c = clampPos({ x: basePos.current.x + dx, y: basePos.current.y + dy });
    fabX.set(c.x);
    fabY.set(c.y);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = dragSession.current;
    dragSession.current = null;
    if (!s) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* no capture */
    }
    if (!s.moved) {
      handleOpen();
      return;
    }
    const c = clampPos({ x: basePos.current.x + (e.clientX - s.startX), y: basePos.current.y + (e.clientY - s.startY) });
    basePos.current = c;
    fabX.set(c.x);
    fabY.set(c.y);
    try {
      localStorage.setItem(FAB_KEY, JSON.stringify(c));
    } catch {
      /* storage unavailable */
    }
    setSnappedSide(e.clientX < window.innerWidth / 2 ? 'left' : 'right');
  };

  const handlePointerCancel = () => {
    dragSession.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  const isStreaming = status === 'streaming';

  return (
    <>
      {!isOpen && (
        <motion.div
          ref={fabRef}
          role="button"
          tabIndex={0}
          aria-label="Open AI assistant"
          style={{ x: fabX, y: fabY }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onKeyDown={handleKeyDown}
          className="fixed left-0 top-0 z-[9999] cursor-grab active:cursor-grabbing select-none touch-none"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          draggable={false}
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
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.25 }}
            className={`fixed bottom-5 z-[9999] ${snappedSide === 'right' ? 'right-5' : 'left-5'}`}
          >
            <div className="w-[380px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 flex items-center justify-between">
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
                    aria-label="Clear conversation"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setMinimized(!minimized);
                    }}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    title={minimized ? 'Maximize' : 'Minimize'}
                    aria-label={minimized ? 'Maximize chat' : 'Minimize'}
                  >
                    {minimized ? (
                      <PlusIcon className="w-3.5 h-3.5 rotate-45" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                      </svg>
                    )}
                  </button>
                  <button onClick={handleClose} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors" title="Close" aria-label="Close chat">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {!minimized && (
                <>
                  <ChatPanel
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
                  <ChatComposer
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
