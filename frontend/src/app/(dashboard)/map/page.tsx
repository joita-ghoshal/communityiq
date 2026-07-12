'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapIcon, Squares2X2Icon, ListBulletIcon, MapPinIcon, ViewfinderCircleIcon,
  ArrowPathIcon, XMarkIcon, ExclamationTriangleIcon, FunnelIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import { pageThemes } from '@/lib/theme/page-themes';
import { getCategoryIcon } from '@/lib/utils';

const ALL_STATUSES = [
  'reported', 'ai_analyzing', 'community_verification', 'verified',
  'assigned', 'work_started', 'in_progress', 'partially_resolved',
  'awaiting_ai_verification', 'awaiting_citizen_confirmation',
  'resolved', 'closed', 'archived', 'duplicate', 'reopened', 'invalid',
] as const;

type IssueStatus = typeof ALL_STATUSES[number];

const INACTIVE_STATUSES: Set<string> = new Set([
  'resolved', 'closed', 'archived', 'duplicate', 'invalid',
]);

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; hex: string }> = {
  reported:                       { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500',   hex: '#3b82f6' },
  ai_analyzing:                   { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500',   hex: '#3b82f6' },
  community_verification:         { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', hex: '#a855f7' },
  verified:                       { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', hex: '#a855f7' },
  assigned:                       { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', hex: '#f97316' },
  work_started:                   { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', hex: '#f97316' },
  in_progress:                    { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500', hex: '#eab308' },
  partially_resolved:             { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500', hex: '#eab308' },
  awaiting_ai_verification:       { bg: 'bg-cyan-100 dark:bg-cyan-900/30',   text: 'text-cyan-700 dark:text-cyan-300',   dot: 'bg-cyan-500',   hex: '#06b6d4' },
  awaiting_citizen_confirmation:  { bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500',  hex: '#22c55e' },
  resolved:                       { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', hex: '#10b981' },
  closed:                         { bg: 'bg-gray-100 dark:bg-gray-900/30',   text: 'text-gray-700 dark:text-gray-300',   dot: 'bg-gray-500',   hex: '#6b7280' },
  archived:                       { bg: 'bg-gray-100 dark:bg-gray-900/30',   text: 'text-gray-700 dark:text-gray-300',   dot: 'bg-gray-500',   hex: '#6b7280' },
  duplicate:                      { bg: 'bg-gray-100 dark:bg-gray-900/30',   text: 'text-gray-700 dark:text-gray-300',   dot: 'bg-gray-500',   hex: '#6b7280' },
  reopened:                       { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500',  hex: '#f59e0b' },
  invalid:                        { bg: 'bg-gray-100 dark:bg-gray-900/30',   text: 'text-gray-700 dark:text-gray-300',   dot: 'bg-gray-500',   hex: '#6b7280' },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  reported:                      ['ai_analyzing', 'community_verification', 'verified', 'invalid'],
  ai_analyzing:                  ['community_verification', 'verified', 'invalid'],
  community_verification:        ['verified', 'duplicate', 'invalid'],
  verified:                      ['assigned', 'duplicate', 'invalid'],
  assigned:                      ['work_started', 'duplicate', 'invalid'],
  work_started:                  ['in_progress', 'partially_resolved'],
  in_progress:                   ['partially_resolved', 'awaiting_ai_verification', 'awaiting_citizen_confirmation', 'resolved'],
  partially_resolved:            ['in_progress', 'awaiting_ai_verification', 'awaiting_citizen_confirmation', 'resolved'],
  awaiting_ai_verification:      ['resolved', 'in_progress', 'partially_resolved'],
  awaiting_citizen_confirmation: ['resolved', 'reopened', 'in_progress'],
  resolved:                      ['closed', 'reopened'],
  closed:                        ['archived', 'reopened'],
  archived:                      [],
  duplicate:                     ['reopened'],
  reopened:                      ['assigned', 'work_started', 'in_progress', 'invalid'],
  invalid:                       ['reopened'],
};

const filterCategories = ['All', 'Road Damage', 'Water Leakage', 'Garbage', 'Electricity', 'Drainage', 'Safety'];
const catToInternal: Record<string, string> = {
  'Road Damage': 'road_damage',
  'Water Leakage': 'water_leakage',
  'Garbage': 'garbage',
  'Electricity': 'electricity',
  'Drainage': 'drainage',
  'Safety': 'public_safety',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

interface MapIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  reporter?: string;
  createdAt?: string;
  completionPercentage?: number;
  riskScore?: number;
  assignedTeam?: string;
  assignedDepartment?: string;
  reportedBy?: { name?: string; email?: string };
}

interface UserProfile {
  role?: string;
}

const statusFilterGroups: { label: string; value: string; statuses?: string[] }[] = [
  { label: 'Active', value: '__active' },
  { label: 'All', value: 'all' },
  { label: 'Reported', value: '__reported', statuses: ['reported', 'ai_analyzing'] },
  { label: 'In Progress', value: '__in_progress', statuses: ['assigned', 'work_started', 'in_progress', 'partially_resolved'] },
  { label: 'Resolved', value: '__resolved', statuses: ['resolved', 'closed'] },
];

function statusMatchesFilter(status: string, filterValue: string): boolean {
  if (filterValue === 'all') return true;
  if (filterValue === '__active') return !INACTIVE_STATUSES.has(status);
  const group = statusFilterGroups.find((g) => g.value === filterValue);
  if (group?.statuses) return group.statuses.includes(status);
  return status === filterValue;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.reported;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {formatStatus(status)}
    </span>
  );
}

function ProgressRing({ percentage }: { percentage: number }) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-slate-700" />
        <circle
          cx="24" cy="24" r={radius} fill="none" stroke="#10b981" strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 24 24)"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-700 dark:text-slate-300">{clamped}%</span>
    </div>
  );
}

const categoryMarkerColors: Record<string, { color: string; svg: string }> = {
  road_damage: { color: '#f97316', svg: '🛤️' },
  water_leakage: { color: '#3b82f6', svg: '💧' },
  garbage: { color: '#22c55e', svg: '🗑️' },
  electricity: { color: '#eab308', svg: '⚡' },
  drainage: { color: '#06b6d4', svg: '🌊' },
  public_safety: { color: '#ef4444', svg: '🛡️' },
  street_lighting: { color: '#a855f7', svg: '💡' },
  environmental: { color: '#84cc16', svg: '🌿' },
};

function createPinIcon(L: typeof import('leaflet'), issue: MapIssue) {
  const statusColor = STATUS_COLORS[issue.status]?.hex || '#6b7280';
  const isHighRisk = (issue.riskScore ?? 0) > 70;
  const riskGlow = isHighRisk
    ? `<circle cx="14" cy="14" r="22" fill="${statusColor}" opacity="0.18"><animate attributeName="r" values="18;24;18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.25;0.08;0.25" dur="2s" repeatCount="indefinite"/></circle>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    ${riskGlow}
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${statusColor}"/>
    <circle cx="14" cy="13" r="6" fill="white" opacity="0.9"/>
    ${isHighRisk ? `<circle cx="14" cy="13" r="6" fill="none" stroke="#ef4444" stroke-width="1.5"><animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/></circle>` : ''}
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

interface LeafletMapProps {
  center: [number, number];
  issues: MapIssue[];
  onIssueClick: (id: string) => void;
}

const DynamicLeafletMap = dynamic<LeafletMapProps>(
  async () => {
    await import('leaflet/dist/leaflet.css');
    const { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } = await import('react-leaflet');
    const L = (await import('leaflet')).default;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    function RecenterMap({ center }: { center: [number, number] }) {
      const map = useMap();
      useEffect(() => {
        map.setView(center, map.getZoom());
      }, [center, map]);
      return null;
    }

    function LocateButton() {
      const map = useMap();
      const handleClick = useCallback(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
          () => {},
          { enableHighAccuracy: true }
        );
      }, [map]);
      return (
        <button
          onClick={handleClick}
          className="absolute top-4 right-4 z-[1000] bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          <ViewfinderCircleIcon className="w-4 h-4" />
          Locate Me
        </button>
      );
    }

    function MapEventsHandler({ onIssueClick }: { onIssueClick: () => void }) {
      useMapEvents({ click: () => onIssueClick() });
      return null;
    }

    function LeafletMapInner({ center, issues, onIssueClick }: LeafletMapProps) {
      return (
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={center} />
          <LocateButton />
          <MapEventsHandler onIssueClick={() => onIssueClick('')} />
          {issues.map((issue) => (
            <Marker
              key={issue.id}
              position={[issue.lat, issue.lng]}
              icon={createPinIcon(L, issue)}
              eventHandlers={{ click: () => onIssueClick(issue.id) }}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <p className="font-semibold text-sm text-slate-900">{issue.title}</p>
                  {issue.address && <p className="text-xs text-slate-500 mt-0.5">{issue.address}</p>}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <StatusBadge status={issue.status} />
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.medium}`}>
                      {issue.priority}
                    </span>
                  </div>
                  {(issue.riskScore ?? 0) > 70 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-600 font-medium">
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      Risk Score: {issue.riskScore}
                    </div>
                  )}
                  <button onClick={() => onIssueClick(issue.id)} className="w-full mt-2 py-1.5 text-[11px] font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:opacity-90 transition">
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      );
    }

    return { default: LeafletMapInner };
  },
  { ssr: false }
);

const priorityOptions = ['all', 'low', 'medium', 'high', 'critical'];

export default function MapPage() {
  const theme = pageThemes.map;
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePriority, setActivePriority] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('__active');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showTransitionMenu, setShowTransitionMenu] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [issuesRes, profileRes] = await Promise.allSettled([
          api.get('/issues', { params: { page: 1, limit: 500 } }),
          api.get('/auth/me'),
        ]);

        if (cancelled) return;

        if (issuesRes.status === 'fulfilled') {
          const data = issuesRes.value.data;
          const raw = data?.data?.issues || data?.data || data?.issues || data || [];
          const list: MapIssue[] = (Array.isArray(raw) ? raw : []).map((item: any) => {
            let lat = 0;
            let lng = 0;
            if (item.location) {
              if (item.location.type === 'Point' && Array.isArray(item.location.coordinates)) {
                lng = item.location.coordinates[0];
                lat = item.location.coordinates[1];
              } else if (item.location.latitude != null) {
                lat = item.location.latitude;
                lng = item.location.longitude;
              }
            }
            if (item.lat != null) lat = item.lat;
            if (item.lng != null) lng = item.lng;
            if (item.latitude != null) lat = item.latitude;
            if (item.longitude != null) lng = item.longitude;
            return {
              id: String(item.id ?? item._id ?? ''),
              title: item.title ?? 'Untitled',
              description: item.description ?? '',
              category: item.category ?? 'road_damage',
              status: item.status ?? 'reported',
              priority: item.priority ?? 'medium',
              lat,
              lng,
              address: item.address,
              city: item.city,
              reporter: item.reporter ?? item.reportedBy,
              createdAt: item.createdAt,
              completionPercentage: item.completionPercentage ?? item.completion_percentage ?? 0,
              riskScore: item.riskScore ?? item.risk_score ?? 0,
              assignedTeam: item.assignedTeam ?? item.assigned_team,
              assignedDepartment: item.assignedDepartment ?? item.assigned_department,
              reportedBy: item.reportedBy && typeof item.reportedBy === 'object' ? item.reportedBy : undefined,
            };
          });
          setIssues(list);
        } else {
          setError('Failed to load issues');
        }

        if (profileRes.status === 'fulfilled') {
          const pData = profileRes.value.data;
          setUser(pData?.data?.user || pData?.data || pData?.user || pData);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load issues');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredIssues = issues.filter((issue) => {
    if (!statusMatchesFilter(issue.status, activeStatusFilter)) return false;
    if (activeCategory !== 'All' && issue.category !== catToInternal[activeCategory]) return false;
    if (activePriority !== 'all' && issue.priority !== activePriority) return false;
    return true;
  });

  const selectedIssueData = selectedIssue ? issues.find((i) => i.id === selectedIssue) : null;

  const handlePinClick = (id: string) => {
    setSelectedIssue(id || null);
    setShowTransitionMenu(false);
  };

  const handleTransitionStatus = async (newStatus: string) => {
    if (!selectedIssueData || transitioning) return;
    setTransitioning(true);
    try {
      await api.patch(`/issues/${selectedIssueData.id}/transition`, { status: newStatus });
      setIssues((prev) =>
        prev.map((i) => (i.id === selectedIssueData.id ? { ...i, status: newStatus } : i))
      );
      setShowTransitionMenu(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to transition status');
    } finally {
      setTransitioning(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'department_admin';

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="p-4 md:p-6 pb-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`${theme.gradient} rounded-xl p-2.5 text-white`}>
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Live Issue Map</h1>
                  <p className="text-xs text-slate-500">
                    {loading ? 'Loading issues...' : `${filteredIssues.length} issues shown`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('map')} className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Status Filter Chips */}
          <div className="px-4 md:px-6 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {statusFilterGroups.map((group) => (
                <button
                  key={group.value}
                  onClick={() => setActiveStatusFilter(group.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    activeStatusFilter === group.value
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {group.label}
                  {group.value === '__active' && !loading && (
                    <span className="ml-1 text-[10px] opacity-75">
                      ({issues.filter((i) => !INACTIVE_STATUSES.has(i.status)).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filters */}
          <div className="px-4 md:px-6 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {filterCategories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filters */}
          <div className="px-4 md:px-6 pb-3 flex flex-col sm:flex-row gap-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider self-center mr-1 flex items-center gap-1">
                <FunnelIcon className="w-3 h-3" />
                Priority
              </span>
              {priorityOptions.map((p) => (
                <button key={p} onClick={() => setActivePriority(p)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                    activePriority === p
                      ? p === 'critical' ? 'bg-red-600 text-white shadow-md' :
                        p === 'high' ? 'bg-orange-500 text-white shadow-md' :
                        p === 'medium' ? 'bg-yellow-500 text-white shadow-md' :
                        p === 'low' ? 'bg-emerald-500 text-white shadow-md' :
                        'bg-slate-600 text-white shadow-md'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}>
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Map / List Content */}
          <div className="flex-1 px-4 md:px-6 pb-4 min-h-0">
            {viewMode === 'map' ? (
              <div className="h-full rounded-2xl overflow-hidden relative bg-slate-200 dark:bg-slate-800" style={{ minHeight: 'calc(100vh - 18rem)', width: '100%' }}>
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-500 text-sm">Loading issues...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-red-500 text-sm font-medium">{error}</p>
                      <button onClick={() => window.location.reload()} className="mt-2 text-xs text-emerald-600 hover:underline">Retry</button>
                    </div>
                  </div>
                ) : (
                  <Suspense fallback={
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-slate-500 text-sm">Loading map...</div>
                    </div>
                  }>
                    <DynamicLeafletMap center={mapCenter} issues={filteredIssues} onIssueClick={handlePinClick} />
                  </Suspense>
                )}

                {/* Status Legend */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl p-3 text-xs space-y-1 shadow-lg max-h-[40vh] overflow-y-auto">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Status Colors</p>
                  {[
                    ['New', 'bg-blue-500'],
                    ['Verifying', 'bg-purple-500'],
                    ['Assigned', 'bg-orange-500'],
                    ['Working', 'bg-yellow-500'],
                    ['Awaiting AI', 'bg-cyan-500'],
                    ['Awaiting Confirm', 'bg-green-500'],
                    ['Resolved', 'bg-emerald-500'],
                    ['Closed', 'bg-gray-500'],
                  ].map(([label, dotClass]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                      <span className="text-slate-600 dark:text-slate-400">{label}</span>
                    </div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-red-500 animate-pulse" />
                      <span className="text-slate-600 dark:text-slate-400">High Risk</span>
                    </div>
                  </div>
                </div>

                {/* Issue Detail Panel */}
                <AnimatePresence>
                  {selectedIssueData && (
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute top-4 right-4 bottom-4 z-[1000] w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
                    >
                      {/* Panel Header */}
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedIssueData.title}</h3>
                          {selectedIssueData.address && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                              <MapPinIcon className="w-3 h-3 flex-shrink-0" /> {selectedIssueData.address}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedIssue(null)}
                          className="ml-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-400 hover:text-slate-600"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Panel Body */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Status & Priority */}
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge status={selectedIssueData.status} />
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[selectedIssueData.priority] || PRIORITY_COLORS.medium}`}>
                            {selectedIssueData.priority}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {selectedIssueData.category.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Description */}
                        {selectedIssueData.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{selectedIssueData.description}</p>
                        )}

                        {/* Completion */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <ProgressRing percentage={selectedIssueData.completionPercentage ?? 0} />
                            <div className="flex-1">
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, selectedIssueData.completionPercentage ?? 0)}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {selectedIssueData.completionPercentage ?? 0}% complete
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Risk Score */}
                        {(selectedIssueData.riskScore ?? 0) > 0 && (
                          <div className={`rounded-lg p-3 ${(selectedIssueData.riskScore ?? 0) > 70 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
                            <div className="flex items-center gap-2">
                              {(selectedIssueData.riskScore ?? 0) > 70 && <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />}
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Risk Score</span>
                            </div>
                            <p className={`text-lg font-bold mt-1 ${(selectedIssueData.riskScore ?? 0) > 70 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                              {selectedIssueData.riskScore}
                            </p>
                            {(selectedIssueData.riskScore ?? 0) > 70 && (
                              <p className="text-[10px] text-red-500 mt-0.5">High risk - requires immediate attention</p>
                            )}
                          </div>
                        )}

                        {/* Details */}
                        <div className="space-y-2 text-[11px] text-slate-500">
                          {selectedIssueData.reportedBy?.name && (
                            <div className="flex justify-between">
                              <span>Reported by</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{selectedIssueData.reportedBy.name}</span>
                            </div>
                          )}
                          {!selectedIssueData.reportedBy?.name && selectedIssueData.reporter && (
                            <div className="flex justify-between">
                              <span>Reported by</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{selectedIssueData.reporter}</span>
                            </div>
                          )}
                          {selectedIssueData.createdAt && (
                            <div className="flex justify-between">
                              <span>Date</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {new Date(selectedIssueData.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {(selectedIssueData.assignedTeam || selectedIssueData.assignedDepartment) && (
                            <div className="flex justify-between">
                              <span>Team</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {selectedIssueData.assignedDepartment || selectedIssueData.assignedTeam}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Transition (Admin) */}
                        {isAdmin && STATUS_TRANSITIONS[selectedIssueData.status]?.length > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Next Statuses</span>
                              <button
                                onClick={() => setShowTransitionMenu(!showTransitionMenu)}
                                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                              >
                                <ArrowPathIcon className="w-3 h-3" />
                                {showTransitionMenu ? 'Cancel' : 'Transition'}
                              </button>
                            </div>
                            <AnimatePresence>
                              {showTransitionMenu ? (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="space-y-1.5 overflow-hidden"
                                >
                                  {STATUS_TRANSITIONS[selectedIssueData.status].map((nextStatus) => (
                                    <button
                                      key={nextStatus}
                                      onClick={() => handleTransitionStatus(nextStatus)}
                                      disabled={transitioning}
                                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition disabled:opacity-50 flex items-center justify-between"
                                    >
                                      <StatusBadge status={nextStatus} />
                                      {transitioning && <span className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                                    </button>
                                  ))}
                                </motion.div>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {STATUS_TRANSITIONS[selectedIssueData.status].map((nextStatus) => (
                                    <StatusBadge key={nextStatus} status={nextStatus} />
                                  ))}
                                </div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* View Full Details */}
                        <button
                          onClick={() => {
                            window.location.href = `/issues/${selectedIssueData.id}`;
                          }}
                          className="w-full py-2.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:opacity-90 transition"
                        >
                          View Full Details
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Loading issues...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-2 text-xs text-emerald-600 hover:underline">Retry</button>
                  </div>
                ) : filteredIssues.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">No issues match your filters</div>
                ) : (
                  filteredIssues.map((issue, i) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="glass-card p-4 cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => handlePinClick(issue.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(issue.category)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{issue.title}</p>
                            {(issue.riskScore ?? 0) > 70 && (
                              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                            <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                            {issue.address || issue.city || 'Location unavailable'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end flex-shrink-0">
                          <StatusBadge status={issue.status} />
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.medium}`}>
                            {issue.priority}
                          </span>
                        </div>
                      </div>
                      {(issue.completionPercentage ?? 0) > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, issue.completionPercentage ?? 0)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 flex-shrink-0">{issue.completionPercentage}%</span>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
