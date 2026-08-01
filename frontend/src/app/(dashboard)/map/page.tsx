'use client';
import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  MapIcon, FunnelIcon, ViewfinderCircleIcon, ArrowsPointingOutIcon,
  ArrowsPointingInIcon, ScaleIcon, MapPinIcon, BoltIcon,
  Squares2X2Icon, ListBulletIcon, XMarkIcon, CheckBadgeIcon, FireIcon,
  SparklesIcon, ShieldExclamationIcon, UsersIcon, WifiIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { useSocket } from '@/contexts/SocketContext';
import api from '@/lib/api';
import { DynamicMapView, MapIssue, RiskZone, OverlayState } from '@/components/map/MapView';
import MapSearchBox, { SearchSelection } from '@/components/map/MapSearchBox';
import MapFiltersPanel, { MapFilters, DEFAULT_FILTERS } from '@/components/map/MapFiltersPanel';
import IssueDetailPanel from '@/components/map/IssueDetailPanel';
import {
  KOLKATA_CENTER, haversineKm, formatDistance, statusMatchesGroup,
  statusLabel, categoryEmoji, categoryLabel, priorityLabel,
} from '@/lib/map-data';

type GpsState = 'idle' | 'acquiring' | 'active' | 'denied' | 'unavailable' | 'error';

const DEFAULT_OVERLAYS: OverlayState = { heatmap: false, riskZones: false, predicted: false, duplicates: false, community: false };

interface RawIssueItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  lat?: number | null;
  lng?: number | null;
  location?: any;
  latitude?: number;
  longitude?: number;
  distanceKm?: number | null;
  riskScore?: number | null;
  communityScore?: number | null;
  upvotes?: number;
  downvotes?: number;
  isUrgent?: boolean;
  completionPercentage?: number | null;
  createdAt?: string;
  address?: string;
  ward?: string | null;
  pincode?: string | null;
  department?: { id: string; name: string; code?: string } | null;
  reporter?: { id: string; name: string } | null;
  aiAnalysis?: any;
  verification?: any;
  verificationData?: any;
}

function parseLatLng(item: RawIssueItem): { lat: number | null; lng: number | null } {
  let lat: number | null = null;
  let lng: number | null = null;
  if (item.lat != null) lat = Number(item.lat);
  if (item.lng != null) lng = Number(item.lng);
  if (item.latitude != null) lat = Number(item.latitude);
  if (item.longitude != null) lng = Number(item.longitude);
  if (lat == null && item.location) {
    if (item.location.type === 'Point' && Array.isArray(item.location.coordinates)) {
      lng = Number(item.location.coordinates[0]);
      lat = Number(item.location.coordinates[1]);
    } else if (item.location.latitude != null) {
      lat = Number(item.location.latitude);
      lng = Number(item.location.longitude);
    }
  }
  return { lat, lng };
}

function toMapIssue(item: RawIssueItem): MapIssue {
  const { lat, lng } = parseLatLng(item);
  const vd = item.verificationData;
  return {
    id: String(item.id),
    title: item.title ?? 'Untitled',
    description: item.description ?? '',
    category: item.category ?? 'other',
    priority: item.priority ?? 'medium',
    status: item.status ?? 'reported',
    lat,
    lng,
    distanceKm: item.distanceKm != null ? Number(item.distanceKm) : null,
    riskScore: item.riskScore ?? null,
    communityScore: item.communityScore ?? null,
    upvotes: item.upvotes ?? 0,
    downvotes: item.downvotes ?? 0,
    isUrgent: !!item.isUrgent,
    completionPercentage: item.completionPercentage ?? null,
    createdAt: item.createdAt ?? '',
    address: item.address ?? '',
    ward: item.ward ?? null,
    pincode: item.pincode ?? null,
    department: item.department
      ? { id: String(item.department.id), name: item.department.name, code: item.department.code }
      : null,
    reporter: item.reporter
      ? { id: String(item.reporter.id), name: item.reporter.name }
      : null,
    aiAnalysis: item.aiAnalysis
      ? {
          severity: item.aiAnalysis.severity ?? null,
          summary: item.aiAnalysis.summary ?? null,
          duplicateProbability: item.aiAnalysis.duplicateProbability ?? null,
          fakeProbability: item.aiAnalysis.fakeProbability ?? null,
          recommendedDepartment: item.aiAnalysis.recommendedDepartment ?? null,
        }
      : null,
    verification: item.verification ?? (vd ? { aiVerified: vd.aiVerified ?? false, aiConfidence: vd.aiConfidence ?? null, citizenConfirmed: vd.citizenConfirmed ?? null } : null),
  };
}

