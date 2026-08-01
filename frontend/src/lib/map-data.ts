export const ISSUE_CATEGORIES: Record<string, { label: string; color: string; icon: string; emoji: string }> = {
  road_damage:      { label: 'Road Damage',       color: '#f97316', emoji: '🛤️', icon: 'road' },
  water_supply:     { label: 'Water Supply',      color: '#3b82f6', emoji: '💧', icon: 'water' },
  sanitation:       { label: 'Sanitation',        color: '#14b8a6', emoji: '🧹', icon: 'sanitation' },
  electricity:      { label: 'Electricity',       color: '#eab308', emoji: '⚡', icon: 'bolt' },
  garbage:          { label: 'Garbage',           color: '#22c55e', emoji: '🗑️', icon: 'garbage' },
  drainage:         { label: 'Drainage',          color: '#06b6d4', emoji: '🌊', icon: 'drainage' },
  street_lighting:  { label: 'Street Lighting',   color: '#a855f7', emoji: '💡', icon: 'light' },
  public_safety:    { label: 'Public Safety',     color: '#ef4444', emoji: '🛡️', icon: 'shield' },
  noise_pollution:  { label: 'Noise Pollution',   color: '#d946ef', emoji: '📢', icon: 'noise' },
  air_pollution:    { label: 'Air Pollution',     color: '#84cc16', emoji: '🌫️', icon: 'air' },
  parks_green:      { label: 'Parks & Green',     color: '#10b981', emoji: '🌳', icon: 'park' },
  traffic:          { label: 'Traffic',           color: '#f59e0b', emoji: '🚦', icon: 'traffic' },
  building_safety:  { label: 'Building Safety',   color: '#78716c', emoji: '🏗️', icon: 'building' },
  flooding:         { label: 'Flooding',          color: '#0ea5e9', emoji: '🌧️', icon: 'flood' },
  animal_control:   { label: 'Animal Control',    color: '#8b5cf6', emoji: '🐕', icon: 'animal' },
  other:            { label: 'Other',             color: '#64748b', emoji: '📌', icon: 'other' },
};

export const PRIORITY_META: Record<string, { label: string; color: string; weight: number }> = {
  low:      { label: 'Low',      color: '#10b981', weight: 1 },
  medium:   { label: 'Medium',   color: '#f59e0b', weight: 2 },
  high:     { label: 'High',     color: '#f97316', weight: 3 },
  critical: { label: 'Critical', color: '#ef4444', weight: 4 },
  emergency:{ label: 'Emergency',color: '#dc2626', weight: 5 },
};

export const STATUS_META: Record<string, { label: string; color: string; hex: string; inactive?: boolean }> = {
  reported:                      { label: 'Reported',                   color: '#3b82f6', hex: '#3b82f6' },
  ai_analyzing:                  { label: 'AI Analyzing',               color: '#60a5fa', hex: '#60a5fa' },
  community_verification:        { label: 'Community Verification',     color: '#a855f7', hex: '#a855f7' },
  verified:                      { label: 'Verified',                   color: '#9333ea', hex: '#9333ea' },
  assigned:                      { label: 'Assigned',                   color: '#f97316', hex: '#f97316' },
  work_started:                  { label: 'Work Started',               color: '#fb923c', hex: '#fb923c' },
  in_progress:                   { label: 'In Progress',                color: '#eab308', hex: '#eab308' },
  partially_resolved:            { label: 'Partially Resolved',         color: '#facc15', hex: '#facc15' },
  awaiting_ai_verification:      { label: 'Awaiting AI Verification',   color: '#06b6d4', hex: '#06b6d4' },
  awaiting_citizen_confirmation: { label: 'Awaiting Citizen Confirmation', color: '#34d399', hex: '#34d399' },
  resolved:                      { label: 'Resolved',                   color: '#10b981', hex: '#10b981', inactive: true },
  closed:                        { label: 'Closed',                     color: '#6b7280', hex: '#6b7280', inactive: true },
  archived:                      { label: 'Archived',                   color: '#9ca3af', hex: '#9ca3af', inactive: true },
  duplicate:                     { label: 'Duplicate',                  color: '#ef4444', hex: '#ef4444', inactive: true },
  reopened:                      { label: 'Reopened',                   color: '#f59e0b', hex: '#f59e0b' },
  invalid:                       { label: 'Invalid',                    color: '#4b5563', hex: '#4b5563', inactive: true },
};

export const ACTIVE_STATUSES = Object.entries(STATUS_META)
  .filter(([, v]) => !v.inactive)
  .map(([k]) => k);

export function categoryLabel(cat: string): string {
  return ISSUE_CATEGORIES[cat]?.label || cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function categoryColor(cat: string): string {
  return ISSUE_CATEGORIES[cat]?.color || '#64748b';
}

export function categoryEmoji(cat: string): string {
  return ISSUE_CATEGORIES[cat]?.emoji || '📌';
}

export function statusLabel(s: string): string {
  return STATUS_META[s]?.label || s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function priorityLabel(p: string): string {
  return PRIORITY_META[p]?.label || p.charAt(0).toUpperCase() + p.slice(1);
}

export function formatDistance(km: number | null | undefined): string {
  if (km == null) return '—';
  if (km < 0.1) return `${Math.round(km * 1000)} m`;
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const KOLKATA_CENTER: [number, number] = [22.5726, 88.3639];

export const STATUS_GROUPS: { label: string; value: string; statuses?: string[] }[] = [
  { label: 'Active', value: '__active' },
  { label: 'All', value: 'all' },
  { label: 'Reported', value: '__reported', statuses: ['reported', 'ai_analyzing'] },
  { label: 'Verifying', value: '__verifying', statuses: ['community_verification', 'verified'] },
  { label: 'In Progress', value: '__in_progress', statuses: ['assigned', 'work_started', 'in_progress', 'partially_resolved'] },
  { label: 'Awaiting Confirm', value: '__confirm', statuses: ['awaiting_ai_verification', 'awaiting_citizen_confirmation'] },
  { label: 'Resolved', value: '__resolved', statuses: ['resolved', 'closed'] },
];

export function statusMatchesGroup(status: string, group: string): boolean {
  if (group === 'all') return true;
  if (group === '__active') return !STATUS_META[status]?.inactive;
  const g = STATUS_GROUPS.find((x) => x.value === group);
  if (g?.statuses) return g.statuses.includes(status);
  return status === group;
}
