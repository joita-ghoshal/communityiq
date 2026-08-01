const KEY = 'fmc-ai-previews';
const EVENT = 'fmc-ai-preview-updated';

export interface ConversationPreview {
  preview: string;
  updatedAt: string;
}

export function getConversationPreviews(): Record<string, ConversationPreview> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, ConversationPreview>;
  } catch {
    return {};
  }
}

export function saveConversationPreview(id: string, content: string) {
  try {
    const map = getConversationPreviews();
    map[id] = { preview: content.replace(/\s+/g, ' ').trim().slice(0, 120), updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function removeConversationPreview(id: string) {
  try {
    const map = getConversationPreviews();
    delete map[id];
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function subscribePreviewUpdates(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
