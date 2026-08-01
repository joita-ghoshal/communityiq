export interface ConversationPreview {
  text: string;
  at: number;
}

const PREVIEWS_KEY = 'fmc-ai-previews';

export function getConversationPreviews(): Record<string, ConversationPreview> {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(localStorage.getItem(PREVIEWS_KEY) || '{}') || {};
  } catch {
    raw = {};
  }
  const clean: Record<string, ConversationPreview> = {};
  for (const [id, entry] of Object.entries(raw)) {
    const p = entry as Partial<ConversationPreview> | undefined;
    if (p && typeof p.text === 'string' && p.text.trim() && typeof p.at === 'number' && !Number.isNaN(p.at)) {
      clean[id] = { text: p.text.slice(0, 110), at: p.at };
    }
  }
  if (Object.keys(clean).length !== Object.keys(raw).length) {
    try {
      localStorage.setItem(PREVIEWS_KEY, JSON.stringify(clean));
    } catch {
      /* storage unavailable */
    }
  }
  return clean;
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
