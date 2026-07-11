'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  MapIcon, Squares2X2Icon, ListBulletIcon, MapPinIcon, ViewfinderCircleIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { getCategoryIcon, getStatusColor } from '@/lib/utils';

const filterCategories = ['All', 'Road Damage', 'Water Leakage', 'Garbage', 'Electricity', 'Drainage', 'Safety'];

const catToInternal: Record<string, string> = {
  'Road Damage': 'road_damage',
  'Water Leakage': 'water_leakage',
  'Garbage': 'garbage',
  'Electricity': 'electricity',
  'Drainage': 'drainage',
  'Safety': 'public_safety',
};

const mockMapIssues = [
  { id: '1', title: 'Broken streetlight', category: 'street_lighting', status: 'in_progress', priority: 'high', lat: 28.6139, lng: 77.209, distance: '0.3 km' },
  { id: '2', title: 'Water leakage on road', category: 'water_leakage', status: 'verified', priority: 'critical', lat: 28.6200, lng: 77.215, distance: '0.8 km' },
  { id: '3', title: 'Garbage dump', category: 'garbage', status: 'reported', priority: 'medium', lat: 28.6080, lng: 77.200, distance: '1.2 km' },
  { id: '4', title: 'Pothole on highway', category: 'road_damage', status: 'assigned', priority: 'high', lat: 28.6250, lng: 77.218, distance: '1.5 km' },
  { id: '5', title: 'Fallen tree', category: 'environmental', status: 'community_verifying', priority: 'medium', lat: 28.6110, lng: 77.212, distance: '0.6 km' },
];

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

const priorityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

function createPinIcon(L: typeof import('leaflet'), category: string, priority: string) {
  const base = categoryMarkerColors[category];
  const fallbackColor = priorityColors[priority] || '#10b981';
  const color = base?.color || fallbackColor;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="13" r="6" fill="white" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

type Issue = typeof mockMapIssues[number];

interface LeafletMapProps {
  center: [number, number];
  issues: Issue[];
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
              icon={createPinIcon(L, issue.category, issue.priority)}
              eventHandlers={{ click: () => onIssueClick(issue.id) }}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <p className="font-semibold text-sm text-slate-900">{issue.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{issue.distance} away</p>
                  <div className="flex gap-1.5 mt-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(issue.status)}`}>
                      {issue.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      issue.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      issue.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {issue.priority}
                    </span>
                  </div>
                  <button className="w-full mt-2 py-1.5 text-[11px] font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:opacity-90 transition">
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

export default function MapPage() {
  const theme = pageThemes.map;
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const filteredIssues = activeCategory === 'All'
    ? mockMapIssues
    : mockMapIssues.filter((issue) => issue.category === catToInternal[activeCategory]);

  const handlePinClick = (id: string) => {
    setSelectedIssue(id || null);
  };

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
          {/* Map Header */}
          <div className="p-4 md:p-6 pb-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`${theme.gradient} rounded-xl p-2.5 text-white`}>
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Live Issue Map</h1>
                  <p className="text-xs text-slate-500">Real-time civic issues in your area</p>
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

          {/* Filters */}
          <div className="px-4 md:px-6 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {filterCategories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Map / List Content */}
          <div className="flex-1 px-4 md:px-6 pb-4 min-h-0">
            {viewMode === 'map' ? (
              <div className="h-full rounded-2xl overflow-hidden relative bg-slate-200 dark:bg-slate-800" style={{ minHeight: 'calc(100vh - 16rem)', width: '100%' }}>
                <Suspense fallback={
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="text-slate-500 text-sm">Loading map...</div>
                  </div>
                }>
                  <DynamicLeafletMap center={mapCenter} issues={filteredIssues} onIssueClick={handlePinClick} />
                </Suspense>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl p-3 text-xs space-y-1.5 shadow-lg">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Categories</p>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> Road Damage</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Water Leakage</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /> Garbage</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Electricity</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500" /> Drainage</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Public Safety</div>
                </div>

                {/* Issue detail card */}
                {selectedIssue && (() => {
                  const issue = mockMapIssues.find((i) => i.id === selectedIssue);
                  if (!issue) return null;
                  return (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                      className="absolute bottom-4 right-4 z-[1000] w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl p-4 shadow-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{issue.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{issue.distance} away</p>
                        </div>
                        <button onClick={() => setSelectedIssue(null)} className="text-slate-400 hover:text-slate-600">×</button>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(issue.status)}`}>{issue.status.replace(/_/g, ' ')}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${issue.priority === 'critical' ? 'bg-red-100 text-red-700' : issue.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>{issue.priority}</span>
                      </div>
                      <button className="w-full mt-3 !py-2 text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:opacity-90 transition">
                        View Details
                      </button>
                    </motion.div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIssues.map((issue, i) => (
                  <motion.div key={issue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="glass-card p-4 cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(issue.category)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{issue.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPinIcon className="w-3 h-3" />{issue.distance} away</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(issue.status)}`}>{issue.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
