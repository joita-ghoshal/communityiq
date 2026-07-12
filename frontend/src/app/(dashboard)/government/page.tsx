'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingOffice2Icon, ClipboardDocumentListIcon, UserGroupIcon,
  ClockIcon, CheckCircleIcon, ExclamationTriangleIcon,
  EyeIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon,
  MagnifyingGlassIcon, ArrowPathIcon, BoltIcon,
  ShieldCheckIcon, FireIcon, ChatBubbleLeftRightIcon,
  CalendarDaysIcon, BellAlertIcon, PhoneIcon, PlusIcon,
  ChevronDownIcon, ChevronUpIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { getStatusColor, getPriorityColor, getCategoryIcon, formatDate, cn } from '@/lib/utils';
import api from '@/lib/api';

const ALL_STATUSES = [
  'reported', 'ai_analyzing', 'community_verification', 'verified',
  'assigned', 'work_started', 'in_progress', 'partially_resolved',
  'awaiting_ai_verification', 'awaiting_citizen_confirmation', 'resolved', 'closed', 'archived',
];

const STATUS_COLORS: Record<string, string> = {
  reported: 'bg-blue-500', ai_analyzing: 'bg-indigo-500', community_verification: 'bg-purple-500',
  verified: 'bg-violet-500', assigned: 'bg-orange-500', work_started: 'bg-amber-500',
  in_progress: 'bg-yellow-500', partially_resolved: 'bg-teal-500',
  awaiting_ai_verification: 'bg-cyan-500', awaiting_citizen_confirmation: 'bg-green-500',
  resolved: 'bg-emerald-500', closed: 'bg-gray-500', archived: 'bg-slate-400',
};

const STATUS_DOT: Record<string, string> = {
  reported: 'bg-blue-500', ai_analyzing: 'bg-indigo-500', community_verification: 'bg-purple-500',
  verified: 'bg-violet-500', assigned: 'bg-orange-500', work_started: 'bg-amber-500',
  in_progress: 'bg-yellow-500', partially_resolved: 'bg-teal-500',
  awaiting_ai_verification: 'bg-cyan-500', awaiting_citizen_confirmation: 'bg-green-500',
  resolved: 'bg-emerald-500', closed: 'bg-gray-500', archived: 'bg-slate-400',
};

const CATEGORIES = [
  'road_damage', 'water_leakage', 'garbage', 'electricity', 'drainage',
  'noise', 'public_safety', 'street_lighting', 'encroachment', 'environmental', 'other',
];

interface DashboardData {
  totalIssues: number; openIssues: number; inProgressIssues: number;
  resolvedIssues: number; criticalIssues: number; todayNewIssues: number;
  resolutionRate: number; totalUsers: number; totalVolunteers: number;
  recentIssues: Issue[];
}

interface Issue {
  _id: string; title: string; category: string; status: string; priority: string;
  department?: string; createdAt: string; description?: string;
  location?: { address?: string }; assignedTo?: string;
}

interface DepartmentPerformance {
  name: string; totalIssues: number; resolvedIssues: number; openIssues: number;
  criticalIssues: number; resolutionRate: number;
  _id?: string; head?: string; avgResolutionTime?: number; workers?: Worker[];
}

interface Worker {
  _id: string; firstName: string; lastName: string; email: string; role?: string;
}

interface KPI {
  label: string; value: number; unit?: string; trend?: number; description?: string;
}

interface TimelineEvent {
  _id: string; issueId: string; issueTitle?: string; action: string;
  fromStatus?: string; toStatus?: string; performedBy?: string;
  timestamp: string; department?: string; priority?: string;
}

interface Department {
  _id: string; name: string;
}

type TabType = 'executive' | 'queue' | 'workforce' | 'sla' | 'timeline' | 'emergency';

