'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOffice2Icon, ClipboardDocumentListIcon, UserGroupIcon,
  ClockIcon, CheckCircleIcon, ExclamationTriangleIcon,
  EyeIcon, PencilSquareIcon, FunnelIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { getStatusColor, getPriorityColor, getCategoryIcon, formatDate, cn } from '@/lib/utils';
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
  recentIssues: Issue[];
}

interface Issue {
  _id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  department?: string;
  createdAt: string;
  description?: string;
  location?: { address?: string };
}

interface DepartmentPerformance {
  name: string;
  totalIssues: number;
  resolvedIssues: number;
  openIssues: number;
  criticalIssues: number;
  resolutionRate: number;
}

type TabType = 'queue' | 'workers' | 'sla';

export default function GovernmentPage() {
  const theme = pageThemes.government;
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, issuesRes, deptRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/issues'),
          api.get('/analytics/department-performance'),
        ]);
        setDashboard(dashRes.data);
        setIssues(issuesRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        console.error('Failed to load government dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const overviewStats = dashboard
    ? [
        { label: 'Pending Assignment', value: dashboard.openIssues, icon: ClipboardDocumentListIcon, color: 'from-amber-500 to-orange-600' },
        { label: 'In Progress', value: dashboard.inProgressIssues, icon: ClockIcon, color: 'from-blue-500 to-indigo-600' },
        { label: 'Resolved Today', value: dashboard.todayNewIssues, icon: CheckCircleIcon, color: 'from-emerald-500 to-green-600' },
        { label: 'Critical Issues', value: dashboard.criticalIssues, icon: ExclamationTriangleIcon, color: 'from-red-500 to-rose-600' },
      ]
    : [];

  const getSlaStatus = (issue: Issue): { label: string; pct: number } => {
    const created = new Date(issue.createdAt).getTime();
    const now = Date.now();
    const elapsed = (now - created) / (1000 * 60 * 60);
    const slaLimit = issue.priority === 'critical' ? 24 : issue.priority === 'high' ? 48 : 72;
    const remaining = Math.max(0, slaLimit - elapsed);
    const pct = Math.min(100, Math.round(((slaLimit - remaining) / slaLimit) * 100));
    if (remaining <= 0) return { label: 'SLA Violated', pct: 100 };
    if (remaining < slaLimit * 0.2) return { label: 'Approaching Deadline', pct };
    return { label: 'Within SLA', pct };
  };

  const slaSummary = issues.length > 0
    ? (() => {
        const results = issues.map(getSlaStatus);
        const within = results.filter(r => r.label === 'Within SLA').length;
        const approaching = results.filter(r => r.label === 'Approaching Deadline').length;
        const violated = results.filter(r => r.label === 'SLA Violated').length;
        const total = issues.length;
        return [
          { label: 'Within SLA', value: within, pct: total ? Math.round((within / total) * 100) : 0, color: 'bg-emerald-500' },
          { label: 'Approaching Deadline', value: approaching, pct: total ? Math.round((approaching / total) * 100) : 0, color: 'bg-amber-500' },
          { label: 'SLA Violated', value: violated, pct: total ? Math.round((violated / total) * 100) : 0, color: 'bg-red-500' },
        ];
      })()
    : [];

  const filteredIssues = issues.filter(issue => {
    if (statusFilter && issue.status !== statusFilter) return false;
    if (priorityFilter && issue.priority !== priorityFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <AppShell>
        <div className={`${theme.background} min-h-full`}>
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            <div className="animate-pulse space-y-6">
              <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-700" />
                ))}
              </div>
              <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`${theme.gradient} rounded-2xl p-6 text-white`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <BuildingOffice2Icon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-heading">Government Operations Center</h1>
                  <p className="text-white/80 text-sm">Real-time issue management and workforce coordination</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewStats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="glass-card p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
            {(['queue', 'workers', 'sla'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {tab === 'queue' ? 'Issue Queue' : tab === 'workers' ? 'Workforce' : 'SLA Monitor'}
              </button>
            ))}
          </div>

          {/* Issue Queue */}
          {activeTab === 'queue' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
              {/* Filters */}
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex flex-wrap items-center gap-3">
                <FunnelIcon className="w-4 h-4 text-slate-400" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                  <option value="">All Status</option>
                  <option value="reported">Reported</option>
                  <option value="verified">Verified</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                  <option value="">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <span className="text-xs text-slate-400 ml-auto">{filteredIssues.length} issues</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Issue</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Priority</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Date</th>
                      <th className="text-right p-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((issue, i) => (
                      <motion.tr key={issue._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(issue.category)}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{issue.title}</p>
                              <p className="text-[10px] text-slate-500">{formatDate(issue.createdAt)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell"><span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{issue.category.replace(/_/g, ' ')}</span></td>
                        <td className="p-4"><span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusColor(issue.status))}>{issue.status.replace(/_/g, ' ')}</span></td>
                        <td className="p-4 hidden lg:table-cell"><span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', getPriorityColor(issue.priority))}>{issue.priority}</span></td>
                        <td className="p-4 hidden lg:table-cell"><span className="text-xs text-slate-600 dark:text-slate-400">{formatDate(issue.createdAt)}</span></td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors"><EyeIcon className="w-4 h-4" /></button>
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600 transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {filteredIssues.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-sm text-slate-400">No issues match the current filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Workers / Department Performance */}
          {activeTab === 'workers' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept, i) => (
                <motion.div key={dept.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                  className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {dept.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</p>
                      <p className="text-xs text-slate-500">{dept.totalIssues} total issues</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Resolved</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{dept.resolvedIssues}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Open</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{dept.openIssues}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Critical</span>
                      <span className="font-medium text-red-600">{dept.criticalIssues}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Resolution Rate</span>
                        <span className="font-medium text-emerald-600">{Math.round(dept.resolutionRate * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(dept.resolutionRate * 100)}%` }} transition={{ duration: 0.8 }}
                          className="h-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {departments.length === 0 && (
                <div className="col-span-full p-8 text-center text-sm text-slate-400">No department data available.</div>
              )}
            </motion.div>
          )}

          {/* SLA Monitor */}
          {activeTab === 'sla' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">SLA Compliance Overview</h3>
              {slaSummary.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {slaSummary.map((item) => (
                    <div key={item.label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{item.value}</span>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 0.8 }}
                          className={`h-full ${item.color} rounded-full`} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.pct}% of total</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No issue data to calculate SLA metrics.</p>
              )}
              {issues.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Issues at Risk</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                          <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Issue</th>
                          <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Priority</th>
                          <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                          <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.filter(i => i.status !== 'resolved').slice(0, 10).map((issue) => {
                          const sla = getSlaStatus(issue);
                          return (
                            <tr key={issue._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-3">
                                <p className="text-sm font-medium text-slate-900 dark:text-white max-w-[200px] truncate">{issue.title}</p>
                              </td>
                              <td className="p-3"><span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', getPriorityColor(issue.priority))}>{issue.priority}</span></td>
                              <td className="p-3"><span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusColor(issue.status))}>{issue.status.replace(/_/g, ' ')}</span></td>
                              <td className="p-3 text-right">
                                <span className={cn('text-xs font-medium', sla.label === 'SLA Violated' && 'text-red-600', sla.label === 'Approaching Deadline' && 'text-amber-600', sla.label === 'Within SLA' && 'text-emerald-600')}>
                                  {sla.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
