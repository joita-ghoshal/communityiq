'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { streamAiRequest, userErrorMessage } from '@/lib/ai/stream';
import type { AiChatMessage, AiChatStatus, AiConversationDetail, AiConversationMeta } from '@/lib/ai/types';

export interface UseAiChatOptions {
  autoLoadLatest?: boolean;
}

const unwrap = <T,>(value: T): T => value;

export function useAiChat(options: UseAiChatOptions = {}) {
  const { autoLoadLatest = false } = options;

  const [conversations, setConversations] = useState<AiConversationMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [status, setStatus] = useState<AiChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  const activeIdRef = useRef<string | null>(null);
  const streamingTextRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const refreshList = useCallback(async () => {
    try {
      const { data } = await api.get('/ai/conversations');
      const list = (data?.data || data || []) as AiConversationMeta[];
      setConversations(list);
    } catch {
      /* list refresh failure is non-fatal */
    }
  }, []);

  const loadConversation = useCallback(
    async (id: string) => {
      if (loadedRef.current && id === activeIdRef.current) return;
      setStatus('loading');
      setError(null);
      loadedRef.current = true;
      try {
        const { data } = await api.get(`/ai/conversations/${id}`);
        const detail = (data?.data || data) as AiConversationDetail;
        setMessages(detail.messages || []);
        setActiveId(detail.id);
        setStatus('idle');
      } catch (e: any) {
        setStatus('error');
        setError(e?.response?.data?.message || 'Failed to load conversation');
      }
    },
    [],
  );

  const ensureLoaded = useCallback(async () => {
    if (!activeIdRef.current && !messagesRef.current.length) {
      await loadConversation(activeIdRef.current ?? '');
    }
  }, [loadConversation]);

  const messagesRef = useRef<AiChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const newChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setActiveId(null);
    setMessages([]);
    setStreamingText('');
    setError(null);
    setStatus('idle');
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/ai/conversations/${id}`);
      } catch {
        /* ignore */
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeIdRef.current === id) {
        setActiveId(null);
        setMessages([]);
        setStatus('idle');
      }
    },
    [],
  );

  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      const { data } = await api.patch(`/ai/conversations/${id}`, { title });
      const d = data?.data || data;
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: d.title || title } : c)));
    } catch {
      /* ignore */
    }
  }, []);

  const runStream = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('streaming');
      setError(null);
      setStreamingText('');
      streamingTextRef.current = '';
      let resolvedConversationId: string | null = null;
      try {
        await streamAiRequest(
          path,
          body,
          (event) => {
            if (event.type === 'meta' && event.conversationId) {
              resolvedConversationId = event.conversationId;
              setActiveId(event.conversationId);
            }
            if (event.type === 'provider') {
              setLastProvider(event.provider || null);
            }
            if (event.type === 'delta' && event.text) {
              streamingTextRef.current += event.text;
              setStreamingText(streamingTextRef.current);
            }
            if (event.type === 'done' && event.conversationId) {
              resolvedConversationId = event.conversationId;
            }
          },
          controller.signal,
        );
        if (!resolvedConversationId) {
          throw new Error('AI response did not complete');
        }
        const finalText = streamingTextRef.current;
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: finalText,
            provider: lastProviderRef.current,
            createdAt: new Date().toISOString(),
          },
        ]);
        setStreamingText('');
        setStatus('idle');
        setActiveId(resolvedConversationId);
        refreshList();
      } catch (e) {
        setStatus('error');
        setError(userErrorMessage(e));
      } finally {
        abortRef.current = null;
      }
    },
    [refreshList],
  );

  const lastProviderRef = useRef<string | null>(null);
  useEffect(() => {
    lastProviderRef.current = lastProvider;
  }, [lastProvider]);

  const send = useCallback(
    async (text: string, location?: { lat: number; lng: number } | null) => {
      const trimmed = text.trim();
      if (!trimmed || status === 'streaming') return;
      setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: trimmed, createdAt: new Date().toISOString() }]);
      await runStream('/ai/chat', {
        message: trimmed,
        conversationId: activeIdRef.current ?? undefined,
        location: location ?? undefined,
      });
    },
    [runStream, status],
  );

  const regenerate = useCallback(
    async (location?: { lat: number; lng: number } | null) => {
      const id = activeIdRef.current;
      if (!id) return;
      const msgs = messagesRef.current;
      const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
      if (!lastUser) return;
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === 'assistant') {
            next.splice(i, 1);
            break;
          }
        }
        return next;
      });
      await runStream(`/ai/conversations/${id}/regenerate`, {
        location: location ?? undefined,
      });
    },
    [runStream],
  );

  const retry = useCallback(
    async (location?: { lat: number; lng: number } | null) => {
      const msgs = messagesRef.current;
      const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
      if (!lastUser) return;
      if (activeIdRef.current) {
        await runStream(`/ai/conversations/${activeIdRef.current}/regenerate`, { location: location ?? undefined });
      } else {
        await send(lastUser.content, location);
      }
    },
    [runStream, send],
  );

  const boot = useCallback(async () => {
    await refreshList();
    if (!autoLoadLatest) return;
    try {
      const { data } = await api.get('/ai/conversations/latest');
      const latestId = (data?.data || data)?.conversationId;
      if (latestId) {
        await loadConversation(latestId);
      } else {
        setStatus('idle');
      }
    } catch {
      setStatus('idle');
    }
  }, [refreshList, loadConversation, autoLoadLatest]);

  useEffect(() => {
    boot();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [boot]);

  return {
    conversations,
    activeId,
    messages,
    status,
    error,
    streamingText,
    lastProvider,
    send,
    regenerate,
    retry,
    newChat,
    deleteConversation,
    renameConversation,
    loadConversation,
    refreshList,
    selectConversation: loadConversation,
    clearError: () => setError(null),
  };
}
