'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAiChat } from '@/hooks/useAiChat';
import ChatPanel from '@/components/ai/ChatPanel';
import ChatComposer from '@/components/ai/ChatComposer';
import { saveConversationPreview } from '@/lib/ai/preview';

export default function AIAgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread] = useState(false);
  const [snappedSide, setSnappedSide] = useState<'left' | 'right'>('right');

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

  const handleOpen = () => {
    setIsOpen(true);
    setUnread(false);
    if (minimized) setMinimized(false);
    refreshList();
  };

  const handleClose = () => setIsOpen(false);

  const handleDragEnd = (_: any, info: { point: { x: number } }) => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    setSnappedSide(info.point.x < windowWidth / 2 ? 'left' : 'right');
  };

  const isStreaming = status === 'streaming';

  return (
    <>
      {!isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          onClick={handleOpen}
          className="fixed bottom-5 right-5 z-[9999] cursor-grab active:cursor-grabbing select-none"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 relative">
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
            <div className="w-[380px] max-w-[calc(100vw-2.5rem)] h-[540px] max-h-[calc(100vh-4rem)] ai-panel rounded-2xl flex flex-col overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/15 to-transparent pointer-events-none" />
              <div className="relative bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0 ring-1 ring-white/30">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm font-display">CommunityIQ AI</p>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'error' ? 'bg-red-400' : 'bg-emerald-300'}`} />
                      <span className="text-xs text-white/85">{status === 'error' ? 'Needs attention' : 'AI Online'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (activeId && window.confirm('Delete this conversation?')) deleteConversation(activeId);
                      else newChat();
                    }}
                    className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/30 transition-colors active:scale-90"
                    title="Clear conversation"
                    aria-label="Clear conversation"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setMinimized(!minimized);
                    }}
                    className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/30 transition-colors active:scale-90"
                    title={minimized ? 'Maximize' : 'Minimize'}
                    aria-label={minimized ? 'Maximize' : 'Minimize'}
                  >
                    {minimized ? (
                      <PlusIcon className="w-3.5 h-3.5 rotate-45" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                      </svg>
                    )}
                  </button>
                  <button onClick={handleClose} className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/30 transition-colors active:scale-90" title="Close" aria-label="Close chat">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {!minimized && (
                <>
                  <ChatPanel
                    compact
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
