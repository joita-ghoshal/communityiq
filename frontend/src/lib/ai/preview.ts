export interface ConversationPreview {
  text: string;
  at: number;
}

const PREVIEWS_KEY = 'fmc-ai-previews';

export function getConversationPreviews(): Record<string, ConversationPreview> {
  try {
    return JSON.parse(localStorage.getItem(PREVIEWS_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function saveConversationPreview(id: string, preview: ConversationPreview) {
  const all = getConversationPreviews();
  all[id] = preview;
  try {
    localStorage.setItem(PREVIEWS_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent('fmc-ai-preview-updated', { detail: { id } }));
}

export function removeConversationPreview(id: string) {
  const all = getConversationPreviews();
  if (all[id]) {
    delete all[id];
    try {
      localStorage.setItem(PREVIEWS_KEY, JSON.stringify(all));
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new CustomEvent('fmc-ai-preview-updated', { detail: { id } }));
  }
}

export function subscribePreviewUpdates(cb: () => void) {
  window.addEventListener('fmc-ai-preview-updated', cb);
  return () => window.removeEventListener('fmc-ai-preview-updated', cb);
}
