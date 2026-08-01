'use client';
import { useEffect, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { statusLabel, categoryLabel, formatRelativeTime, formatDistance, STATUS_META, haversineKm } from '@/lib/map-data';

export interface MapIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  riskScore: number | null;
  communityScore: number | null;
  upvotes: number;
  downvotes: number;
  isUrgent: boolean;
  completionPercentage: number | null;
  createdAt: string;
  address: string;
  ward: string | null;
  pincode: string | null;
  department: { id: string; name: string; code?: string } | null;
  reporter: { id: string; name: string } | null;
  aiAnalysis: {
    severity: string | null;
    summary: string | null;
    duplicateProbability: number | null;
    fakeProbability: number | null;
    recommendedDepartment: string | null;
  } | null;
  verification: {
    aiVerified: boolean;
    aiConfidence: number | null;
    citizenConfirmed: boolean | null;
  } | null;
}

export interface RiskZone {
  lat: number;
  lng: number;
  category: string;
  avgRisk: number;
  issueCount: number;
}

export interface OverlayState {
  heatmap: boolean;
  riskZones: boolean;
  predicted: boolean;
  duplicates: boolean;
  community: boolean;
}

interface MapViewProps {
  center: [number, number];
  issues: MapIssue[];
  userPosition: [number, number] | null;
  userAccuracy: number | null;
  darkMode: boolean;
  overlays: OverlayState;
  heatData: [number, number, number][];
  riskZones: RiskZone[];
  hotspots: { lat: number; lng: number; predictedRisk: number; issueCount: number }[];
  duplicatePoints: { id: string; title: string; lat: number; lng: number; similarCount: number }[];
  communityHealth: { lat: number; lng: number; avgCommunity: number; issueCount: number }[];
  selectedIssueId: string | null;
  onIssueClick: (id: string) => void;
  flyTo: { lat: number; lng: number; zoom?: number } | null;
  onFlyToConsumed: () => void;
  distanceMode: boolean;
  onToggleDistanceMode: () => void;
}

