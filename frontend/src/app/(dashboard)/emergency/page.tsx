'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FireIcon, ExclamationTriangleIcon, PhoneIcon, MapPinIcon,
  ClockIcon, ShieldCheckIcon, XMarkIcon, SpeakerWaveIcon,
  ArrowPathIcon, InformationCircleIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { cn } from '@/lib/utils';

const emergencyTypes = [
  { type: 'fire', label: 'Fire', icon: '🔥', color: 'from-red-500 to-orange-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  { type: 'flood', label: 'Flood', icon: '🌊', color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { type: 'gas_leak', label: 'Gas Leak', icon: '💨', color: 'from-yellow-500 to-amber-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { type: 'fallen_wire', label: 'Fallen Wire', icon: '⚡', color: 'from-purple-500 to-indigo-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { type: 'accident', label: 'Accident', icon: '🚑', color: 'from-rose-500 to-red-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { type: 'building_collapse', label: 'Collapse', icon: '🏚️', color: 'from-slate-500 to-gray-600', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  { type: 'medical', label: 'Medical', icon: '🏥', color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { type: 'natural_disaster', label: 'Disaster', icon: '🌪️', color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
];

const activeAlerts = [
  { id: '1', type: 'flood', title: 'Flash Flood Warning', area: 'Ward 14, 15 - Riverside Colony', severity: 'critical', time: '12 min ago', description: 'Water level rising rapidly. Evacuation recommended for low-lying areas.', affected: 2400 },
  { id: '2', type: 'gas_leak', title: 'Gas Leak Detected', area: 'Industrial Area, Block C', severity: 'high', time: '45 min ago', description: 'Major gas leak reported. Area cordoned. Avoid the vicinity.', affected: 800 },
];

const emergencyContacts = [
  { name: 'Fire Department', number: '101', icon: '🚒' },
  { name: 'Police', number: '100', icon: '👮' },
  { name: 'Ambulance', number: '108', icon: '🚑' },
  { name: 'Disaster Control', number: '1070', icon: '🆘' },
  { name: 'Gas Emergency', number: '1906', icon: '💨' },
  { name: 'Electricity Emergency', number: '1912', icon: '⚡' },
];

export default function EmergencyPage() {
  const theme = pageThemes.emergency;
  const [showRedAlert, setShowRedAlert] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [alertMuted, setAlertMuted] = useState(false);

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        {/* Red Alert Overlay */}
        <AnimatePresence>
          {showRedAlert && activeAlerts.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-gradient-to-b from-red-900/95 via-rose-900/95 to-orange-900/95 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                className="w-full max-w-lg text-center">
                {/* Flashing circle */}
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-28 h-28 mx-auto rounded-full bg-red-500/30 border-4 border-red-400 flex items-center justify-center mb-6">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-20 h-20 rounded-full bg-red-500/50 flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-10 h-10 text-white" />
                  </motion.div>
                </motion.div>

                <motion.h1 animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                  className="text-4xl md:text-5xl font-black text-white font-heading mb-2 tracking-tight">
                  EMERGENCY ALERT
                </motion.h1>
                <p className="text-red-200 text-lg font-semibold mb-6">{activeAlerts[0].title}</p>

                <div className="bg-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPinIcon className="w-4 h-4 text-red-300" />
                    <span className="text-red-200 text-sm font-medium">{activeAlerts[0].area}</span>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">{activeAlerts[0].description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-red-300">
                    <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{activeAlerts[0].time}</span>
                    <span>{activeAlerts[0].affected.toLocaleString()} people affected</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                  <p className="text-red-200 text-xs font-semibold mb-2 uppercase tracking-wider">Emergency Contacts</p>
                  <div className="grid grid-cols-3 gap-2">
                    {emergencyContacts.slice(0, 3).map((c) => (
                      <a key={c.number} href={`tel:${c.number}`} className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors">
                        <span className="text-2xl block mb-1">{c.icon}</span>
                        <p className="text-white text-xs font-bold">{c.number}</p>
                        <p className="text-red-300 text-[10px]">{c.name}</p>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowRedAlert(false)} className="flex-1 py-3 rounded-xl bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors text-sm">
                    Dismiss Alert
                  </button>
                  <a href="tel:112" className="flex-1 py-3 rounded-xl bg-white text-red-600 font-bold hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2">
                    <PhoneIcon className="w-4 h-4" /> Call 112
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`${theme.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] animate-pulse opacity-30" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm animate-pulse">
                    <FireIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-heading">Emergency Center</h1>
                    <p className="text-white/80 text-sm">Real-time emergency monitoring and response</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-sm backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span>{activeAlerts.length} Active</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Emergency Type Quick Report */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-3">Quick Emergency Report</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {emergencyTypes.map((type, i) => (
                <motion.button key={type.type} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                  onClick={() => setSelectedType(type.type)}
                  className={cn('p-3 rounded-xl border-2 text-center transition-all', selectedType === type.type ? 'border-red-500 shadow-lg scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300')}>
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">{type.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Active Alerts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-3">Active Emergency Alerts</h3>
            <div className="space-y-3">
              {activeAlerts.map((alert, i) => (
                <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                  className="glass-card border-l-4 border-red-500 p-5 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{alert.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" />{alert.area}</span>
                          <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{alert.time}</span>
                          <span>{alert.affected.toLocaleString()} affected</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{alert.description}</p>
                        <div className="flex gap-2 mt-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{alert.severity.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Emergency Contacts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-3">Emergency Contacts</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {emergencyContacts.map((contact) => (
                <a key={contact.number} href={`tel:${contact.number}`}
                  className="glass-card p-4 text-center hover:shadow-lg transition-all group">
                  <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{contact.icon}</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{contact.number}</p>
                  <p className="text-xs text-slate-500">{contact.name}</p>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="glass-card p-5 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/30">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">Emergency Safety Tips</h4>
                  <ul className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 space-y-0.5 list-disc list-inside">
                    <li>Stay calm and move to a safe location immediately</li>
                    <li>Call the appropriate emergency number before attempting to help</li>
                    <li>Share your live location with emergency contacts</li>
                    <li>Follow evacuation instructions from authorities</li>
                    <li>Do not re-enter the affected area until cleared by officials</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
