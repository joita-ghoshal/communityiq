import type { AiChatEvent } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class AiStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiStreamError';
  }
}

export async function streamAiRequest(
  path: string,
  body: Record<string, unknown>,
  onEvent: (event: AiChatEvent) => void,
  signal?: AbortSignal,
): Promise<{ conversationId: string | null }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (!response.ok || !response.body) {
    let message = `Request failed (${response.status})`;
    try {
      const json = await response.json();
      message = json.message || message;
    } catch {
      /* non-json error body */
    }
    throw new AiStreamError(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let conversationId: string | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() || '';
    for (const frame of frames) {
      const dataLine = frame.split('\n').find((l) => l.startsWith('data: '));
      if (!dataLine) continue;
      let event: AiChatEvent;
      try {
        event = JSON.parse(dataLine.slice(6)) as AiChatEvent;
      } catch {
        continue;
      }
      if (event.conversationId) conversationId = event.conversationId;
      if (event.type === 'error') {
        throw new AiStreamError(event.message || 'AI service error');
      }
      onEvent(event);
    }
  }

  if (!conversationId) {
    throw new AiStreamError('AI response ended without completion');
  }
  return { conversationId };
}

export function userErrorMessage(error: unknown): string {
  if (error instanceof AiStreamError) return error.message;
  if (error instanceof DOMException && error.name === 'AbortError') return 'Request cancelled';
  if (error instanceof TypeError) return 'Network error. Check your connection and try again.';
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
