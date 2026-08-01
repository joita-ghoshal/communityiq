'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { useAiChat } from '@/hooks/useAiChat';
import ChatPanel from '@/components/ai/ChatPanel';
import ChatComposer from '@/components/ai/ChatComposer';
import ConversationSidebar from '@/components/ai/ConversationSidebar';

export default function AIAssistantPage() {
  const theme = pageThemes.ai_assistant;
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
    loadConversation,
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

  const isStreaming = status === 'streaming';

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="p-4 md:p-5 pb-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
              <div className={`${theme.gradient} rounded-xl p-2.5 text-white`}>
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-white">AI Assistant</h1>
                <p className="text-xs text-slate-500">Unified Civic Intelligence Engine</p>
              </div>
              <div
                className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  status === 'error'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                {status === 'error' ? 'Needs attention' : 'AI Online'}
              </div>
            </motion.div>
          </div>

          <div className="flex-1 flex min-h-0 mx-4 md:mx-5 mb-4">
            <div className="hidden md:block h-full">
              <ConversationSidebar
                conversations={conversations}
                activeId={activeId}
                loading={status === 'loading' && conversations.length === 0}
                onSelect={(id) => loadConversation(id)}
                onNew={newChat}
                onDelete={deleteConversation}
              />
            </div>
            <div className="flex-1 flex flex-col min-w-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-white/50 dark:bg-slate-900/50">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                  {activeId
                    ? conversations.find((c) => c.id === activeId)?.title || 'Conversation'
                    : 'New conversation'}
                </span>
                {activeId && (
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this conversation?')) deleteConversation(activeId);
                    }}
                    className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete conversation"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
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
                placeholder="Ask about issues, departments, analytics, emergencies..."
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
