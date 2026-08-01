'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Menu, X, Plus } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAiChat } from '@/hooks/useAiChat';
import ChatPanel from '@/components/ai/ChatPanel';
import ChatComposer from '@/components/ai/ChatComposer';
import ConversationSidebar from '@/components/ai/ConversationSidebar';
import { saveConversationPreview, removeConversationPreview } from '@/lib/ai/preview';

export default function AIAssistantPage() {
  const {
    conversations,
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
    renameConversation,
    loadConversation,
  } = useAiChat({ autoLoadLatest: true });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const pendingPreview = useRef<string | null>(null);

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
    if (activeId && pendingPreview.current) {
      saveConversationPreview(activeId, { text: pendingPreview.current.slice(0, 110), at: Date.now() });
      pendingPreview.current = null;
    }
  }, [activeId]);

  const isStreaming = status === 'streaming';

  const handleSend = (text: string) => {
    pendingPreview.current = text;
    send(text, locationRef.current);
  };

  const handleDelete = (id: string) => {
    removeConversationPreview(id);
    deleteConversation(id);
  };

  const handleNew = () => {
    newChat();
    setMobileNavOpen(false);
  };

  const activeTitle = activeId
    ? conversations.find((c) => c.id === activeId)?.title || 'Conversation'
    : 'New conversation';

  return (
    <AppShell>
      <div className="ai-workspace h-[calc(100dvh-4rem)] min-h-[540px] flex flex-col">
        {/* ambient background layers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="ai-blob w-72 h-72 md:w-[26rem] md:h-[26rem] bg-sky-400/30 dark:bg-sky-600/20 -top-24 -left-24 animate-float" />
          <div className="ai-blob w-80 h-80 md:w-[30rem] md:h-[30rem] bg-indigo-400/25 dark:bg-indigo-600/20 top-1/3 -right-28 animate-float" style={{ animationDelay: '2s' }} />
          <div className="ai-blob w-64 h-64 md:w-80 md:h-80 bg-cyan-300/30 dark:bg-cyan-600/15 -bottom-28 left-1/4 animate-float" style={{ animationDelay: '4s' }} />
          <div className="ai-blob w-56 h-56 bg-violet-400/20 dark:bg-violet-600/15 top-10 left-1/2 animate-float" style={{ animationDelay: '3s' }} />
          <div className="ai-grid-overlay" />
        </div>

        {/* page header */}
        <header className="relative z-10 flex items-center gap-3 px-3 md:px-5 h-14 md:h-16 border-b border-white/40 dark:border-slate-700/30 bg-white/40 dark:bg-slate-900/35 backdrop-blur-2xl flex-shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-2 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/60 transition-colors ai-focus-ring"
            aria-label="Open conversation history"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold font-heading text-slate-900 dark:text-white truncate">
                AI Assistant
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                Unified Civic Intelligence Engine
              </p>
            </div>
          </div>
          <div
            className={`ml-auto flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md ${
              status === 'error'
                ? 'bg-red-500/10 border-red-200/60 dark:border-red-500/30 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
            }`}
            role="status"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
            {status === 'error' ? 'Needs attention' : 'AI Online'}
          </div>
        </header>

        {/* workspace */}
        <div className="relative z-10 flex flex-1 min-h-0">
          <aside className="hidden md:block w-[272px] shrink-0 h-full border-r border-white/40 dark:border-slate-700/30">
            <ConversationSidebar
              conversations={conversations}
              activeId={activeId}
              loading={status === 'loading' && conversations.length === 0}
              onSelect={loadConversation}
              onNew={handleNew}
              onDelete={handleDelete}
              onRename={renameConversation}
            />
          </aside>

          <section className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 px-4 md:px-6 h-11 md:h-12 border-b border-white/40 dark:border-slate-700/30 bg-white/30 dark:bg-slate-900/25 backdrop-blur-xl flex-shrink-0">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{activeTitle}</span>
              {activeId && (
                <button
                  onClick={() => {
                    if (window.confirm('Delete this conversation?')) handleDelete(activeId);
                  }}
                  className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15 transition-colors ai-focus-ring"
                  title="Delete conversation"
                  aria-label="Delete conversation"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleNew}
                className="ml-2 hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[11px] font-semibold shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-[0.97] transition-all ai-focus-ring"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>

            <ChatPanel
              messages={messages}
              status={status}
              error={error}
              streamingText={streamingText}
              onSuggestion={handleSend}
              onRetry={() => retry(locationRef.current)}
              onRegenerate={() => regenerate(locationRef.current)}
              emptyTitle="How can I help?"
              emptySubtitle="Ask about issues near you, department status, analytics, emergency guidance or civic services."
            />

            <ChatComposer
              disabled={status === 'loading'}
              isStreaming={isStreaming}
              onSend={handleSend}
              placeholder="Ask FixMyCity AI anything..."
            />
          </section>
        </div>

        {/* mobile conversation drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden"
                aria-hidden="true"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm md:hidden flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-label="Conversation history"
              >
                <div className="flex items-center justify-between px-3 py-2.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border-b border-slate-200/70 dark:border-slate-700/40">
                  <span className="text-xs font-semibold font-display text-slate-600 dark:text-slate-300">History</span>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ai-focus-ring"
                    aria-label="Close conversation history"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <ConversationSidebar
                    conversations={conversations}
                    activeId={activeId}
                    loading={status === 'loading' && conversations.length === 0}
                    onSelect={(id) => {
                      loadConversation(id);
                      setMobileNavOpen(false);
                    }}
                    onNew={handleNew}
                    onDelete={handleDelete}
                    onRename={renameConversation}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
