'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneIcon, XMarkIcon, MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'severe' | 'extreme';
  type: string;
  distance: number;
  distanceText: string;
  latitude: number;
  longitude: number;
  radius?: number;
  safetyInstructions?: string;
  createdAt: string;
  aiCritical?: boolean;
  aiConfidence?: number;
}

let sharedCtx: AudioContext | null = null;
let audioUnlockBound = false;

function getSharedContext(): AudioContext | null {
  if (!sharedCtx) {
    try {
      sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      sharedCtx = null;
    }
  }
  return sharedCtx;
}

function resumeSharedContext() {
  try {
    if (sharedCtx && sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch(() => {});
    }
  } catch { /* silent */ }
}

function resumeWhenVisible() {
  try {
    if (document.visibilityState === 'visible') resumeSharedContext();
  } catch { /* silent */ }
}

function bindAudioUnlock() {
  if (audioUnlockBound) return;
  audioUnlockBound = true;
  const unlock = () => {
    getSharedContext();
    resumeSharedContext();
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('touchstart', unlock);
  document.addEventListener('keydown', unlock);
}

function prepareAudio() {
  try {
    bindAudioUnlock();
    getSharedContext();
    resumeSharedContext();
  } catch { /* silent */ }
}

function playAlertTone() {
  stopAlertTone();
  try {
    const ctx = getSharedContext();
    if (!ctx) return;
    bindAudioUnlock();
    resumeSharedContext();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.03);
    master.connect(ctx.destination);
    let stopped = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const oscs: OscillatorNode[] = [];

    const playPattern = () => {
      if (stopped) return;
      const t0 = ctx.currentTime + 0.05;
      const notes = [
        { freq: 740.0, start: 0, dur: 0.35 },
        { freq: 1180.0, start: 0.4, dur: 0.35 },
      ];
      notes.forEach((n) => {
        try {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(n.freq, t0 + n.start);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.0001, t0 + n.start);
          gain.gain.exponentialRampToValueAtTime(0.9, t0 + n.start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.start + n.dur);
          osc.connect(gain);
          gain.connect(master);
          osc.start(t0 + n.start);
          osc.stop(t0 + n.start + n.dur + 0.05);
          oscs.push(osc);
        } catch { /* silent */ }
      });
      timers.push(setTimeout(playPattern, 800));
    };
    playPattern();

    const resumeTimer = setInterval(resumeSharedContext, 500);
    window.addEventListener('focus', resumeWhenVisible);
    document.addEventListener('visibilitychange', resumeWhenVisible);

    toneRef.current = {
      stop: () => {
        if (stopped) return;
        stopped = true;
        clearInterval(resumeTimer);
        window.removeEventListener('focus', resumeWhenVisible);
        document.removeEventListener('visibilitychange', resumeWhenVisible);
        timers.forEach((t) => clearTimeout(t));
        oscs.forEach((o) => { try { o.stop(); } catch { /* silent */ } });
        try { master.disconnect(); } catch { /* silent */ }
      },
    };
    if (ctx.state === 'running') {
      console.info('[emergency] danger siren started (audio running)');
    } else {
      console.info('[emergency] danger siren scheduled; audio blocked by browser until first interaction');
    }
  } catch (e) {
    console.warn('[emergency] danger siren failed', e);
  }
}

function stopAlertTone() {
  if (toneRef.current) {
    try { toneRef.current.stop(); } catch { /* silent */ }
    toneRef.current = null;
  }
}

const toneRef = { current: null as null | { stop: () => void } };