export const DynamicMapView = dynamic<MapViewProps>(
  async () => {
    await import('leaflet/dist/leaflet.css');
    await import('leaflet.markercluster/dist/MarkerCluster.css');
    await import('leaflet.markercluster/dist/MarkerCluster.Default.css');
    const { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents, ZoomControl } =
      await import('react-leaflet');
    const MarkerClusterGroup = (await import('react-leaflet-cluster')).default;
    const L = (await import('leaflet')).default;
    await import('leaflet.heat');

    delete (L.Icon.Default.prototype as any)._getIconUrl;

    const statusHexCache: Record<string, string> = {};
    function statusHex(status: string): string {
      if (!statusHexCache[status]) {
        statusHexCache[status] = STATUS_META[status]?.hex || '#6b7280';
      }
      return statusHexCache[status];
    }

    function pinIcon(L: typeof import('leaflet'), issue: MapIssue) {
      const color = statusHex(issue.status);
      const highRisk = (issue.riskScore ?? 0) > 70;
      const urgent = issue.isUrgent || issue.priority === 'emergency' || issue.priority === 'critical';
      const glow = highRisk || urgent
        ? `<circle cx="14" cy="14" r="22" fill="${urgent ? '#ef4444' : color}" opacity="0.18"><animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.25;0.08;0.25" dur="2s" repeatCount="indefinite"/></circle>`
        : '';
      return L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
          ${glow}
          <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}"/>
          <circle cx="14" cy="13" r="6" fill="white" opacity="0.9"/>
          ${urgent ? `<circle cx="14" cy="13" r="6" fill="none" stroke="#ef4444" stroke-width="1.5"><animate attributeName="r" values="6;9;6" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/></circle>` : ''}
        </svg>`,
        className: '',
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        popupAnchor: [0, -40],
      });
    }

    function userMarkerIcon(L: typeof import('leaflet')) {
      return L.divIcon({
        html: `<div style="position:relative;width:22px;height:22px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.3);animation:user-pulse 2s ease-in-out infinite;"></div>
          <div style="position:absolute;top:5px;left:5px;width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>
          <style>@keyframes user-pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(2.4);opacity:0}}</style>
        </div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
    }

    function clusterIcon(L: typeof import('leaflet'), count: number, avgRisk: number) {
      const color = avgRisk >= 70 ? '#dc2626' : avgRisk >= 50 ? '#f97316' : '#10b981';
      return L.divIcon({
        html: `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.9;box-shadow:0 2px 10px ${color}66, inset 0 0 0 4px #ffffff33;"></div>
          <span style="position:relative;color:white;font-weight:800;font-size:13px;font-family:ui-sans-serif,system-ui;">${count}</span>
        </div>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
    }

    function duplicateIcon(L: typeof import('leaflet')) {
      return L.divIcon({
        html: `<div style="width:26px;height:26px;border-radius:50%;background:#ef4444;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(239,68,68,0.6);">🔁</div>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    }

    function hotspotIcon(L: typeof import('leaflet'), risk: number) {
      const color = risk >= 80 ? '#dc2626' : '#f97316';
      return L.divIcon({
        html: `<div style="position:relative;width:34px;height:34px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.35;animation:user-pulse 1.8s ease-in-out infinite;"></div>
          <div style="position:absolute;top:6px;left:6px;width:22px;height:22px;border-radius:50%;background:${color};border:2.5px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">⚠</div>
        </div>`,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
    }

    function communityIcon(L: typeof import('leaflet'), score: number) {
      const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#64748b';
      return L.divIcon({
        html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${score >= 70 ? '✓' : score >= 40 ? '~' : '!'}</div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }

    function FlyToController({ flyTo, onConsumed }: { flyTo: MapViewProps['flyTo']; onConsumed: () => void }) {
      const map = useMap();
      useEffect(() => {
        if (flyTo) {
          map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? 15, { duration: 1.2 });
          onConsumed();
        }
      }, [flyTo, map, onConsumed]);
      return null;
    }

    function DistanceTool() {
      const map = useMap();
      const [start, setStart] = useState<[number, number] | null>(null);
      const [end, setEnd] = useState<[number, number] | null>(null);
      const [distance, setDistance] = useState<string>('');

      const { haversine } = { haversine: haversineKm };

      useMapEvents({
        click(e) {
          if (!start) {
            setStart([e.latlng.lat, e.latlng.lng]);
            setEnd(null);
          } else if (!end) {
            setEnd([e.latlng.lat, e.latlng.lng]);
            if (haversine) setDistance(haversine(start[0], start[1], e.latlng.lat, e.latlng.lng).toString());
          }
        },
      });

      const clear = useCallback(() => { setStart(null); setEnd(null); setDistance(''); }, []);

      return (
        <>
          {start && (
            <Circle center={start} radius={6} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 1 }} />
          )}
          {start && end && (
            <Polyline positions={[start, end]} pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '8 6' }} />
          )}
          {start && end && (
            <Marker position={[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]}>
              <Popup>
                <div className="p-1 text-xs font-semibold text-slate-900">Distance: {distance} km</div>
              </Popup>
            </Marker>
          )}
          {start && (
            <button
              onClick={clear}
              className="absolute bottom-16 left-2 z-[1000] bg-white dark:bg-slate-800 text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg text-slate-700 dark:text-slate-300"
            >
              {end ? 'Clear measurement' : `Click second point on map`}
            </button>
          )}
        </>
      );
    }

    function HeatLayerView({ data }: { data: [number, number, number][] }) {
      const map = useMap();
      useEffect(() => {
        if (!data.length || !(L as any).heatLayer) return;
        const layer = (L as any).heatLayer(data, {
          radius: 28,
          blur: 22,
          maxZoom: 16,
          minOpacity: 0.35,
          gradient: { 0.2: '#22c55e', 0.45: '#eab308', 0.7: '#f97316', 1: '#dc2626' },
        });
        layer.addTo(map);
        return () => { map.removeLayer(layer); };
      }, [map, data]);
      return null;
    }

    function MapInner(props: MapViewProps) {
      const {
        center, issues, userPosition, userAccuracy, darkMode, overlays,
        heatData, riskZones, hotspots, duplicatePoints, communityHealth,
        selectedIssueId, onIssueClick, flyTo, onFlyToConsumed, distanceMode,
      } = props;

      const tileUrl = darkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const tileAttribution = darkMode
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

      return (
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          zoomControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomControl position="bottomright" />
          <TileLayer attribution={tileAttribution} url={tileUrl} />

          {overlays.heatmap && <HeatLayerView data={heatData} />}

          {overlays.community &&
            communityHealth.map((c, i) => (
              <Marker key={`c-${i}`} position={[c.lat, c.lng]} icon={communityIcon(L, c.avgCommunity)}>
                <Popup>
                  <div className="p-1 min-w-[140px]">
                    <p className="text-xs font-semibold text-slate-900">Community Health</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Score: {c.avgCommunity}/100 · {c.issueCount} issues</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {overlays.predicted &&
            hotspots.map((h, i) => (
              <Marker key={`h-${i}`} position={[h.lat, h.lng]} icon={hotspotIcon(L, h.predictedRisk)}>
                <Popup>
                  <div className="p-1 min-w-[150px]">
                    <p className="text-xs font-semibold text-red-600">Predicted High-Risk Area</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Predicted risk: {h.predictedRisk}/100</p>
                    <p className="text-[11px] text-slate-600">{h.issueCount} existing issues</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {overlays.riskZones &&
            riskZones.map((z, i) => (
              <Circle
                key={`r-${i}`}
                center={[z.lat, z.lng]}
                radius={600 + z.issueCount * 120}
                pathOptions={{
                  color: z.avgRisk >= 70 ? '#dc2626' : '#f97316',
                  fillColor: z.avgRisk >= 70 ? '#dc2626' : '#f97316',
                  fillOpacity: Math.min(0.45, 0.15 + z.avgRisk / 300),
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[150px]">
                    <p className="text-xs font-semibold text-slate-900">Risk Zone · {categoryLabel(z.category)}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Avg risk: {z.avgRisk}/100 · {z.issueCount} issues</p>
                  </div>
                </Popup>
              </Circle>
            ))}

          {overlays.duplicates &&
            duplicatePoints.map((d) => (
              <Marker key={`d-${d.id}`} position={[d.lat, d.lng]} icon={duplicateIcon(L)}>
                <Popup>
                  <div className="p-1 min-w-[160px]">
                    <p className="text-[11px] font-semibold text-red-600">Possible Duplicate</p>
                    <p className="text-xs text-slate-900 mt-0.5">{d.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{d.similarCount} similar nearby</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {userPosition && (
            <>
              {userAccuracy != null && userAccuracy < 3000 && (
                <Circle
                  center={userPosition}
                  radius={userAccuracy}
                  pathOptions={{ color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.08, dashArray: '4 4' }}
                />
              )}
              <Marker position={userPosition} icon={userMarkerIcon(L)}>
                <Popup>
                  <div className="p-1 min-w-[150px]">
                    <p className="text-xs font-semibold text-blue-700">Your Location</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {userPosition[0].toFixed(6)}, {userPosition[1].toFixed(6)}
                    </p>
                    {userAccuracy != null && (
                      <p className="text-[11px] text-slate-500">Accuracy: ±{Math.round(userAccuracy)} m</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={55}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            zoomToBoundsOnClick
            iconCreateFunction={(cluster: any) => {
              const markers = cluster.getAllChildMarkers();
              const avgRisk = markers.length
                ? markers.reduce((s: number, m: any) => s + (m.options.avgRisk || 0), 0) / markers.length
                : 0;
              return clusterIcon(L, markers.length, avgRisk);
            }}
          >
            {issues
              .filter((i) => i.lat != null && i.lng != null)
              .map((issue) => {
                const icon = pinIcon(L, issue);
                (icon.options as any).avgRisk = issue.riskScore ?? 0;
                const selected = selectedIssueId === issue.id;
                return (
                  <Marker
                    key={issue.id}
                    position={[issue.lat as number, issue.lng as number]}
                    icon={icon}
                    zIndexOffset={selected ? 1000 : 0}
                    eventHandlers={{ click: () => onIssueClick(issue.id) }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[200px]">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-slate-900 leading-snug">{issue.title}</p>
                          {issue.priority === 'emergency' && (
                            <span className="text-[9px] font-bold text-white bg-red-600 rounded-full px-1.5 py-0.5 shrink-0">EMERGENCY</span>
                          )}
                        </div>
                        {issue.address && <p className="text-[11px] text-slate-500 mt-0.5 truncate">📍 {issue.address}</p>}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {statusLabel(issue.status)}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                            {issue.priority}
                          </span>
                          {issue.verification?.aiVerified && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              ✓ AI Verified
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                          {issue.distanceKm != null && <span>📏 {formatDistance(issue.distanceKm)}</span>}
                          <span>🕒 {formatRelativeTime(issue.createdAt)}</span>
                        </div>
                        <button
                          onClick={() => onIssueClick(issue.id)}
                          className="w-full mt-2 py-1.5 text-[11px] font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:opacity-90 transition"
                        >
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MarkerClusterGroup>

          {distanceMode && <DistanceTool />}
          <FlyToController flyTo={flyTo} onConsumed={onFlyToConsumed} />
        </MapContainer>
      );
    }

    return { default: MapInner };
  },
  { ssr: false }
);
