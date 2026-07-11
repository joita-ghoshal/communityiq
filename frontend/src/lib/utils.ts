import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    reported: 'bg-amber-100 text-amber-800 border-amber-200',
    ai_analyzing: 'bg-purple-100 text-purple-800 border-purple-200',
    community_verifying: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    verified: 'bg-blue-100 text-blue-800 border-blue-200',
    assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    escalated: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
    emergency: 'bg-rose-600 text-white animate-pulse',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    road_damage: '🛤️', water_leakage: '💧', garbage: '🗑️', electricity: '⚡',
    drainage: '🌊', noise: '🔊', public_safety: '🛡️', street_lighting: '💡',
    encroachment: '🏗️', environmental: '🌿', other: '📋',
  };
  return icons[category] || '📋';
}