export default function GeofenceAlert() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  const checkProximity = useCallback(async (lat: number, lng: number) => {
    try {
      const { data } = await api.get(
        `/emergency/ai-proximity-check?latitude=${lat}&longitude=${lng}&radius=2`
      );
      const body = data?.data || data || {};
      const items = body.alerts || [];
      const activeAlerts: EmergencyAlert[] = Array.isArray(items)
        ? items
            .filter((a: any) => !dismissedIds.has(a.id || a._id))
            .map((a: any) => ({
              id: a.id || a._id || '',
              title: a.title || 'Emergency Alert',
              description: a.description || '',
              severity: a.severity || 'high',
              type: a.type || 'emergency',
              distance: typeof a.distance === 'number' ? a.distance : 0,
              distanceText: typeof a.distance === 'number'
                ? `${(a.distance * 1000).toFixed(0)}m away`
                : 'Distance unknown',
              latitude: a.latitude || a.lat || 0,
              longitude: a.longitude || a.lng || 0,
              radius: a.radius || 500,
              safetyInstructions: a.safetyInstructions || a.description || '',
              createdAt: a.createdAt || new Date().toISOString(),
              aiCritical: a.aiCritical === true,
              aiConfidence: typeof a.aiConfidence === 'number' ? a.aiConfidence : 0,
            }))
        : [];
      setAlerts(activeAlerts);

      const critical = body.criticalAlert || null;
      if (
        critical &&
        critical.aiCritical === true &&
        !dismissedIds.has(critical.id || critical._id) &&
        !showFullScreen
      ) {
        setShowFullScreen(true);
        setCountdown(30);
      }
    } catch { /* silent */ }
  }, [dismissedIds, showFullScreen]);

  useEffect(() => {
    prepareAudio();
    if (!('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        checkProximity(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    intervalRef.current = setInterval(() => {
      const { lat, lng } = lastPosRef.current;
      if (lat && lng) checkProximity(lat, lng);
    }, 30000);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      stopAlertTone();
    };
  }, [checkProximity]);

  useEffect(() => {
    if (!showFullScreen) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showFullScreen]);

  const wasAlertShownRef = useRef(false);
  useEffect(() => {
    const shown = showFullScreen && alerts.length > 0;
    if (shown && !wasAlertShownRef.current) {
      playAlertTone();
    } else if (!shown) {
      stopAlertTone();
    }
    wasAlertShownRef.current = shown;
  }, [showFullScreen, alerts]);

  const dismissAlert = (id: string) => {
    stopAlertTone();
    setDismissedIds((prev) => new Set(prev).add(id));
    const remaining = alerts.filter((a) => a.id !== id);
    setAlerts(remaining);
    if (remaining.length === 0) setShowFullScreen(false);
  };

  const dismissFullScreen = () => {
    stopAlertTone();
    if (alerts.length > 0) dismissAlert(alerts[0].id);
    setShowFullScreen(false);
  };

  const getDirections = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const activeAlert = alerts.length > 0 ? alerts[0] : null;

  const severityStyles: Record<string, { ring: string; label: string; pulse: string }> = {
    low:      { ring: 'ring-yellow-400',  label: 'LOW',      pulse: 'from-yellow-500 to-amber-600' },
    moderate: { ring: 'ring-orange-400',  label: 'MODERATE',  pulse: 'from-orange-500 to-red-500' },
    high:     { ring: 'ring-red-400',     label: 'HIGH',      pulse: 'from-red-500 to-red-600' },
    severe:   { ring: 'ring-red-500',     label: 'SEVERE',    pulse: 'from-red-600 to-red-700' },
    extreme:  { ring: 'ring-red-700',     label: 'EXTREME',   pulse: 'from-red-700 to-red-800' },
  };

  return (
    <AnimatePresence>
      {/* Full-Screen Emergency Mode */}
      {showFullScreen && activeAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-red-900 via-red-700 to-red-900"
            animate={{ opacity: [0.85, 0.6, 0.85] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 bg-red-600/20"
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />

          <div className="relative z-10 max-w-lg w-full mx-4 text-center text-white">
            {/* Danger Icon */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="mx-auto mb-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-red-500/30 flex items-center justify-center ring-4 ring-red-400 ring-offset-4 ring-offset-red-900">
                <ExclamationTriangleIcon className="w-14 h-14 text-white" />
              </div>
            </motion.div>

            {/* Alert Title */}
            <motion.h1
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-3xl font-black uppercase tracking-wider mb-2"
            >
              EMERGENCY ALERT
            </motion.h1>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 mb-4">
              {activeAlert.severity.toUpperCase()} SEVERITY
            </span>

            <h2 className="text-xl font-bold mb-2">{activeAlert.title}</h2>
            <p className="text-sm text-red-100 mb-4 max-w-md mx-auto">{activeAlert.description}</p>

            {/* Distance */}
            <div className="flex items-center justify-center gap-2 text-sm text-red-200 mb-4">
              <MapPinIcon className="w-4 h-4" />
              <span>{activeAlert.distanceText}</span>
              {activeAlert.radius && (
                <span className="text-xs text-red-300">(Danger zone: {activeAlert.radius}m)</span>
              )}
            </div>

            {/* Safety Instructions */}
            {activeAlert.safetyInstructions && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-red-200 mb-2">Safety Instructions</p>
                <p className="text-sm text-white leading-relaxed">{activeAlert.safetyInstructions}</p>
              </div>
            )}

            {/* Countdown */}
            <div className="mb-6">
              <p className="text-xs text-red-200 mb-1">Auto-dismiss in</p>
              <motion.span
                key={countdown}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="text-2xl font-mono font-black"
              >
                {countdown}s
              </motion.span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors text-sm shadow-lg"
              >
                <PhoneIcon className="w-5 h-5" />
                Dial 112
              </a>
              <button
                onClick={() => activeAlert && getDirections(activeAlert.latitude, activeAlert.longitude)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-colors text-sm backdrop-blur-sm"
              >
                <MapPinIcon className="w-5 h-5" />
                Get Directions
              </button>
              <button
                onClick={dismissFullScreen}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm backdrop-blur-sm"
              >
                <XMarkIcon className="w-5 h-5" />
                Dismiss Alert
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Banner Alert (non-fullscreen) */}
      {!showFullScreen && activeAlert && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9998] p-4"
        >
          <div className="max-w-2xl mx-auto bg-red-600 text-white rounded-xl shadow-2xl p-4 flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="flex-shrink-0"
            >
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-300" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{activeAlert.title}</p>
              <p className="text-xs text-red-100 truncate">{activeAlert.distanceText} - {activeAlert.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowFullScreen(true)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition"
              >
                Details
              </button>
              <button
                onClick={() => dismissAlert(activeAlert.id)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
