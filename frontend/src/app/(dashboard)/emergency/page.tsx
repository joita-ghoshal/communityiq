'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FireIcon, ExclamationTriangleIcon, PhoneIcon, MapPinIcon,
  ClockIcon, ShieldCheckIcon, XMarkIcon, SpeakerWaveIcon,
  ArrowPathIcon, InformationCircleIcon, PlusCircleIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface EmergencyAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  location: any;
  affectedArea: {
    type: string;
    coordinates: number[][][];
    radius?: number;
  } | null;
  isActive: boolean;
  reportedBy: string;
  evacuationRequired: boolean;
  contactNumber: string | null;
  expiresAt: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

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

const emergencyContacts = [
  { name: 'Fire Department', number: '101', icon: '🚒' },
  { name: 'Police', number: '100', icon: '👮' },
  { name: 'Ambulance', number: '108', icon: '🚑' },
  { name: 'Disaster Control', number: '1070', icon: '🆘' },
  { name: 'Gas Emergency', number: '1906', icon: '💨' },
  { name: 'Electricity Emergency', number: '1912', icon: '⚡' },
];

const severityConfig: Record<string, { label: string; color: string; overlay: string }> = {
  extreme: { label: 'EXTREME', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', overlay: 'bg-gradient-to-b from-red-900/95 via-rose-900/95 to-orange-900/95' },
  severe: { label: 'SEVERE', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', overlay: 'bg-gradient-to-b from-red-800/95 via-rose-800/95 to-orange-800/95' },
  high: { label: 'HIGH', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', overlay: 'bg-gradient-to-b from-orange-800/95 via-red-800/95 to-rose-800/95' },
  moderate: { label: 'MODERATE', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', overlay: 'bg-gradient-to-b from-yellow-800/95 via-orange-800/95 to-red-800/95' },
  low: { label: 'LOW', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', overlay: 'bg-gradient-to-b from-blue-800/95 via-slate-800/95 to-gray-800/95' },
};

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getAffectedCount(alert: EmergencyAlert): number {
  if (alert.affectedArea?.coordinates?.[0]) {
    return alert.affectedArea.coordinates[0].length;
  }
  return 0;
}

function getAreaLabel(alert: EmergencyAlert): string {
  if (alert.affectedArea?.coordinates?.[0]?.[0]) {
    return `${alert.affectedArea.coordinates[0][0][0].toFixed(4)}, ${alert.affectedArea.coordinates[0][0][1].toFixed(4)}`;
  }
  if (alert.location) {
    return 'Area mapped';
  }
  return 'Location unknown';
}

export default function EmergencyPage() {
  const theme = pageThemes.emergency;
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRedAlert, setShowRedAlert] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [alertMuted, setAlertMuted] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportForm, setReportForm] = useState({
    type: '',
    title: '',
    description: '',
    severity: 'moderate',
    contactNumber: '',
  });
  const [reportError, setReportError] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/emergency/alerts/active');
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReportEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError('');
    setSubmitting(true);
    try {
      await api.post('/emergency/alerts', reportForm);
      setShowReportForm(false);
      setReportForm({ type: '', title: '', description: '', severity: 'moderate', contactNumber: '' });
      setSelectedType(null);
      fetchAlerts();
    } catch (err: any) {
      setReportError(err.response?.data?.message || 'Failed to submit report. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const showOverlay = showRedAlert && alerts.length > 0;
  const topAlert = alerts[0];

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        {/* Red Alert Overlay */}
        <AnimatePresence>
          {showOverlay && topAlert && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] backdrop-blur-sm flex items-center justify-center p-4"
              style={{ background: topAlert.severity === 'extreme' ? undefined : undefined }}>
              <div className={`absolute inset-0 ${severityConfig[topAlert.severity]?.overlay || severityConfig.high.overlay}`} />
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                className="w-full max-w-lg text-center relative z-10">
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
                <p className="text-red-200 text-lg font-semibold mb-6">{topAlert.title}</p>

                <div className="bg-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPinIcon className="w-4 h-4 text-red-300" />
                    <span className="text-red-200 text-sm font-medium">{getAreaLabel(topAlert)}</span>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">{topAlert.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-red-300">
                    <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{formatTimeAgo(topAlert.createdAt)}</span>
                    {getAffectedCount(topAlert) > 0 && (
                      <span>{getAffectedCount(topAlert)} areas affected</span>
                    )}
                    <span className="font-bold uppercase text-red-200">{topAlert.severity}</span>
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
                  {loading ? (
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-sm backdrop-blur-sm">
                      <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-sm backdrop-blur-sm">
                      <div className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-red-400 animate-pulse' : 'bg-green-400'} `} />
                      <span>{alerts.length} Active</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Emergency Type Selection + Report Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Quick Emergency Report</h3>
              <button onClick={() => { setShowReportForm(true); setSelectedType(null); }}
                className="flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors">
                <PlusCircleIcon className="w-4 h-4" /> Report Emergency
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {emergencyTypes.map((type, i) => (
                <motion.button key={type.type} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                  onClick={() => { setSelectedType(type.type); setShowReportForm(true); }}
                  className={cn('p-3 rounded-xl border-2 text-center transition-all', selectedType === type.type ? 'border-red-500 shadow-lg scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300')}>
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">{type.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Report Emergency Modal */}
          <AnimatePresence>
            {showReportForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                onClick={() => setShowReportForm(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Report Emergency</h3>
                    <button onClick={() => setShowReportForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleReportEmergency} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Type</label>
                      <select value={reportForm.type || selectedType || ''} onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                        required
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent">
                        <option value="">Select type...</option>
                        {emergencyTypes.map((t) => (
                          <option key={t.type} value={t.type}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Title</label>
                      <input type="text" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                        required placeholder="e.g. Fire in Market Area"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
                      <textarea value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                        required placeholder="Describe the emergency situation..."
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Severity</label>
                      <select value={reportForm.severity} onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent">
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                        <option value="severe">Severe</option>
                        <option value="extreme">Extreme</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Contact Number (optional)</label>
                      <input type="tel" value={reportForm.contactNumber} onChange={(e) => setReportForm({ ...reportForm, contactNumber: e.target.value })}
                        placeholder="Your phone number"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                    </div>
                    {reportError && (
                      <p className="text-red-500 text-xs">{reportError}</p>
                    )}
                    <button type="submit" disabled={submitting}
                      className="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Submitting...</> : <><ExclamationTriangleIcon className="w-4 h-4" /> Submit Emergency Report</>}
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Alerts / Empty State */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-3">Active Emergency Alerts</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-card p-5 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, i) => {
                  const sev = severityConfig[alert.severity] || severityConfig.high;
                  return (
                    <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                      className="glass-card border-l-4 border-red-500 p-5 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{alert.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3 flex-shrink-0" /><span className="truncate">{getAreaLabel(alert)}</span></span>
                              <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3 flex-shrink-0" />{formatTimeAgo(alert.createdAt)}</span>
                              {getAffectedCount(alert) > 0 && <span>{getAffectedCount(alert)} areas affected</span>}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{alert.description}</p>
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', sev.color)}>{sev.label}</span>
                              {alert.evacuationRequired && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                  EVACUATION ADVISED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card p-8 text-center">
                <ShieldCheckIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">All Clear</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  There are no active emergency alerts in your area right now. Stay safe and report any emergencies immediately using the button above.
                </p>
              </motion.div>
            )}
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

          {/* Safety Tips */}
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
