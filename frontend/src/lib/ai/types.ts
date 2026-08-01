export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string | null;
  model?: string | null;
  createdAt: string;
}

export interface AiConversationMeta {
  id: string;
  title: string;
  isVoice: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface AiConversationDetail extends AiConversationMeta {
  messages: AiChatMessage[];
}

export type AiChatStatus = 'idle' | 'loading' | 'streaming' | 'error';

export interface AiChatEvent {
  type: 'meta' | 'provider' | 'delta' | 'done' | 'error';
  conversationId?: string;
  messageId?: string;
  provider?: string;
  model?: string;
  text?: string;
  message?: string;
}

export interface ChatSendOptions {
  message: string;
  conversationId?: string | null;
  location?: { lat: number; lng: number } | null;
  isVoice?: boolean;
  stream?: boolean;
}
