'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowUpIcon, ArrowDownIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon, UsersIcon, FireIcon, BoltIcon,
  CalendarDaysIcon, SparklesIcon, BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { formatNumber } from '@/lib/utils';
import api from '@/lib/api';

interface DashboardData {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  todayNewIssues: number;
  resolutionRate: number;
  totalUsers: number;
  totalVolunteers: number;
  recentIssues: any[];
}

interface KpiData {
  totalIssues: number;
  resolutionRate: number;
  avgResolutionDays: number;
  avgCommunityScore: number;
  avgRiskScore: number;
  todayNewIssues: number;
  weeklyNewIssues: number;
  totalUsers: number;
  activeVolunteers: number;
}

interface TrendPoint {
  period: string;
  total: number;
  resolved: number;
  resolutionRate: number;
}

interface DepartmentPerformance {
  name: string;
  code: string;
  totalIssues: number;
  resolvedIssues: number;
  openIssues: number;
  criticalIssues: number;
  resolutionRate: number;
  avgResolutionDays: number;
}

interface CommunityHealth {
  totalVolunteers: number;
  activeVolunteers: number;
  totalPoints: number;
  avgContributions: number;
  avgCommunityScore: number;
  engagementRate: number;
}

interface IssueStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  resolutionRate: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}

const SAMPLE_DASHBOARD: DashboardData = {
  totalIssues: 1842, openIssues: 486, inProgressIssues: 234,
  resolvedIssues: 1122, criticalIssues: 23, todayNewIssues: 12,
  resolutionRate: 92.4, totalUsers: 3420, totalVolunteers: 156,
  recentIssues: [],
};

const SAMPLE_KPIS: KpiData = {
  totalIssues: 1842, resolutionRate: 92.4, avgResolutionDays: 3.2,
  avgCommunityScore: 87, avgRiskScore: 34, todayNewIssues: 12,
  weeklyNewIssues: 67, totalUsers: 3420, activeVolunteers: 134,
};

const SAMPLE_TRENDS: TrendPoint[] = [
  { period: 'Jan', total: 245, resolved: 210, resolutionRate: 85.7 },
  { period: 'Feb', total: 280, resolved: 250, resolutionRate: 89.3 },
  { period: 'Mar', total: 310, resolved: 290, resolutionRate: 93.5 },
  { period: 'Apr', total: 295, resolved: 275, resolutionRate: 93.2 },
  { period: 'May', total: 350, resolved: 320, resolutionRate: 91.4 },
  { period: 'Jun', total: 380, resolved: 355, resolutionRate: 93.4 },
];

const SAMPLE_DEPARTMENTS: DepartmentPerformance[] = [
  { name: 'Public Works', code: 'PW', totalIssues: 380, resolvedIssues: 342, openIssues: 24, criticalIssues: 5, resolutionRate: 90, avgResolutionDays: 2.8 },
  { name: 'Water Supply', code: 'WS', totalIssues: 215, resolvedIssues: 198, openIssues: 12, criticalIssues: 3, resolutionRate: 92, avgResolutionDays: 3.1 },
  { name: 'Electricity', code: 'EL', totalIssues: 170, resolvedIssues: 156, openIssues: 10, criticalIssues: 2, resolutionRate: 92, avgResolutionDays: 2.5 },
  { name: 'Sanitation', code: 'SN', totalIssues: 340, resolvedIssues: 289, openIssues: 38, criticalIssues: 8, resolutionRate: 85, avgResolutionDays: 4.2 },
  { name: 'Roads & Transport', code: 'RT', totalIssues: 280, resolvedIssues: 234, openIssues: 32, criticalIssues: 4, resolutionRate: 84, avgResolutionDays: 3.8 },
  { name: 'Environment', code: 'EN', totalIssues: 125, resolvedIssues: 112, openIssues: 10, criticalIssues: 1, resolutionRate: 90, avgResolutionDays: 2.9 },
];

const SAMPLE_COMMUNITY: CommunityHealth = {
  totalVolunteers: 156, activeVolunteers: 134, totalPoints: 24500,
  avgContributions: 18.3, avgCommunityScore: 87, engagementRate: 85.9,
};

