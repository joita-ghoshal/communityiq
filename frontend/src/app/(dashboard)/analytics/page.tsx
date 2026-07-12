'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon, 
  ArrowUpIcon, ArrowDownIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon, UsersIcon, 
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
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

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#6b7280'];

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
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const theme = pageThemes.analytics;
  const [timeRange, setTimeRange] = useState('6m');
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState<DashboardData>(SAMPLE_DASHBOARD);
  const [kpis, setKpis] = useState<KpiData>(SAMPLE_KPIS);
  const [trends, setTrends] = useState<TrendPoint[]>(SAMPLE_TRENDS);
  const [departments, setDepartments] = useState<DepartmentPerformance[]>(SAMPLE_DEPARTMENTS);
  const [community, setCommunity] = useState<CommunityHealth>(SAMPLE_COMMUNITY);

  const periodMap: Record<string, string> = { '1m': 'week', '3m': 'month', '6m': 'month', '1y': 'year' };

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      const period = periodMap[timeRange] || 'month';
      const [dashRes, kpiRes, trendRes, deptRes, commRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/analytics/kpis'),
        api.get(`/analytics/trends?period=${period}`),
        api.get('/analytics/department-performance'),
        api.get('/analytics/community-health'),
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
      setLoading(false);
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [timeRange]);

  const statusPieData = [
    { name: 'Open', value: dashboard.openIssues },
    { name: 'In Progress', value: dashboard.inProgressIssues },
    { name: 'Resolved', value: dashboard.resolvedIssues },
    { name: 'Critical', value: dashboard.criticalIssues },
  ].filter((d) => d.value > 0);

  const trendData = trends.map((t) => ({
    period: t.period,
    total: t.total,
    resolved: t.resolved,
  }));

  const categoryBarData = departments.map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 14) + '...' : d.name,
    total: d.totalIssues,
    resolved: d.resolvedIssues,
  }));

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
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
            <div className="flex gap-2">
              {['1m', '3m', '6m', '1y'].map((r) => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${timeRange === r ? 'bg-blue-600 text-white shadow-md' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}>
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>

          {/* KPIs */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Resolution Rate', value: `${kpis.resolutionRate ?? dashboard.resolutionRate}%`, icon: CheckCircleIcon, color: 'from-emerald-500 to-green-600', change: `${kpis.weeklyNewIssues ?? 0} new this week`, up: false },
                { label: 'Avg Resolution Time', value: `${kpis.avgResolutionDays ?? 3.2} days`, icon: ClockIcon, color: 'from-blue-500 to-indigo-600', change: `${kpis.todayNewIssues ?? dashboard.todayNewIssues} new today`, up: false },
                { label: 'Active Issues', value: formatNumber(dashboard.openIssues), icon: ExclamationTriangleIcon, color: 'from-amber-500 to-orange-600', change: `${dashboard.inProgressIssues} in progress`, up: false },
                { label: 'Community Score', value: `${kpis.avgCommunityScore ?? 87}/100`, icon: UsersIcon, color: 'from-purple-500 to-violet-600', change: `${community.engagementRate ?? 0}% engagement`, up: true },
              ].map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                  className="glass-card p-5">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                      <kpi.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      {kpi.up ? <ArrowUpIcon className="w-3 h-3 text-emerald-600" /> : <ArrowDownIcon className="w-3 h-3 text-red-600" />}
                      {kpi.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{kpi.value}</p>
                  <p className="text-sm text-slate-500">{kpi.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Monthly Trends - Area Chart */}
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
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
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
                    <Area type="monotone" dataKey="total" name="Total Issues" stroke="#3b82f6" fill="url(#gradTotal)" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#gradResolved)" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Status Pie Chart */}
            {loading ? (
              <SkeletonChart />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Issue Status Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {statusPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Category Bar Chart */}
            {loading ? (
              <SkeletonChart />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Department Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="total" name="Total Issues" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </div>

          {/* Department Performance */}
          {loading ? (
            <SkeletonChart height="h-48" />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Department Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <div key={dept.code} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${dept.resolutionRate >= 90 ? 'text-emerald-600' : dept.resolutionRate >= 85 ? 'text-amber-600' : 'text-red-600'}`}>
                          {dept.resolutionRate}%
                        </span>
                      </div>
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
            </motion.div>
          )}

          {/* AI Insights - Community Health */}
          {loading ? (
            <SkeletonChart height="h-32" />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200/50">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🤖</span> AI Intelligence Report
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Community Health Score</p>
                  <p className="text-2xl font-bold text-violet-600 mt-1">{community.avgCommunityScore}/100</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {community.engagementRate}% volunteer engagement with {community.activeVolunteers}/{community.totalVolunteers} active
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Risk Assessment</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{kpis.avgRiskScore ?? 34}/100</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dashboard.criticalIssues} critical issues flagged, avg {kpis.avgResolutionDays}d resolution cycle
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Community Contributions</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{formatNumber(community.totalPoints)} pts</p>
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