const TABS: { id: TabType; label: string; icon: typeof BuildingOffice2Icon }[] = [
  { id: 'executive', label: 'Executive', icon: BuildingOffice2Icon },
  { id: 'queue', label: 'Issue Queue', icon: ClipboardDocumentListIcon },
  { id: 'workforce', label: 'Workforce', icon: UserGroupIcon },
  { id: 'sla', label: 'SLA Monitor', icon: ClockIcon },
  { id: 'timeline', label: 'Timeline', icon: CalendarDaysIcon },
  { id: 'emergency', label: 'Emergency', icon: BellAlertIcon },
];

const ITEMS_PER_PAGE = 10;

export default function GovernmentPage() {
  const theme = pageThemes.government;
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [issueFilter, setIssueFilter] = useState({ status: '', priority: '', category: '', department: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [rowTimeline, setRowTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [bulkDept, setBulkDept] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineDeptFilter, setTimelineDeptFilter] = useState('');
  const [timelinePriorityFilter, setTimelinePriorityFilter] = useState('');
  const [timelineDateFrom, setTimelineDateFrom] = useState('');
  const [timelineDateTo, setTimelineDateTo] = useState('');
  const [emergencyAlerts, setEmergencyAlerts] = useState<{ id: string; title: string; severity: string; createdAt: string; active: boolean }[]>([
    { id: '1', title: 'Flash Flood Warning - Low lying areas', severity: 'critical', createdAt: new Date().toISOString(), active: true },
    { id: '2', title: 'Power outage affecting Sector 5,7,9', severity: 'high', createdAt: new Date(Date.now() - 3600000).toISOString(), active: true },
    { id: '3', title: 'Road closure - Main St bridge repair', severity: 'medium', createdAt: new Date(Date.now() - 7200000).toISOString(), active: true },
  ]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ title: '', severity: 'medium' });

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, issuesRes, deptRes, kpiRes, deptListRes, usersRes] = await Promise.allSettled([
          api.get('/analytics/dashboard'),
          api.get('/issues'),
          api.get('/analytics/department-performance'),
          api.get('/analytics/kpis'),
          api.get('/admin/departments'),
          api.get('/admin/users'),
        ]);
        if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
        if (issuesRes.status === 'fulfilled') setIssues(Array.isArray(issuesRes.value.data) ? issuesRes.value.data : []);
        if (deptRes.status === 'fulfilled') setDepartments(Array.isArray(deptRes.value.data) ? deptRes.value.data : []);
        if (kpiRes.status === 'fulfilled') setKpis(Array.isArray(kpiRes.value.data) ? kpiRes.value.data : []);
        if (deptListRes.status === 'fulfilled') setAllDepartments(Array.isArray(deptListRes.value.data) ? deptListRes.value.data : []);
        if (usersRes.status === 'fulfilled') setUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : []);
      } catch (err) {
        console.error('Failed to load government dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'timeline') {
      const events: TimelineEvent[] = [];
      issues.slice(0, 50).forEach((issue, i) => {
        events.push({
          _id: `evt-${i}`,
          issueId: issue._id,
          issueTitle: issue.title,
          action: 'status_changed',
          toStatus: issue.status,
          performedBy: issue.assignedTo || 'System',
          timestamp: issue.createdAt,
          department: issue.department,
          priority: issue.priority,
        });
      });
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTimelineEvents(events);
    }
  }, [activeTab, issues]);

  const getSlaStatus = (issue: Issue) => {
    const created = new Date(issue.createdAt).getTime();
    const now = Date.now();
    const elapsed = (now - created) / (1000 * 60 * 60);
    const slaLimit = issue.priority === 'critical' ? 24 : issue.priority === 'high' ? 48 : issue.priority === 'medium' ? 72 : 96;
    const remaining = Math.max(0, slaLimit - elapsed);
    const pct = Math.min(100, Math.round(((slaLimit - remaining) / slaLimit) * 100));
    if (remaining <= 0) return { label: 'SLA Breached', pct, remaining: 0, color: 'text-red-600' as const, bg: 'bg-red-500' };
    if (remaining < slaLimit * 0.2) return { label: 'At Risk', pct, remaining, color: 'text-amber-600' as const, bg: 'bg-amber-500' };
    return { label: 'Within SLA', pct, remaining, color: 'text-emerald-600' as const, bg: 'bg-emerald-500' };
  };

  const slaSummary = useMemo(() => {
    if (issues.length === 0) return { within: 0, atRisk: 0, breached: 0, complianceRate: 0 };
    const results = issues.filter(i => !['resolved', 'closed', 'archived'].includes(i.status)).map(getSlaStatus);
    const within = results.filter(r => r.label === 'Within SLA').length;
    const atRisk = results.filter(r => r.label === 'At Risk').length;
    const breached = results.filter(r => r.label === 'SLA Breached').length;
    const total = results.length;
    return { within, atRisk, breached, complianceRate: total ? Math.round((within / total) * 100) : 0 };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (issueFilter.status && issue.status !== issueFilter.status) return false;
      if (issueFilter.priority && issue.priority !== issueFilter.priority) return false;
      if (issueFilter.category && issue.category !== issueFilter.category) return false;
      if (issueFilter.department && issue.department !== issueFilter.department) return false;
      if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [issues, issueFilter, searchQuery]);

  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIssues.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIssues, currentPage]);

  const totalPages = Math.ceil(filteredIssues.length / ITEMS_PER_PAGE);

  const filteredTimeline = useMemo(() => {
    return timelineEvents.filter(evt => {
      if (timelineDeptFilter && evt.department !== timelineDeptFilter) return false;
      if (timelinePriorityFilter && evt.priority !== timelinePriorityFilter) return false;
      if (timelineDateFrom && new Date(evt.timestamp) < new Date(timelineDateFrom)) return false;
      if (timelineDateTo && new Date(evt.timestamp) > new Date(timelineDateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [timelineEvents, timelineDeptFilter, timelinePriorityFilter, timelineDateFrom, timelineDateTo]);

  const loadIssueTimeline = async (issueId: string) => {
    setTimelineLoading(true);
    try {
      const res = await api.get(`/issues/${issueId}/timeline`);
      setRowTimeline(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRowTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleExpandRow = (issueId: string) => {
    if (expandedRow === issueId) {
      setExpandedRow(null);
      setRowTimeline([]);
    } else {
      setExpandedRow(issueId);
      loadIssueTimeline(issueId);
    }
  };

  const handleTransition = async (issueId: string, newStatus: string) => {
    try {
      await api.patch(`/issues/${issueId}/transition`, { toStatus: newStatus });
      setIssues(prev => prev.map(i => i._id === issueId ? { ...i, status: newStatus } : i));
    } catch (err) {
      console.error('Transition failed', err);
    }
  };

  const handleAssign = async (issueId: string, dept: string) => {
    try {
      await api.patch(`/issues/${issueId}/assign`, { department: dept });
      setIssues(prev => prev.map(i => i._id === issueId ? { ...i, department: dept } : i));
    } catch (err) {
      console.error('Assign failed', err);
    }
  };

  const handleBulkAction = async () => {
    const selected = Array.from(selectedIssues);
    for (const id of selected) {
      if (bulkDept) await handleAssign(id, bulkDept);
      if (bulkPriority) {
        try { await api.patch(`/issues/${id}/transition`, { priority: bulkPriority }); } catch {}
      }
    }
    if (bulkDept || bulkPriority) {
      setIssues(prev => prev.map(i => selected.includes(i._id) ? { ...i, department: bulkDept || i.department, priority: bulkPriority || i.priority } : i));
    }
    setSelectedIssues(new Set());
    setBulkDept('');
    setBulkPriority('');
  };

  const toggleIssueSelection = (id: string) => {
    setSelectedIssues(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreateAlert = () => {
    if (!newAlert.title) return;
    setEmergencyAlerts(prev => [
      { id: String(Date.now()), title: newAlert.title, severity: newAlert.severity, createdAt: new Date().toISOString(), active: true },
      ...prev,
    ]);
    setNewAlert({ title: '', severity: 'medium' });
    setShowAlertForm(false);
  };

  const toggleAlert = (id: string) => {
    setEmergencyAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      reported: ['ai_analyzing', 'community_verification'],
      ai_analyzing: ['community_verification', 'verified'],
      community_verification: ['verified', 'reported'],
      verified: ['assigned'],
      assigned: ['work_started'],
      work_started: ['in_progress'],
      in_progress: ['partially_resolved', 'resolved', 'awaiting_citizen_confirmation'],
      partially_resolved: ['in_progress', 'resolved'],
      awaiting_ai_verification: ['resolved', 'in_progress'],
      awaiting_citizen_confirmation: ['resolved', 'closed'],
      resolved: ['closed'],
      closed: ['archived'],
      archived: [],
    };
    return transitions[currentStatus] || [];
  };

  const activeAlerts = emergencyAlerts.filter(a => a.active);
  const criticalIssues = issues.filter(i => i.priority === 'critical' && !['resolved', 'closed', 'archived'].includes(i.status));

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
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <BuildingOffice2Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-heading">Government Operations Center</h1>
                    <p className="text-white/80 text-sm">Real-time issue management and workforce coordination</p>
                  </div>
                </div>
                {activeAlerts.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2">
                    <BellAlertIcon className="w-5 h-5 text-red-200 animate-pulse" />
                    <span className="text-sm font-medium text-red-100">{activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                )}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════════════════ EXECUTIVE DASHBOARD ═══════════════════════ */}
          {activeTab === 'executive' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Issues', value: dashboard?.totalIssues ?? 0, icon: ClipboardDocumentListIcon, color: 'from-blue-500 to-indigo-600', change: dashboard?.todayNewIssues },
                  { label: 'Active Issues', value: dashboard?.openIssues ?? 0, icon: ClockIcon, color: 'from-amber-500 to-orange-600' },
                  { label: 'Resolved Today', value: dashboard?.todayNewIssues ?? 0, icon: CheckCircleIcon, color: 'from-emerald-500 to-green-600' },
                  { label: 'Critical', value: dashboard?.criticalIssues ?? 0, icon: ExclamationTriangleIcon, color: 'from-red-500 to-rose-600' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="glass-card p-5">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Department Performance Grid */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Department Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept, i) => (
                    <motion.div key={dept.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {dept.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</p>
                          <p className="text-[10px] text-slate-500">{dept.totalIssues} total</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Resolution Rate</span>
                          <span className="font-medium text-emerald-600">{Math.round(dept.resolutionRate * 100)}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(dept.resolutionRate * 100)}%` }} transition={{ duration: 0.8 }}
                            className="h-full bg-emerald-500 rounded-full" />
                        </div>
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-slate-500">Resolved: <span className="text-slate-700 dark:text-slate-300 font-medium">{dept.resolvedIssues}</span></span>
                          <span className="text-slate-500">Open: <span className="text-slate-700 dark:text-slate-300 font-medium">{dept.openIssues}</span></span>
                          <span className="text-slate-500">Critical: <span className="text-red-500 font-medium">{dept.criticalIssues}</span></span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {issues.slice(0, 10).map((issue, i) => (
                    <motion.div key={issue._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', STATUS_DOT[issue.status] || 'bg-gray-400')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{issue.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusColor(issue.status))}>{issue.status.replace(/_/g, ' ')}</span>
                          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', getPriorityColor(issue.priority))}>{issue.priority}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(issue.createdAt)}</span>
                        </div>
                      </div>
                      <span className="text-lg flex-shrink-0">{getCategoryIcon(issue.category)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════ ISSUE QUEUE ═══════════════════════ */}
          {activeTab === 'queue' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Filters + Search */}
              <div className="glass-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search issues..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <FunnelIcon className="w-4 h-4 text-slate-400" />
                  <select value={issueFilter.status} onChange={e => { setIssueFilter(f => ({ ...f, status: e.target.value })); setCurrentPage(1); }}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                    <option value="">All Status</option>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  <select value={issueFilter.priority} onChange={e => { setIssueFilter(f => ({ ...f, priority: e.target.value })); setCurrentPage(1); }}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select value={issueFilter.category} onChange={e => { setIssueFilter(f => ({ ...f, category: e.target.value })); setCurrentPage(1); }}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                  <select value={issueFilter.department} onChange={e => { setIssueFilter(f => ({ ...f, department: e.target.value })); setCurrentPage(1); }}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                    <option value="">All Departments</option>
                    {allDepartments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                  </select>
                  <span className="text-xs text-slate-400">{filteredIssues.length} issues</span>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedIssues.size > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="glass-card p-4 flex items-center gap-3">
                  <span className="text-xs font-medium text-blue-600">{selectedIssues.size} selected</span>
                  <select value={bulkDept} onChange={e => setBulkDept(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                    <option value="">Assign Department</option>
                    {allDepartments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                  </select>
                  <select value={bulkPriority} onChange={e => setBulkPriority(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                    <option value="">Set Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button onClick={handleBulkAction} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                    Apply
                  </button>
                  <button onClick={() => setSelectedIssues(new Set())} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                    Clear
                  </button>
                </motion.div>
              )}

              {/* Issue Table */}
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <th className="w-10 p-4"><input type="checkbox" onChange={e => {
                          if (e.target.checked) setSelectedIssues(new Set(paginatedIssues.map(i => i._id)));
                          else setSelectedIssues(new Set());
                        }} className="rounded" /></th>
                        <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Issue</th>
                        <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                        <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Priority</th>
                        <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Assigned</th>
                        <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden xl:table-cell">Created</th>
                        <th className="text-right p-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedIssues.map((issue, i) => (
                        <motion.tr key={issue._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.03 * i }}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <input type="checkbox" checked={selectedIssues.has(issue._id)} onChange={() => toggleIssueSelection(issue._id)} className="rounded" />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg flex-shrink-0">{getCategoryIcon(issue.category)}</span>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{issue.title}</p>
                                {issue.location?.address && <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{issue.location.address}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell"><span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{issue.category.replace(/_/g, ' ')}</span></td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <div className={cn('w-2 h-2 rounded-full', STATUS_DOT[issue.status] || 'bg-gray-400')} />
                              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusColor(issue.status))}>{issue.status.replace(/_/g, ' ')}</span>
                            </div>
                          </td>
                          <td className="p-4 hidden lg:table-cell"><span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', getPriorityColor(issue.priority))}>{issue.priority}</span></td>
                          <td className="p-4 hidden lg:table-cell"><span className="text-xs text-slate-600 dark:text-slate-400">{issue.department || '—'}</span></td>
                          <td className="p-4 hidden xl:table-cell"><span className="text-xs text-slate-600 dark:text-slate-400">{formatDate(issue.createdAt)}</span></td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleExpandRow(issue._id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors">
                                {expandedRow === issue._id ? <ChevronUpIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                      {/* Expanded Row Detail */}
                      <AnimatePresence>
                        {expandedRow && (
                          <tr>
                            <td colSpan={8}>
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
                                <div className="p-4 space-y-4">
                                  {/* Next Status Buttons */}
                                  <div className="flex flex-wrap gap-2">
                                    <span className="text-xs font-medium text-slate-500 self-center mr-1">Transition to:</span>
                                    {getNextStatuses(issues.find(x => x._id === expandedRow)?.status || '').map(ns => (
                                      <button key={ns} onClick={() => expandedRow && handleTransition(expandedRow, ns)}
                                        className={cn('text-[10px] font-medium px-3 py-1.5 rounded-lg border-2 border-dashed transition-all hover:scale-105',
                                          'border-slate-300 dark:border-slate-600 hover:border-blue-500 text-slate-700 dark:text-slate-300 hover:text-blue-600')}>
                                        {ns.replace(/_/g, ' ')}
                                      </button>
                                    ))}
                                  </div>
                                  {/* Assign */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-500">Assign to:</span>
                                    {allDepartments.map(d => (
                                      <button key={d._id} onClick={() => expandedRow && handleAssign(expandedRow, d.name)}
                                        className="text-[10px] font-medium px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all">
                                        {d.name}
                                      </button>
                                    ))}
                                  </div>
                                  {/* Timeline */}
                                  <div>
                                    <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Timeline</h5>
                                    {timelineLoading ? (
                                      <div className="flex items-center gap-2 text-xs text-slate-400"><ArrowPathIcon className="w-3 h-3 animate-spin" /> Loading timeline...</div>
                                    ) : rowTimeline.length > 0 ? (
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {rowTimeline.map((evt) => (
                                          <div key={evt._id} className="flex items-center gap-3 text-xs">
                                            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', evt.toStatus ? (STATUS_DOT[evt.toStatus] || 'bg-gray-400') : 'bg-slate-300')} />
                                            <div>
                                              <span className="text-slate-600 dark:text-slate-400">
                                                {evt.action === 'status_changed' ? `Changed to ${evt.toStatus?.replace(/_/g, ' ')}` : evt.action}
                                                {evt.performedBy && ` by ${evt.performedBy}`}
                                              </span>
                                              <span className="text-slate-400 ml-2">{formatDate(evt.timestamp)}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400">No timeline events available.</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                      {paginatedIssues.length === 0 && (
                        <tr><td colSpan={8} className="p-8 text-center text-sm text-slate-400">No issues match the current filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
                    <ChevronLeftIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    const page = start + i;
                    if (page > totalPages) return null;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-all',
                          currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700')}>
                        {page}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
                    <ChevronRightIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  <span className="text-xs text-slate-400 ml-2">Page {currentPage} of {totalPages}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════ WORKFORCE MANAGEMENT ═══════════════════════ */}
          {activeTab === 'workforce' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept, i) => {
                  const deptUsers = users.filter(u => {
                    const assignedIssues = issues.filter(iss => iss.department === dept.name && iss.assignedTo === u._id);
                    return assignedIssues.length > 0;
                  });
                  const deptIssues = issues.filter(iss => iss.department === dept.name);
                  const activeInDept = deptIssues.filter(iss => !['resolved', 'closed', 'archived'].includes(iss.status)).length;
                  const resolvedThisMonth = deptIssues.filter(iss => {
                    const d = new Date(iss.createdAt);
                    const now = new Date();
                    return iss.status === 'resolved' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length;
                  return (
                    <motion.div key={dept.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                      className="glass-card p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          {dept.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</p>
                          {dept.head && <p className="text-[10px] text-slate-500">Head: {dept.head}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                          <p className="text-lg font-bold text-blue-600">{activeInDept}</p>
                          <p className="text-[10px] text-slate-500">Active Issues</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                          <p className="text-lg font-bold text-emerald-600">{resolvedThisMonth}</p>
                          <p className="text-[10px] text-slate-500">Resolved This Month</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                          <p className="text-lg font-bold text-orange-600">{dept.criticalIssues}</p>
                          <p className="text-[10px] text-slate-500">Critical</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                          <p className="text-lg font-bold text-violet-600">{dept.avgResolutionTime ? `${Math.round(dept.avgResolutionTime)}h` : '—'}</p>
                          <p className="text-[10px] text-slate-500">Avg Resolution</p>
                        </div>
                      </div>
                      {/* Workers */}
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Assigned Workers</p>
                        {deptUsers.length > 0 ? (
                          <div className="space-y-1.5">
                            {deptUsers.slice(0, 5).map(u => (
                              <div key={u._id} className="flex items-center gap-2 text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[8px] font-bold">
                                  {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                                </div>
                                <span className="text-slate-700 dark:text-slate-300">{u.firstName} {u.lastName}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400">No workers assigned yet</p>
                        )}
                      </div>
                      {/* Recommendation */}
                      {activeInDept > 0 && dept.resolutionRate < 0.6 && (
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                          <p className="text-[10px] text-amber-700 dark:text-amber-300">
                            <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />
                            Low resolution rate ({Math.round(dept.resolutionRate * 100)}%). Consider adding more workers.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════ SLA MONITOR ═══════════════════════ */}
          {activeTab === 'sla' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* SLA Gauge */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-6">SLA Compliance Overview</h3>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative w-48 h-48 flex-shrink-0">
                    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="12"
                        className="text-slate-200 dark:text-slate-700" />
                      <circle cx="60" cy="60" r="50" fill="none" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${(slaSummary.complianceRate / 100) * 314} 314`}
                        className={cn(slaSummary.complianceRate >= 80 ? 'text-emerald-500' : slaSummary.complianceRate >= 50 ? 'text-amber-500' : 'text-red-500')} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">{slaSummary.complianceRate}%</p>
                      <p className="text-[10px] text-slate-500">Compliance</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{slaSummary.within}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Within SLA</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-center">
                      <p className="text-2xl font-bold text-amber-600">{slaSummary.atRisk}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">At Risk</p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-center">
                      <p className="text-2xl font-bold text-red-600">{slaSummary.breached}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Breached</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* At Risk + Breached Issues */}
              <div className="glass-card p-6">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Issues Approaching Deadline</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Issue</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Priority</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">SLA Status</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.filter(i => !['resolved', 'closed', 'archived'].includes(i.status)).map((issue) => {
                        const sla = getSlaStatus(issue);
                        if (sla.label === 'Within SLA') return null;
                        return (
                          <tr key={issue._id} className={cn('border-b border-slate-100 dark:border-slate-800 transition-colors',
                            sla.label === 'SLA Breached' && 'bg-red-50/50 dark:bg-red-900/10',
                            sla.label === 'At Risk' && 'bg-amber-50/50 dark:bg-amber-900/10')}>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {sla.label === 'SLA Breached' ? <FireIcon className="w-4 h-4 text-red-500 flex-shrink-0" /> :
                                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                <p className="text-sm font-medium text-slate-900 dark:text-white max-w-[200px] truncate">{issue.title}</p>
                              </div>
                            </td>
                            <td className="p-3"><span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', getPriorityColor(issue.priority))}>{issue.priority}</span></td>
                            <td className="p-3"><span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusColor(issue.status))}>{issue.status.replace(/_/g, ' ')}</span></td>
                            <td className="p-3">
                              <span className={cn('text-xs font-medium', sla.color)}>{sla.label}</span>
                              {sla.remaining > 0 && (
                                <p className="text-[10px] text-slate-400">{Math.round(sla.remaining)}h remaining</p>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleTransition(issue._id, getNextStatuses(issue.status)[0] || 'in_progress')}
                                className="px-3 py-1 text-[10px] font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1">
                                <BoltIcon className="w-3 h-3" /> Escalate
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════ INCIDENT TIMELINE ═══════════════════════ */}
          {activeTab === 'timeline' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Filters */}
              <div className="glass-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                  <select value={timelineDeptFilter} onChange={e => setTimelineDeptFilter(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                    <option value="">All Departments</option>
                    {allDepartments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                  </select>
                  <select value={timelinePriorityFilter} onChange={e => setTimelinePriorityFilter(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <input type="date" value={timelineDateFrom} onChange={e => setTimelineDateFrom(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs text-slate-400">to</span>
                  <input type="date" value={timelineDateTo} onChange={e => setTimelineDateTo(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs text-slate-400 ml-auto">{filteredTimeline.length} events</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="glass-card p-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-6">
                    {filteredTimeline.slice(0, 30).map((evt, i) => (
                      <motion.div key={evt._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.02 * i }}
                        className="relative flex items-start gap-4 pl-8">
                        <div className={cn('absolute left-3 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900',
                          evt.toStatus ? (STATUS_DOT[evt.toStatus] || 'bg-gray-400') : 'bg-slate-300')} />
                        <div className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{evt.issueTitle || evt.issueId}</p>
                            <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{formatDate(evt.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {evt.toStatus && (
                              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusColor(evt.toStatus))}>
                                {evt.toStatus.replace(/_/g, ' ')}
                              </span>
                            )}
                            {evt.department && <span className="text-[10px] text-slate-400">{evt.department}</span>}
                            {evt.priority && <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', getPriorityColor(evt.priority))}>{evt.priority}</span>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredTimeline.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">No timeline events match the current filters.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════ EMERGENCY COORDINATION ═══════════════════════ */}
          {activeTab === 'emergency' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Critical Issues Banner */}
              {criticalIssues.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FireIcon className="w-5 h-5 text-red-500" />
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-300">Active Critical Issues ({criticalIssues.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {criticalIssues.slice(0, 5).map(issue => (
                      <div key={issue._id} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="truncate">{issue.title}</span>
                        <span className="text-[10px] text-red-400 ml-auto">{formatDate(issue.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Alerts */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Active Alerts</h3>
                    <button onClick={() => setShowAlertForm(!showAlertForm)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors">
                      <PlusIcon className="w-3.5 h-3.5" /> New Alert
                    </button>
                  </div>

                  {showAlertForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 space-y-3">
                      <input type="text" placeholder="Alert title..." value={newAlert.title} onChange={e => setNewAlert({ ...newAlert, title: e.target.value })}
                        className="w-full text-xs rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-red-500" />
                      <select value={newAlert.severity} onChange={e => setNewAlert({ ...newAlert, severity: e.target.value })}
                        className="text-xs rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-700 dark:text-slate-300">
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleCreateAlert} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Create</button>
                        <button onClick={() => setShowAlertForm(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    {emergencyAlerts.map((alert) => (
                      <div key={alert.id} className={cn('p-3 rounded-xl border transition-all',
                        alert.active ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 opacity-50')}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {alert.active && <BellAlertIcon className="w-4 h-4 text-red-500 animate-pulse" />}
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{alert.title}</span>
                          </div>
                          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full',
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-amber-100 text-amber-800')}>
                            {alert.severity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400">{formatDate(alert.createdAt)}</span>
                          <button onClick={() => toggleAlert(alert.id)}
                            className={cn('text-[10px] font-medium px-2 py-0.5 rounded transition-colors',
                              alert.active ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20' : 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/20')}>
                            {alert.active ? 'Dismiss' : 'Reactivate'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {emergencyAlerts.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No alerts.</p>}
                  </div>
                </div>

                {/* Resource Allocation */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Resource Allocation</h3>
                  <div className="space-y-4">
                    {departments.map((dept, i) => {
                      const deptActive = issues.filter(iss => iss.department === dept.name && !['resolved', 'closed', 'archived'].includes(iss.status)).length;
                      const deptCritical = issues.filter(iss => iss.department === dept.name && iss.priority === 'critical' && !['resolved', 'closed', 'archived'].includes(iss.status)).length;
                      const maxLoad = Math.max(...departments.map(d => issues.filter(iss => iss.department === d.name && !['resolved', 'closed', 'archived'].includes(iss.status)).length), 1);
                      const loadPct = Math.round((deptActive / maxLoad) * 100);
                      return (
                        <div key={dept.name} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{dept.name}</span>
                            <div className="flex items-center gap-2">
                              {deptCritical > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                                  <FireIcon className="w-3 h-3" /> {deptCritical} critical
                                </span>
                              )}
                              <span className="text-xs text-slate-500">{deptActive} active</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${loadPct}%` }} transition={{ duration: 0.8 }}
                              className={cn('h-full rounded-full', loadPct > 80 ? 'bg-red-500' : loadPct > 50 ? 'bg-amber-500' : 'bg-blue-500')} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Emergency Contacts */}
                  <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Emergency Contacts</h4>
                    <div className="space-y-2">
                      {[
                        { role: 'Fire Department', phone: '911' },
                        { role: 'Police', phone: '911' },
                        { role: 'Emergency Management', phone: '(555) 100-2000' },
                        { role: 'Utilities Emergency', phone: '(555) 200-3000' },
                      ].map((contact) => (
                        <div key={contact.role} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{contact.role}</span>
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                            <PhoneIcon className="w-3.5 h-3.5" /> {contact.phone}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