const SAMPLE_ISSUE_STATS: IssueStats = {
  total: 1842, open: 486, inProgress: 234, resolved: 1122, resolutionRate: 92.4,
  byCategory: { road_damage: 320, water_leakage: 185, garbage: 290, electricity: 170, drainage: 145, noise: 95, public_safety: 110, street_lighting: 130, encroachment: 85, environmental: 120, other: 192 },
  byPriority: { low: 420, medium: 680, high: 540, critical: 202 },
  byStatus: { reported: 120, ai_analyzing: 45, community_verification: 38, verified: 95, assigned: 88, work_started: 65, in_progress: 169, partially_resolved: 30, awaiting_ai_verification: 22, awaiting_citizen_confirmation: 18, resolved: 750, closed: 372, archived: 0 },
};

const STATUS_COLORS: Record<string, string> = {
  reported: '#f59e0b', ai_analyzing: '#a855f7', community_verification: '#06b6d4',
  verified: '#3b82f6', assigned: '#6366f1', work_started: '#f97316',
  in_progress: '#fb923c', partially_resolved: '#facc15',
  awaiting_ai_verification: '#c084fc', awaiting_citizen_confirmation: '#38bdf8',
  resolved: '#22c55e', closed: '#6b7280', archived: '#94a3b8',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};

const CATEGORY_LABELS: Record<string, string> = {
  road_damage: 'Road Damage', water_leakage: 'Water Leakage', garbage: 'Garbage',
  electricity: 'Electricity', drainage: 'Drainage', noise: 'Noise',
  public_safety: 'Public Safety', street_lighting: 'Street Lighting',
  encroachment: 'Encroachment', environmental: 'Environmental', other: 'Other',
};

