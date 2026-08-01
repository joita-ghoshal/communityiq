'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, TrashIcon, PlusIcon, Bars3Icon } from '@heroicons/react/24/outline';
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const isStreaming = status === 'streaming';
  const activeTitle = activeId
    ? conversations.find((c) => c.id === activeId)?.title || 'Conversation'
    : 'New conversation';

  const handleDelete = (id: string) => {
    deleteConversation(id);
    removeConversationPreview(id);
  };

  const sidebar = (
    <ConversationSidebar
      conversations={conversations}
      activeId={activeId}
      loading={status === 'loading' && conversations.length === 0}
      onSelect={(id) => loadConversation(id)}
      onNew={newChat}
      onDelete={handleDelete}
      onRename={renameConversation}
      onClose={() => setSidebarOpen(false)}
    />
  );

  return (
    <AppShell>
      <div className="ai-workspace h-[calc(100dvh-8.5rem)] lg:h-[calc(100vh-4rem)] overflow-hidden relative">
        <div className="ai-grid" aria-hidden="true" />
        <div className="ai-blob w-[420px] h-[420px] bg-sky-500/25 dark:bg-sky-500/30 -top-24 -right-16" aria-hidden="true" />
        <div className="ai-blob w-[380px] h-[380px] bg-indigo-500/25 dark:bg-indigo-600/30 -bottom-20 -left-16" style={{ animationDelay: '-6s' }} aria-hidden="true" />
        <div className="ai-blob w-[300px] h-[300px] bg-violet-500/20 dark:bg-violet-600/25 top-1/3 left-1/2 -translate-x-1/2" style={{ animationDelay: '-12s' }} aria-hidden="true" />

        <div className="relative h-full flex">
          <aside className="hidden lg:flex w-[300px] flex-shrink-0 z-10">
            {sidebar}
          </aside>

          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  key="ai-drawer-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
                />
                <motion.aside
                  key="ai-drawer"
                  initial={{ x: -320 }}
                  animate={{ x: 0 }}
                  exit={{ x: -320 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                  className="fixed left-0 top-0 bottom-0 w-[300px] max-w-[85vw] z-50 lg:hidden shadow-2xl"
                >
                  {sidebar}
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <main className="flex-1 flex flex-col min-w-0 relative">
            <header className="ai-panel border-x-0 border-t-0 rounded-none px-3 sm:px-5 py-2.5 flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                aria-label="Open conversation list"
              >
                <Bars3Icon className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-display font-bold text-slate-800 dark:text-white truncate leading-tight">
                  {activeTitle}
                </h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block leading-tight">
                  Unified Civic Intelligence Engine
                </p>
              </div>

              <div
                className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                  status === 'error'
                    ? 'bg-red-500/10 border-red-400/30 text-red-600 dark:text-red-400'
                    : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-700 dark:text-emerald-400'
                }`}
                role="status"
              >
                <span className={`relative flex w-1.5 h-1.5`}>
                  {status !== 'error' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full w-1.5 h-1.5 ${
                      status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                  />
                </span>
                {status === 'error' ? 'Needs attention' : isStreaming ? 'AI responding' : 'AI Online'}
              </div>

              <button
                onClick={newChat}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                title="New conversation"
                aria-label="New conversation"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              {activeId && (
                <button
                  onClick={() => {
                    if (window.confirm('Delete this conversation?')) handleDelete(activeId);
                  }}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete conversation"
                  aria-label="Delete conversation"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </header>

            <ChatPanel
              messages={messages}
              status={status}
              error={error}
              streamingText={streamingText}
              onSuggestion={(text) => send(text, locationRef.current)}
              onRetry={() => retry(locationRef.current)}
              onRegenerate={() => regenerate(locationRef.current)}
              emptyTitle="How can I help?"
              emptySubtitle="Ask about issues near you, department status, analytics, emergency guidance or civic services."
            />

            <ChatComposer
              disabled={status === 'loading'}
              isStreaming={isStreaming}
              onSend={(text) => send(text, locationRef.current)}
              placeholder="Ask FixMyCity AI anything..."
            />
          </main>
        </div>
      </div>
    </AppShell>
  );
}
