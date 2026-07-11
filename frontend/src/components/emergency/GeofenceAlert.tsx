'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface AlertData {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  distance: string;
  latitude: number;
  longitude: number;
}

export default function GeofenceAlert() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const lastPos = { lat: 0, lng: 0 };

    const checkProximity = async (lat: number, lng: number) => {
      if (cancelled) return;
      try {
        const { data } = await api.get(
          `/emergency/proximity-check?latitude=${lat}&longitude=${lng}&radius=0.5`
        );
        const items = data?.data || data?.alerts || data || [];
        const activeAlerts = Array.isArray(items)
          ? items.filter((a: any) => !dismissedIds.has(a.id || a._id))
          : [];
        if (!cancelled) setAlerts(activeAlerts as AlertData[]);
      } catch {
        // Silently fail
      }
    };

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          lastPos.lat = pos.coords.latitude;
          lastPos.lng = pos.coords.longitude;
          checkProximity(lastPos.lat, lastPos.lng);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }

    intervalRef.current = setInterval(() => {
      if (lastPos.lat && lastPos.lng) {
        checkProximity(lastPos.lat, lastPos.lng);
      }
    }, 30000);

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [dismissedIds]);

  const dismissAlert = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const getDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const activeAlert = alerts.length > 0 ? alerts[0] : null;

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center"
        >
          {/* Pulsing red background */}
          <motion.div
            className="absolute inset-0 bg-red-600"
            animate={{ opacity: [0.85, 0.7, 0.85] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Alert card */}
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 border-2 border-red-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold font-heading text-slate-900 dark:text-white">Emergency Alert</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    activeAlert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    activeAlert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {activeAlert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{activeAlert.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{activeAlert.description}</p>

            <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
              <MapPinIcon className="w-4 h-4" />
              <span>{activeAlert.distance} from your location</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => getDirections(activeAlert.latitude, activeAlert.longitude)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Get Directions
              </button>
              <button
                onClick={() => dismissAlert(activeAlert.id)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-xl transition-colors flex items-center gap-1.5"
              >
                <XMarkIcon className="w-4 h-4" /> Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