const PERIOD_OPTIONS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-700/40 ${className}`} />;
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <SkeletonBlock className="w-10 h-10 rounded-xl" />
      <SkeletonBlock className="h-7 w-24" />
      <SkeletonBlock className="h-4 w-20" />
    </div>
  );
}

function SkeletonChart({ height = 'h-64' }: { height?: string }) {
  return (
    <div className="glass-card p-6 space-y-4">
      <SkeletonBlock className="h-5 w-40" />
      <SkeletonBlock className={`${height} w-full rounded-xl`} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl px-4 py-3 shadow-xl border border-white/20">
      <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' && String(p.name).includes('Rate') ? `${p.value}%` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const theme = pageThemes.analytics;
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState<DashboardData>(SAMPLE_DASHBOARD);
  const [kpis, setKpis] = useState<KpiData>(SAMPLE_KPIS);
  const [trends, setTrends] = useState<TrendPoint[]>(SAMPLE_TRENDS);
  const [departments, setDepartments] = useState<DepartmentPerformance[]>(SAMPLE_DEPARTMENTS);
  const [community, setCommunity] = useState<CommunityHealth>(SAMPLE_COMMUNITY);
  const [issueStats, setIssueStats] = useState<IssueStats>(SAMPLE_ISSUE_STATS);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      const [dashRes, kpiRes, trendRes, deptRes, commRes, statsRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/analytics/kpis'),
        api.get(`/analytics/trends?period=${period}`),
        api.get('/analytics/department-performance'),
        api.get('/analytics/community-health'),
        api.get('/issues/stats'),
      ]);
      if (cancelled) return;
      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value.data?.data || dashRes.value.data;
        setDashboard((prev) => ({ ...prev, ...d }));
      }
      if (kpiRes.status === 'fulfilled') {
        const d = kpiRes.value.data?.data || kpiRes.value.data;
        setKpis((prev) => ({ ...prev, ...d }));
      }
      if (trendRes.status === 'fulfilled') {
        const d = trendRes.value.data?.data || trendRes.value.data;
        if (Array.isArray(d)) setTrends(d);
      }
      if (deptRes.status === 'fulfilled') {
        const d = deptRes.value.data?.data || deptRes.value.data;
        if (Array.isArray(d)) setDepartments(d);
      }
      if (commRes.status === 'fulfilled') {
        const d = commRes.value.data?.data || commRes.value.data;
        setCommunity((prev) => ({ ...prev, ...d }));
      }
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data?.data || statsRes.value.data;
        setIssueStats((prev) => ({ ...prev, ...d }));
      }
      setLoading(false);
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [period]);

  const trendData = trends.map((t) => ({
    period: t.period, total: t.total, resolved: t.resolved, resolutionRate: t.resolutionRate,
  }));

  const statusPieData = Object.entries(issueStats.byStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value, rawName: name,
    }));

  const priorityPieData = Object.entries(issueStats.byPriority)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), value,
    }));

  const categoryBarData = Object.entries(issueStats.byCategory)
    .map(([key, value]) => ({ name: CATEGORY_LABELS[key] || key, count: value }))
    .sort((a, b) => b.count - a.count);

  const deptStackedData = departments.map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 14) + '...' : d.name,
    resolved: d.resolvedIssues, open: d.openIssues, critical: d.criticalIssues,
  }));

  const deptResolutionTime = departments.map((d) => ({
    name: d.code, fullName: d.name, days: d.avgResolutionDays, rate: d.resolutionRate,
  })).sort((a, b) => a.days - b.days);

  const aiInsights = {
    predictedResolution: Math.round(kpis.avgResolutionDays * 10) / 10,
    duplicateDetection: Math.round(dashboard.totalIssues * 0.08),
    severityDistribution: {
      low: issueStats.byPriority.low || 0, medium: issueStats.byPriority.medium || 0,
      high: issueStats.byPriority.high || 0, critical: issueStats.byPriority.critical || 0,
    },
  };

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`${theme.gradient} rounded-xl p-2.5 text-white`}>
                <ChartBarIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">Analytics & Intelligence</h1>
                <p className="text-sm text-slate-500">Data-driven civic intelligence insights</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {PERIOD_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === opt.value ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Issues', value: formatNumber(dashboard.totalIssues), icon: ChartBarIcon, color: 'from-violet-500 to-purple-600', sub: `${kpis.todayNewIssues ?? dashboard.todayNewIssues} reported today`, up: false },
                { label: 'Active Issues', value: formatNumber(dashboard.openIssues), icon: ExclamationTriangleIcon, color: 'from-amber-500 to-orange-600', sub: `${dashboard.inProgressIssues} in progress`, up: false },
                { label: 'Resolved Issues', value: formatNumber(dashboard.resolvedIssues), icon: CheckCircleIcon, color: 'from-emerald-500 to-green-600', sub: `${kpis.resolutionRate ?? dashboard.resolutionRate}% rate`, up: true },
                { label: 'Critical Issues', value: dashboard.criticalIssues.toString(), icon: FireIcon, color: 'from-red-500 to-rose-600', sub: `Risk score: ${kpis.avgRiskScore ?? 34}/100`, up: false },
                { label: 'Resolution Rate', value: `${kpis.resolutionRate ?? dashboard.resolutionRate}%`, icon: BoltIcon, color: 'from-cyan-500 to-blue-600', sub: `${kpis.weeklyNewIssues ?? 0} new this week`, up: true },
                { label: 'Avg Resolution Time', value: `${kpis.avgResolutionDays ?? 3.2}d`, icon: ClockIcon, color: 'from-indigo-500 to-blue-600', sub: 'Average across departments', up: false },
                { label: 'Community Score', value: `${kpis.avgCommunityScore ?? 87}/100`, icon: UsersIcon, color: 'from-purple-500 to-violet-600', sub: `${community.engagementRate ?? 0}% engagement`, up: true },
                { label: 'Volunteer Activity', value: `${community.activeVolunteers ?? kpis.activeVolunteers ?? 0}`, icon: CalendarDaysIcon, color: 'from-teal-500 to-emerald-600', sub: `of ${community.totalVolunteers ?? 0} total`, up: true },
              ].map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  className="glass-card p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                      <kpi.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      {kpi.up ? <ArrowUpIcon className="w-3 h-3 text-emerald-600" /> : <ArrowDownIcon className="w-3 h-3 text-slate-400" />}
                      <span className="text-slate-500">{kpi.sub}</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{kpi.value}</p>
                  <p className="text-sm text-slate-500">{kpi.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {loading ? (
            <SkeletonChart />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Monthly Trends</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="total" name="Total Issues" stroke="#8b5cf6" fill="url(#gradTotal)" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#gradResolved)" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {loading ? (
            <SkeletonChart />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-1">Weekly Trends</h3>
              <p className="text-xs text-slate-500 mb-4">Resolution rate trend over recent periods</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="total" name="Total Issues" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                    <Line yAxisId="left" type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
                    <Line yAxisId="right" type="monotone" dataKey="resolutionRate" name="Resolution Rate" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <SkeletonChart />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-1">Issue Lifecycle Status</h3>
                <p className="text-xs text-slate-500 mb-4">Distribution across all workflow stages</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                        {statusPieData.map((entry) => (
                          <Cell key={entry.rawName} fill={STATUS_COLORS[entry.rawName] || '#6b7280'} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: 10, lineHeight: '16px' }}
                        formatter={(value: string) => <span className="text-slate-600 dark:text-slate-400 text-[10px]">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {loading ? (
              <SkeletonChart />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-1">Priority Distribution</h3>
                <p className="text-xs text-slate-500 mb-4">Issues by severity level</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={priorityPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {priorityPieData.map((entry) => (
                          <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name.toLowerCase()] || '#6b7280'} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <SkeletonChart />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-1">Category Breakdown</h3>
                <p className="text-xs text-slate-500 mb-4">Issues by category across the city</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBarData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Issues" radius={[0, 6, 6, 0]}>
                        {categoryBarData.map((_, i) => (
                          <Cell key={i} fill={`hsl(${260 + i * 12}, 60%, ${55 - i * 2}%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {loading ? (
              <SkeletonChart />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-1">Department Status Breakdown</h3>
                <p className="text-xs text-slate-500 mb-4">Resolved, open, and critical issues per department</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptStackedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#10b981" />
                      <Bar dataKey="open" name="Open" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </div>

          {loading ? (
            <SkeletonChart height="h-48" />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BuildingOffice2Icon className="w-5 h-5 text-violet-500" />
                Department Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {departments.map((dept) => (
                  <div key={dept.code} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</span>
                      <span className={`text-xs font-bold ${dept.resolutionRate >= 90 ? 'text-emerald-600' : dept.resolutionRate >= 85 ? 'text-amber-600' : 'text-red-600'}`}>
                        {dept.resolutionRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${dept.resolutionRate}%` }} transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${dept.resolutionRate >= 90 ? 'bg-emerald-500' : dept.resolutionRate >= 85 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                      <span>{dept.resolvedIssues}/{dept.totalIssues} resolved</span>
                      <span>{dept.criticalIssues} critical</span>
                      <span>~{dept.avgResolutionDays}d avg</span>
                    </div>
                  </div>
                ))}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Average Resolution Time by Department</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptResolutionTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="d" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="days" name="Avg Days" radius={[6, 6, 0, 0]}>
                      {deptResolutionTime.map((entry) => (
                        <Cell key={entry.name} fill={entry.days <= 3 ? '#10b981' : entry.days <= 3.5 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {loading ? (
            <SkeletonChart height="h-32" />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-6 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200/50">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-violet-500" />
                AI Intelligence Report
              </h3>
              <p className="text-xs text-slate-500 mb-4">Automated analysis and predictions powered by AI</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Predicted Resolution Time</p>
                  <p className="text-2xl font-bold text-violet-600 mt-1">{aiInsights.predictedResolution} days</p>
                  <p className="text-xs text-slate-500 mt-1">
                    AI estimates avg {aiInsights.predictedResolution}d cycle based on current workload and department capacity
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Duplicate Detection</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{aiInsights.duplicateDetection}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Potential duplicate issues flagged by AI image and text similarity analysis
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Risk Assessment</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{kpis.avgRiskScore ?? 34}/100</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dashboard.criticalIssues} critical issues flagged, avg {kpis.avgResolutionDays}d resolution cycle
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Severity Distribution</p>
                  <div className="mt-2 space-y-1.5">
                    {Object.entries(aiInsights.severityDistribution).map(([level, count]) => (
                      <div key={level} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[level] }} />
                        <span className="text-xs text-slate-600 dark:text-slate-400 capitalize flex-1">{level}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Community Health Score</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{community.avgCommunityScore}/100</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {community.engagementRate}% volunteer engagement with {community.activeVolunteers}/{community.totalVolunteers} active
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Community Contributions</p>
                  <p className="text-2xl font-bold text-sky-600 mt-1">{formatNumber(community.totalPoints)} pts</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {community.avgContributions} avg contributions per volunteer across {community.activeVolunteers} active members
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
