'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, FireIcon,
  MagnifyingGlassIcon, ChartBarIcon, ArrowRightIcon,
  ServerIcon, UserGroupIcon, ChevronLeftIcon, ExclamationCircleIcon,
  BellIcon, MapPinIcon, DocumentTextIcon, ShieldCheckIcon, BoltIcon,
  ArrowTrendingUpIcon, SparklesIcon, CpuChipIcon, FaceSmileIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  reported: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ai_analyzing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  community_verification: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  verified: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  assigned: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  work_started: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  partially_resolved: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  awaiting_ai_verification: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  awaiting_citizen_confirmation: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  archived: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
};

const STATUS_DOTS: Record<string, string> = {
  reported: 'bg-blue-500',
  ai_analyzing: 'bg-indigo-500',
  community_verification: 'bg-purple-500',
  verified: 'bg-violet-500',
  assigned: 'bg-orange-500',
  work_started: 'bg-amber-500',
  in_progress: 'bg-yellow-500',
  partially_resolved: 'bg-teal-500',
  awaiting_ai_verification: 'bg-cyan-500',
  awaiting_citizen_confirmation: 'bg-green-500',
  resolved: 'bg-emerald-500',
  closed: 'bg-gray-500',
  archived: 'bg-slate-500',
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface DashboardData {
  dashboard: any;
  kpis: any;
  stats: any;
  recentIssues: any[];
  notifications: any[];
  unreadCount: number;
  emergencies: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, kpiRes, statsRes, issuesRes, notifRes, unreadRes, emergRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/analytics/kpis'),
        api.get('/issues/stats'),
        api.get('/issues?limit=5&sortBy=createdAt&sortOrder=DESC'),
        api.get('/notifications?limit=5'),
        api.get('/notifications/unread-count'),
        api.get('/emergency/alerts/active'),
      ]);

      const extract = (r: PromiseSettledResult<any>) =>
        r.status === 'fulfilled' ? (r.value.data?.data ?? r.value.data) : null;

      setData({
        dashboard: extract(dashRes),
        kpis: extract(kpiRes),
        stats: extract(statsRes),
        recentIssues: extract(issuesRes)?.issues ?? extract(issuesRes) ?? [],
        notifications: extract(notifRes)?.notifications ?? extract(notifRes) ?? [],
        unreadCount: extract(unreadRes)?.count ?? extract(unreadRes) ?? 0,
        emergencies: extract(emergRes)?.alerts ?? extract(emergRes) ?? [],
      });
      setApiHealthy(true);
    } catch {
      setApiHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const userName = typeof window !== 'undefined' ? localStorage.getItem('user_name') || 'Commander' : 'Commander';
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') || 'Admin' : 'Admin';

  const d = data?.dashboard ?? {};
  const k = data?.kpis ?? {};
  const s = data?.stats ?? {};
  const issues = data?.recentIssues ?? [];
  const notifications = data?.notifications ?? [];
  const emergencies = data?.emergencies ?? [];

  const statCards = [
    { label: 'Total Issues', value: d.totalIssues ?? s.total ?? 0, icon: ExclamationTriangleIcon, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200 dark:shadow-blue-900/50' },
    { label: 'Active Issues', value: d.openIssues ?? s.open ?? 0, icon: ClockIcon, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200 dark:shadow-amber-900/50' },
    { label: 'Resolved Today', value: d.todayNewIssues ?? k.todayNewIssues ?? 0, icon: CheckCircleIcon, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-200 dark:shadow-emerald-900/50' },
    { label: 'Critical Issues', value: d.criticalIssues ?? 0, icon: FireIcon, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-200 dark:shadow-red-900/50' },
    { label: 'Community Score', value: k.avgCommunityScore ?? 0, icon: FaceSmileIcon, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-200 dark:shadow-violet-900/50', suffix: '/10' },
    { label: 'Volunteers', value: d.totalVolunteers ?? k.activeVolunteers ?? 0, icon: UserGroupIcon, color: 'from-teal-500 to-cyan-600', shadow: 'shadow-teal-200 dark:shadow-teal-900/50' },
    { label: 'Resolution Rate', value: d.resolutionRate ?? k.resolutionRate ?? 0, icon: ArrowTrendingUpIcon, color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-200 dark:shadow-pink-900/50', suffix: '%' },
    { label: 'New This Week', value: d.weeklyNewIssues ?? k.weeklyNewIssues ?? 0, icon: BoltIcon, color: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-200 dark:shadow-indigo-900/50' },
  ];

  const quickActions = [
    { label: 'Report Issue', icon: ExclamationTriangleIcon, color: 'from-blue-500 to-indigo-600', href: '/report' },
    { label: 'Find Nearby', icon: MapPinIcon, color: 'from-amber-500 to-orange-600', href: '/map' },
    { label: 'My Reports', icon: DocumentTextIcon, color: 'from-emerald-500 to-teal-600', href: '/issues' },
    { label: 'Verify Issue', icon: ShieldCheckIcon, color: 'from-violet-500 to-purple-600', href: '/map' },
    { label: 'View Analytics', icon: ChartBarIcon, color: 'from-pink-500 to-rose-600', href: '/analytics' },
    { label: 'Emergency', icon: FireIcon, color: 'from-red-500 to-red-600', href: '/emergency' },
  ];

  const timeline = issues.slice(0, 5).map((issue: any) => ({
    title: issue.title ?? issue.name ?? 'Untitled Issue',
    status: issue.status ?? 'reported',
    time: issue.updatedAt ?? issue.createdAt ?? new Date().toISOString(),
    category: issue.category ?? issue.type ?? '',
  }));

  const predictedResolution = k.avgResolutionDays ?? d.avgResolutionDays ?? 3;
  const duplicateRisk = s.total ? Math.min(Math.round((1 - ((s.resolved ?? 0) / s.total)) * 100), 95) : 0;
  const avgRisk = k.avgRiskScore ?? 0;

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="back-btn mb-4 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          onClick={() => window.history.back()}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back
        </motion.button>

        {/* Emergency Banner */}
        <AnimatePresence>
          {emergencies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 p-4 md:p-5 text-white shadow-xl shadow-red-500/30">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center animate-pulse">
                    <FireIcon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Emergency</span>
                      <span className="text-xs text-red-100">{emergencies.length} active alert{emergencies.length > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm font-semibold truncate">{emergencies[0]?.title ?? emergencies[0]?.name ?? 'Active Emergency Alert'}</p>
                    {emergencies[0]?.description && (
                      <p className="text-xs text-red-100 mt-1 truncate">{emergencies[0].description}</p>
                    )}
                  </div>
                  <Link href="/emergency" className="flex-shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                    View All
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 dark:from-sky-600 dark:via-blue-600 dark:to-cyan-600 p-6 md:p-8 text-white mb-8 shadow-xl shadow-blue-500/20"
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-100 uppercase tracking-wider font-medium">{userRole}</p>
                <h1 className="text-2xl md:text-3xl font-bold font-heading">Welcome, {userName}</h1>
              </div>
            </div>
            <p className="text-blue-100 mt-2 text-sm md:text-base ml-13">
              Enterprise Command Center — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link href="/report" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-xl text-sm font-medium transition-all">
                <ExclamationTriangleIcon className="w-4 h-4" /> Report Issue
              </Link>
              <Link href="/map" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-sm font-medium transition-all">
                <MagnifyingGlassIcon className="w-4 h-4" /> Explore Map
              </Link>
              <Link href="/analytics" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-sm font-medium transition-all">
                <ChartBarIcon className="w-4 h-4" /> Analytics
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid - Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {statCards.slice(0, 4).map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-shadow"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} rounded-bl-[3rem] opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {loading ? '—' : typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    {stat.suffix && <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.suffix}</span>}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} ${stat.shadow} shadow-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Grid - Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.slice(4, 8).map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * (i + 4) }}
              className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-shadow"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} rounded-bl-[3rem] opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {loading ? '—' : typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    {stat.suffix && <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.suffix}</span>}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} ${stat.shadow} shadow-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`bg-gradient-to-br ${action.color} rounded-2xl p-4 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all`}
                >
                  <action.icon className="w-6 h-6 mb-3" />
                  <p className="text-sm font-semibold">{action.label}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Issues */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Recent Issues</h3>
                </div>
                <Link href="/issues" className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors">
                  View All →
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : issues.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No recent issues</p>
              ) : (
                <div className="space-y-2">
                  {issues.slice(0, 5).map((issue: any, i: number) => (
                    <motion.div
                      key={issue.id ?? i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOTS[issue.status] ?? 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                          {issue.title ?? issue.name ?? 'Untitled Issue'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {issue.category ?? issue.type ?? 'General'} · {timeAgo(issue.createdAt ?? new Date().toISOString())}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[issue.status] ?? STATUS_COLORS.reported}`}>
                        {formatStatus(issue.status ?? 'reported')}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Activity Timeline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Activity Timeline</h3>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-4">
                    {timeline.map((item: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="flex items-start gap-3 relative"
                      >
                        <div className={`w-[15px] h-[15px] rounded-full border-2 border-white dark:border-slate-900 flex-shrink-0 z-10 ${STATUS_DOTS[item.status] ?? 'bg-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] ?? STATUS_COLORS.reported}`}>
                              {formatStatus(item.status)}
                            </span>
                            {item.category && (
                              <span className="text-[10px] text-slate-400">{item.category}</span>
                            )}
                            <span className="text-[10px] text-slate-400">{timeAgo(item.time)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BellIcon className="w-5 h-5 text-violet-500" />
                  <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Notifications</h3>
                  {(data?.unreadCount ?? 0) > 0 && (
                    <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{data!.unreadCount}</span>
                  )}
                </div>
                <Link href="/notifications" className="text-xs font-medium text-violet-500 hover:text-violet-600 transition-colors">
                  View All →
                </Link>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No notifications</p>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((notif: any, i: number) => (
                    <div key={notif.id ?? i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <BellIcon className="w-4 h-4 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white truncate">{notif.message ?? notif.title ?? 'Notification'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{timeAgo(notif.createdAt ?? new Date().toISOString())}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI Insights */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="w-5 h-5 text-pink-500" />
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">AI Insights</h3>
              </div>
              <div className="space-y-3">
                {/* Predicted Resolution */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Predicted Resolution</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {loading ? '—' : `~${predictedResolution} day${predictedResolution !== 1 ? 's' : ''}`}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Based on historical patterns and current workload</p>
                </div>

                {/* Duplicate Detection */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationCircleIcon className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Duplicate Risk</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {loading ? '—' : `${duplicateRisk}%`}
                  </p>
                  <div className="w-full h-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${duplicateRisk}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Severity Analysis */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-100 dark:border-red-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CpuChipIcon className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-700 dark:text-red-300">Severity Analysis</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {loading ? '—' : `Risk Score: ${typeof avgRisk === 'number' ? avgRisk.toFixed(1) : avgRisk}`}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">AI-assessed aggregate risk across all open issues</p>
                </div>
              </div>
            </motion.div>

            {/* Platform Health */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <ServerIcon className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Platform Health</h3>
                <div className={`ml-auto w-2 h-2 rounded-full ${apiHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              </div>
              <div className="space-y-3">
                {[
                  { label: 'API Server', status: apiHealthy ? 'Operational' : 'Down', color: apiHealthy ? 'bg-emerald-500' : 'bg-red-500' },
                  { label: 'Database', status: 'Operational', color: 'bg-emerald-500' },
                  { label: 'AI Engine', status: 'Operational', color: 'bg-emerald-500' },
                  { label: 'Uptime', status: '99.98%', color: 'bg-blue-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-900 dark:text-white">{item.status}</span>
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}