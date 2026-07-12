'use client';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Alert { id: string; title: string; severity: string; type: string; description?: string; }

export default function EmergencyAlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get('/emergency/alerts/active').then(({ data }) => {
      const raw = data?.data || data;
      setAlerts(Array.isArray(raw) ? raw : []);
    }).catch(() => {});
  }, []);

  if (dismissed || alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 text-white px-4 py-2 flex items-center justify-between relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] animate-pulse" />
      <div className="flex items-center gap-3 relative z-10">
        <ExclamationTriangleIcon className="w-5 h-5 animate-bounce flex-shrink-0" />
        <div className="text-sm font-semibold">
          <span className="animate-pulse">EMERGENCY ALERT</span>
          <span className="ml-2 font-normal opacity-90">
            {alerts.length} active emergency{alerts.length > 1 ? 's' : ''} — {alerts[0]?.title}
          </span>
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 rounded-lg hover:bg-white/20 transition-colors relative z-10">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