export default function MapPage() {
  const theme = pageThemes.map;
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const { socket, isConnected } = useSocket();

  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [hotspots, setHotspots] = useState<{ lat: number; lng: number; predictedRisk: number; issueCount: number }[]>([]);
  const [duplicatePoints, setDuplicatePoints] = useState<{ id: string; title: string; lat: number; lng: number; similarCount: number }[]>([]);
  const [communityHealth, setCommunityHealth] = useState<{ lat: number; lng: number; avgCommunity: number; issueCount: number }[]>([]);
  const [heatData, setHeatData] = useState<[number, number, number][]>([]);

  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const watchStartedRef = useRef(false);

  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [overlays, setOverlays] = useState<OverlayState>(DEFAULT_OVERLAYS);
  const [overlaysOpen, setOverlaysOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [distanceMode, setDistanceMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const center: [number, number] = userPosition ?? KOLKATA_CENTER;
  const centerRef = useRef<[number, number]>(center);
  centerRef.current = center;
  const socketRef = useRef(socket);
  socketRef.current = socket;
  const retriesRef = useRef(0);
  const lastPosRef = useRef<[number, number] | null>(null);
  const addressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------- GPS ---------------- */
  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsState('unavailable');
      setGpsErrorMsg('Geolocation is not supported by this browser');
      return;
    }
    if (watchStartedRef.current) return;
    watchStartedRef.current = true;
    setGpsState('acquiring');
    setGpsErrorMsg(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        retriesRef.current = 0;
        setGpsState('active');
        setGpsErrorMsg(null);

        const prev = lastPosRef.current;
        if (prev && haversineKm(prev[0], prev[1], lat, lng) < 0.025) {
          setUserAccuracy(pos.coords.accuracy ?? null);
          return;
        }
        lastPosRef.current = [lat, lng];
        setUserPosition([lat, lng]);
        setUserAccuracy(pos.coords.accuracy ?? null);

        if (!prev) {
          setFlyTo({ lat, lng, zoom: 15 });
          loadExploreRef.current(lat, lng);
        }

        if (addressTimerRef.current) clearTimeout(addressTimerRef.current);
        addressTimerRef.current = setTimeout(() => {
          api
            .get('/gis/reverse-geocode', { params: { lat, lng } })
            .then(({ data }) => {
              const d = data?.data;
              if (d?.address || d?.displayName) {
                setUserAddress(`${d.address || ''}${d.address && d.city ? ', ' : ''}${d.city || ''}`);
              }
            })
            .catch(() => {});
        }, 3000);
      },
      (err) => {
        if (err.code === 1) {
          setGpsState('denied');
          setGpsErrorMsg('Location permission denied. Enable location access in your browser settings to use live GPS features.');
        } else if (err.code === 3) {
          retriesRef.current += 1;
          setGpsErrorMsg(err.message || 'Location request timed out. Retrying...');
          if (retriesRef.current > 3 && !lastPosRef.current) {
            setGpsState('error');
            watchStartedRef.current = false;
            if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
          } else {
            setGpsState(lastPosRef.current ? 'active' : 'acquiring');
          }
        } else {
          setGpsErrorMsg(err.message || 'Unable to obtain location');
          setGpsState('error');
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }, []);

  useEffect(() => {
    startWatch();
    return () => {
      watchStartedRef.current = false;
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (addressTimerRef.current) clearTimeout(addressTimerRef.current);
    };
  }, [startWatch]);

  /* Compass */
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      let heading = (e as any).webkitCompassHeading;
      if (heading == null) {
        heading = e.alpha != null ? 360 - e.alpha : null;
      }
      if (heading != null) setCompassHeading(Math.round(heading));
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, []);

  /* Offline detection */
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  /* Fullscreen */
  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = document.getElementById('live-map-container');
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  /* ---------------- Data ---------------- */
  const loadExplore = useCallback(async (lat: number, lng: number) => {
    try {
      const { data } = await api.get('/gis/explore', {
        params: { lat, lng, radius: 50, limit: 500 },
      });
      const payload = data?.data || data;
      const list: MapIssue[] = (payload?.issues || [] as RawIssueItem[]).map(toMapIssue).filter((i: MapIssue) => i.lat != null && i.lng != null);
      setIssues(list);
      setLastSync(new Date().toISOString());
      setDataError(null);
    } catch (e: any) {
      setDataError(e?.response?.data?.message || 'Failed to load map data');
    }
  }, []);

  const loadOverlays = useCallback(async () => {
    try {
      const [overlayRes, heatRes] = await Promise.allSettled([
        api.get('/gis/ai-overlay'),
        api.get('/gis/heatmap-data'),
      ]);
      if (overlayRes.status === 'fulfilled') {
        const d = overlayRes.value.data?.data || overlayRes.value.data || {};
        setRiskZones(d.riskZones || []);
        setHotspots(d.predictedHotspots || []);
        setDuplicatePoints(d.duplicateGroups || []);
        setCommunityHealth(d.communityHealth || []);
      }
      if (heatRes.status === 'fulfilled') {
        const hd = heatRes.value.data?.data || heatRes.value.data || {};
        setHeatData((hd.data || []).map((p: any) => [p.lat, p.lng, p.weight || 1]));
      }
    } catch { /* silent */ }
  }, []);

  const loadExploreRef = useRef(loadExplore);
  loadExploreRef.current = loadExplore;

  const initialLoad = useCallback(async () => {
    await loadOverlays();
    await loadExplore(centerRef.current[0], centerRef.current[1]);
  }, [loadExplore, loadOverlays]);

  useEffect(() => {
    let cancelled = false;
    initialLoad().finally(() => {
      if (!cancelled) setLoading(false);
    });
    const interval = setInterval(() => {
      if (!socketRef.current?.connected) loadExplore(centerRef.current[0], centerRef.current[1]);
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [initialLoad]);

  /* ---------------- Real-time ---------------- */
  const applyIssuePatch = useCallback((msg: any) => {
    const id = String(msg?.issueId || '');
    if (!id) return;
    const type = msg?.type;

    if (type === 'removed') {
      setIssues((prev) => prev.filter((i) => i.id !== id));
      setSelectedIssueId((sel) => (sel === id ? null : sel));
      return;
    }

    setIssues((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (!existing) {
        if (type === 'created' && msg.latitude != null && msg.longitude != null) {
          const created: MapIssue = {
            id,
            title: msg.title || 'New issue',
            description: '',
            category: msg.category || 'other',
            priority: msg.priority || 'medium',
            status: msg.status || 'reported',
            lat: Number(msg.latitude),
            lng: Number(msg.longitude),
            distanceKm: null,
            riskScore: null,
            communityScore: null,
            upvotes: 0,
            downvotes: 0,
            isUrgent: msg.priority === 'emergency' || msg.priority === 'critical',
            completionPercentage: 0,
            createdAt: msg.createdAt,
            address: '',
            ward: null,
            pincode: null,
            department: null,
            reporter: null,
            aiAnalysis: null,
            verification: null,
          };
          return [created, ...prev];
        }
        return prev;
      }
      return prev.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i };
        if (msg.status) next.status = msg.status;
        if (msg.priority) next.priority = msg.priority;
        if (msg.title) next.title = msg.title;
        if (msg.completionPercentage != null) next.completionPercentage = Number(msg.completionPercentage);
        if (msg.upvotes != null) next.upvotes = Number(msg.upvotes);
        if (msg.downvotes != null) next.downvotes = Number(msg.downvotes);
        if (msg.isResolved) next.status = 'resolved';
        return next;
      });
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: any) => {
      applyIssuePatch(msg);
      if (msg?.type === 'created') loadExplore(centerRef.current[0], centerRef.current[1]);
    };
    socket.on('issue:update', handler);
    return () => {
      socket.off('issue:update', handler);
    };
  }, [socket, applyIssuePatch, loadExplore]);

  /* ---------------- Derived ---------------- */
  const departments = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => {
      if (i.department?.name) set.add(i.department.name);
    });
    return Array.from(set).sort();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const sinceMs =
      filters.since === '24h' ? 86400000
      : filters.since === '7d' ? 7 * 86400000
      : filters.since === '30d' ? 30 * 86400000
      : filters.since === '90d' ? 90 * 86400000
      : null;
    return issues.filter((i) => {
      if (!statusMatchesGroup(i.status, filters.status)) return false;
      if (filters.category !== 'all' && i.category !== filters.category) return false;
      if (filters.priority !== 'all' && i.priority !== filters.priority) return false;
      if (filters.department !== 'all' && i.department?.name !== filters.department) return false;
      if (filters.radiusKm && i.distanceKm != null && i.distanceKm > filters.radiusKm) return false;
      if (sinceMs != null && i.createdAt && Date.now() - new Date(i.createdAt).getTime() > sinceMs) return false;
      if (filters.verifiedOnly && !['verified', 'resolved', 'closed'].includes(i.status)) return false;
      if (filters.aiVerifiedOnly && !i.verification?.aiVerified) return false;
      if (filters.emergencyOnly && i.priority !== 'emergency' && i.priority !== 'critical' && !i.isUrgent) return false;
      return true;
    });
  }, [issues, filters]);

  const selectedIssue = selectedIssueId ? issues.find((i) => i.id === selectedIssueId) ?? null : null;

  const handleSearchSelect = useCallback((sel: SearchSelection) => {
    if (sel.kind === 'place' && sel.lat != null && sel.lng != null) {
      setFlyTo({ lat: sel.lat, lng: sel.lng, zoom: 16 });
    } else if (sel.kind === 'issue' && sel.issueId) {
      const found = issues.find((i) => i.id === sel.issueId);
      if (found && found.lat != null && found.lng != null) {
        setSelectedIssueId(found.id);
        setFlyTo({ lat: found.lat, lng: found.lng, zoom: 16 });
      } else {
        api
          .get(`/issues/${sel.issueId}`)
          .then(({ data }) => {
            const item = data?.data || data;
            if (item?.id) {
              const mi = toMapIssue(item);
              setIssues((prev) => (prev.some((x) => x.id === mi.id) ? prev : [mi, ...prev]));
              setSelectedIssueId(mi.id);
              if (mi.lat != null && mi.lng != null) setFlyTo({ lat: mi.lat, lng: mi.lng, zoom: 16 });
            }
          })
          .catch(() => {});
      }
    } else if (sel.kind === 'department' && sel.name) {
      setFilters((f) => ({ ...f, department: sel.name ?? 'all' }));
      setFiltersOpen(true);
    }
  }, [issues]);

  const gpsPill = (() => {
    switch (gpsState) {
      case 'active':
        return { cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500 animate-pulse', text: 'GPS Active' };
      case 'acquiring':
        return { cls: 'text-slate-500 bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400 animate-pulse', text: 'Acquiring GPS...' };
      case 'denied':
        return { cls: 'text-red-600 bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500', text: 'Location blocked' };
      case 'unavailable':
        return { cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500', text: 'No GPS support' };
      case 'error':
        return { cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500', text: 'GPS unavailable' };
      default:
        return { cls: 'text-slate-500 bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400', text: 'GPS idle' };
    }
  })();

  const overlayToggles: { key: keyof OverlayState; label: string; icon: React.ReactNode }[] = [
    { key: 'heatmap', label: 'Heatmap', icon: <FireIcon className="w-3.5 h-3.5" /> },
    { key: 'riskZones', label: 'Risk Zones', icon: <ShieldExclamationIcon className="w-3.5 h-3.5" /> },
    { key: 'predicted', label: 'AI Predicted', icon: <SparklesIcon className="w-3.5 h-3.5" /> },
    { key: 'duplicates', label: 'Duplicates', icon: <BoltIcon className="w-3.5 h-3.5" /> },
    { key: 'community', label: 'Community', icon: <UsersIcon className="w-3.5 h-3.5" /> },
  ];

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="p-4 md:p-5 pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`${theme.gradient} rounded-xl p-2.5 text-white`}>
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Live GPS Map</h1>
                  <p className="text-xs text-slate-500">
                    {loading ? 'Loading...' : `${filteredIssues.length} issues in view`}
                    {lastSync && !loading && ` · synced ${new Date(lastSync).toLocaleTimeString()}`}
                    {!isConnected && !loading && ' · ⚠ live sync off'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${gpsPill.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${gpsPill.dot}`} /> {gpsPill.text}
                </span>
                {compassHeading != null && (
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full" title="Compass heading">
                    <span className="inline-block transition-transform duration-200" style={{ transform: `rotate(${compassHeading}deg)` }}>🧭</span>
                    {compassHeading}°
                  </span>
                )}
                <span className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${isConnected ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {isConnected ? 'Live' : 'Polling'}
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="mt-3 max-w-2xl">
              <MapSearchBox onSelect={handleSearchSelect} onLoadingChange={setSearchLoading} />
            </div>

            {/* GPS address + banners */}
            <AnimatePresence>
              {userAddress && gpsState === 'active' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-full px-3 py-1 border border-slate-200 dark:border-slate-700"
                >
                  <MapPinIcon className="w-3 h-3 text-emerald-500" /> {userAddress}
                </motion.div>
              )}
              {gpsState === 'denied' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="mt-2 flex items-center gap-2 text-[11px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2"
                >
                  <span className="flex-1">{gpsErrorMsg} Tap the 🔒 icon in your browser address bar → Location → Allow, then retry.</span>
                  <button onClick={() => { watchStartedRef.current = false; startWatch(); }} className="font-semibold text-red-700 dark:text-red-300 hover:underline shrink-0">Retry GPS</button>
                </motion.div>
              )}
              {gpsState === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="mt-2 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2"
                >
                  <span className="flex-1">{gpsErrorMsg} Showing city-wide view instead.</span>
                  <button onClick={() => { watchStartedRef.current = false; startWatch(); }} className="font-semibold hover:underline shrink-0">Retry GPS</button>
                </motion.div>
              )}
              {offline && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="mt-2 flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2"
                >
                  <WifiIcon className="w-3.5 h-3.5" />
                  <span>You are offline. Map shows last synced data.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Map */}
          <div className="flex-1 px-4 md:px-5 pb-4 min-h-0">
            <div
              id="live-map-container"
              className="relative rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              style={{ minHeight: 'calc(100vh - 17rem)', width: '100%', height: fullscreen ? '100vh' : undefined }}
            >
              {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Loading map data...</p>
                  </div>
                </div>
              ) : dataError ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-500 text-sm font-medium">{dataError}</p>
                    <button onClick={() => { setDataError(null); setLoading(true); initialLoad().finally(() => setLoading(false)); }} className="mt-2 text-xs text-emerald-600 hover:underline">Retry</button>
                  </div>
                </div>
              ) : (
                <Suspense fallback={
                  <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">Loading map...</div>
                }>
                  <DynamicMapView
                    center={center}
                    issues={filteredIssues}
                    userPosition={userPosition}
                    userAccuracy={userAccuracy}
                    darkMode={darkMode}
                    overlays={overlays}
                    heatData={heatData}
                    riskZones={riskZones}
                    hotspots={hotspots}
                    duplicatePoints={duplicatePoints}
                    communityHealth={communityHealth}
                    selectedIssueId={selectedIssueId}
                    onIssueClick={(id) => setSelectedIssueId(id || null)}
                    flyTo={flyTo}
                    onFlyToConsumed={() => setFlyTo(null)}
                    distanceMode={distanceMode}
                    onToggleDistanceMode={() => setDistanceMode((d) => !d)}
                  />
                </Suspense>
              )}

              {/* Filters panel */}
              <MapFiltersPanel
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                filters={filters}
                onChange={setFilters}
                departments={departments}
                activeCount={filteredIssues.length}
              />

              {/* Overlays menu */}
              <AnimatePresence>
                {overlaysOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-2 right-14 z-[1100] w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1 pb-1.5">AI Overlays</p>
                    {overlayToggles.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setOverlays((o) => ({ ...o, [t.key]: !o[t.key] }))}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                      >
                        <span className="flex items-center gap-1.5">{t.icon} {t.label}</span>
                        <span className={`w-8 h-[18px] rounded-full transition-colors flex items-center px-0.5 ${overlays[t.key] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          <span className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${overlays[t.key] ? 'translate-x-[18px]' : ''}`} />
                        </span>
                      </button>
                    ))}
                    <div className="mt-1 pt-1.5 border-t border-slate-200 dark:border-slate-700 px-2">
                      <span className="text-[9px] text-slate-400">Powered by AI · risk, hotspots, duplicates</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FABs */}
              <div className="absolute right-2 top-2 z-[1000] flex flex-col gap-2">
                <button onClick={() => setFiltersOpen((o) => !o)} className="w-9 h-9 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition-all border border-slate-200 dark:border-slate-700" title="Filters">
                  <FunnelIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setOverlaysOpen((o) => !o)} className={`w-9 h-9 rounded-xl backdrop-blur shadow-lg flex items-center justify-center hover:scale-105 transition-all border ${Object.values(overlays).some(Boolean) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'}`} title="AI Overlays">
                  <SparklesIcon className="w-4 h-4" />
                </button>
                <button onClick={toggleFullscreen} className="w-9 h-9 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition-all border border-slate-200 dark:border-slate-700" title="Fullscreen">
                  {fullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
                </button>
                <button onClick={() => setDistanceMode((d) => !d)} className={`w-9 h-9 rounded-xl backdrop-blur shadow-lg flex items-center justify-center hover:scale-105 transition-all border ${distanceMode ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'}`} title="Measure distance">
                  <ScaleIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => userPosition && setFlyTo({ lat: userPosition[0], lng: userPosition[1], zoom: 16 })}
                  className={`w-9 h-9 rounded-xl backdrop-blur shadow-lg flex items-center justify-center hover:scale-105 transition-all border ${userPosition ? 'bg-white/95 dark:bg-slate-800/95 text-emerald-600 border-slate-200 dark:border-slate-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 border-slate-200 dark:border-slate-700 cursor-not-allowed'}`}
                  title="Recenter on me"
                >
                  <ViewfinderCircleIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom-left info */}
              <div className="absolute bottom-3 left-2 z-[1000] flex flex-col gap-1.5">
                {searchLoading && (
                  <span className="text-[10px] text-slate-500 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg px-2.5 py-1 shadow">Searching...</span>
                )}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl px-3 py-2 text-[10px] shadow-lg max-h-[30vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Legend</p>
                  <div className="grid grid-cols-1 gap-1">
                    {[['New', '#3b82f6'], ['Verifying', '#a855f7'], ['Assigned', '#f97316'], ['Working', '#eab308'], ['AI Check', '#06b6d4'], ['Confirm', '#34d399'], ['Resolved', '#10b981'], ['Closed', '#6b7280']].map(([label, color]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-slate-600 dark:text-slate-400">{label}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full border border-red-500 animate-pulse" />
                      <span className="text-slate-600 dark:text-slate-400">High risk / urgent</span>
                    </div>
                    {overlays.duplicates && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        <span className="text-slate-600 dark:text-slate-400">Possible duplicate</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* List drawer */}
              <AnimatePresence>
                {showList && (
                  <motion.div
                    initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
                    className="absolute bottom-2 left-2 z-[1100] w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Issues List ({filteredIssues.length})</p>
                      <button onClick={() => setShowList(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[40vh]">
                      {filteredIssues.length === 0 ? (
                        <p className="text-xs text-slate-400 p-4">No issues match filters</p>
                      ) : (
                        filteredIssues.slice(0, 100).map((i) => (
                          <button
                            key={i.id}
                            onClick={() => { setSelectedIssueId(i.id); setShowList(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-start gap-2"
                          >
                            <span className="text-sm leading-none mt-0.5">{categoryEmoji(i.category)}</span>
                            <span className="min-w-0">
                              <span className="block text-[11px] font-medium text-slate-800 dark:text-slate-100 truncate">{i.title}</span>
                              <span className="block text-[9px] text-slate-400">
                                {statusLabel(i.status)} · {priorityLabel(i.priority)}
                                {i.distanceKm != null && ` · ${formatDistance(i.distanceKm)}`}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* List toggle button */}
              <button
                onClick={() => setShowList((s) => !s)}
                className="absolute bottom-2 right-2 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:scale-105 transition-all border border-slate-200 dark:border-slate-700"
              >
                {showList ? <Squares2X2Icon className="w-3.5 h-3.5" /> : <ListBulletIcon className="w-3.5 h-3.5" />}
                {filteredIssues.length}
              </button>

              {/* Detail panel */}
              <AnimatePresence>
                {selectedIssue && <IssueDetailPanel issue={selectedIssue} onClose={() => setSelectedIssueId(null)} />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
