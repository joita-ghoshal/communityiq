'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersIcon, BuildingOffice2Icon, ClipboardDocumentListIcon,
  Cog6ToothIcon, PlusIcon, TrashIcon, PencilSquareIcon,
  CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon,
  ChevronDownIcon, ArrowPathIcon, ShieldCheckIcon,
  ChartBarIcon, BellIcon, DocumentTextIcon,
  ServerIcon, ExclamationTriangleIcon, EyeIcon,
  FunnelIcon, ChevronLeftIcon, ChevronRightIcon,
  SparklesIcon, UserGroupIcon, ClockIcon,
  FireIcon, BoltIcon, AcademicCapIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'users' | 'departments' | 'roles' | 'issues' | 'notifications' | 'audit' | 'system' | 'settings' | 'emergency';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  departmentId?: string;
  isActive: boolean;
  createdAt: string;
  phone?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  headId?: string;
  headName?: string;
}

interface AdminRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  submittedBy?: string;
  createdAt: string;
  priority?: string;
  category?: string;
  departmentId?: string;
  departmentName?: string;
}

interface DashboardStats {
  totalUsers?: number;
  totalIssues?: number;
  totalDepartments?: number;
  activeUsers?: number;
  pendingIssues?: number;
  resolvedIssues?: number;
  recentActivity?: { action: string; timestamp: string; user?: string }[];
  [key: string]: any;
}

interface AuditLogEntry {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

interface AuditStats {
  totalLogs?: number;
  logsToday?: number;
  actionsBreakdown?: Record<string, number>;
  [key: string]: any;
}

interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt: string;
  recipientId?: string;
}

interface KpiData {
  averageResolutionTime?: number;
  responseRate?: number;
  satisfactionScore?: number;
  issuesPerDay?: number;
  [key: string]: any;
}

const ROLES = [
  { value: 'citizen', label: 'Citizen', color: 'default', level: 1, permissions: ['Report issues', 'View own issues', 'Comment on issues'] },
  { value: 'volunteer', label: 'Volunteer', color: 'success', level: 2, permissions: ['All citizen permissions', 'Assign self to issues', 'Update issue status', 'View department issues'] },
  { value: 'department_admin', label: 'Department Admin', color: 'warning', level: 3, permissions: ['All volunteer permissions', 'Manage department members', 'Assign issues to members', 'View department analytics', 'Review department requests'] },
  { value: 'municipal_admin', label: 'Municipal Admin', color: 'danger', level: 4, permissions: ['All department admin permissions', 'Manage all departments', 'View system analytics', 'Manage system settings', 'Review all requests'] },
  { value: 'super_admin', label: 'Super Admin', color: 'danger', level: 5, permissions: ['Full system access', 'Manage all users', 'Manage roles & permissions', 'System configuration', 'Audit log access', 'Emergency management'] },
] as const;

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];
const CATEGORY_OPTIONS = ['road_damage', 'water_supply', 'sanitation', 'electricity', 'garbage', 'drainage', 'street_lighting', 'public_safety', 'noise_pollution', 'air_pollution', 'parks_green', 'traffic', 'building_safety', 'flooding', 'animal_control', 'other'];

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  return <div className={cn('animate-spin rounded-full border-4 border-blue-500 border-t-transparent', s)} />;
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-slate-500 dark:text-slate-400 font-medium">{title}</p>
      {description && <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{description}</p>}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-red-500 font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-sm mt-3">
          <ArrowPathIcon className="w-4 h-4 inline mr-1" /> Retry
        </button>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        let pageNum: number;
        if (totalPages <= 7) {
          pageNum = i + 1;
        } else if (page <= 4) {
          pageNum = i + 1;
        } else if (page >= totalPages - 3) {
          pageNum = totalPages - 6 + i;
        } else {
          pageNum = page - 3 + i;
        }
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
              pageNum === page
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            )}
          >
            {pageNum}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/');
      toast.error('Access denied');
    }
  }, [user, authLoading, router]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'departments', label: 'Departments', icon: BuildingOffice2Icon },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheckIcon },
    { id: 'issues', label: 'Issues', icon: ClipboardDocumentListIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'audit', label: 'Audit Logs', icon: DocumentTextIcon },
    { id: 'system', label: 'System Health', icon: ServerIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
    { id: 'emergency', label: 'Emergency', icon: ExclamationTriangleIcon },
  ];

  if (authLoading) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center">
          <p className="text-slate-500">Access denied. Super admin only.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-full">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">Enterprise Admin Panel</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">System administration and management console</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="danger">Super Admin</Badge>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'departments' && <DepartmentsTab />}
            {activeTab === 'roles' && <RolesTab />}
            {activeTab === 'issues' && <IssuesTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'audit' && <AuditTab />}
            {activeTab === 'system' && <SystemHealthTab />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab === 'emergency' && <EmergencyTab />}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [kpis, setKpis] = useState<KpiData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, kpisRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/analytics/kpis'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data || statsRes.value.data || {});
      if (kpisRes.status === 'fulfilled') setKpis(kpisRes.value.data?.data || kpisRes.value.data || {});
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  if (loading) return <div className="glass-card p-6"><div className="flex justify-center py-16"><Spinner /></div></div>;
  if (error) return <div className="glass-card p-6"><ErrorState message={error} onRetry={fetchOverview} /></div>;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: UsersIcon, color: 'from-blue-500 to-indigo-600' },
    { label: 'Total Issues', value: stats.totalIssues ?? 0, icon: ClipboardDocumentListIcon, color: 'from-emerald-500 to-teal-600' },
    { label: 'Departments', value: stats.totalDepartments ?? 0, icon: BuildingOffice2Icon, color: 'from-violet-500 to-purple-600' },
    { label: 'Active Users', value: stats.activeUsers ?? 0, icon: UserGroupIcon, color: 'from-amber-500 to-orange-600' },
    { label: 'Pending Issues', value: stats.pendingIssues ?? 0, icon: ClockIcon, color: 'from-rose-500 to-pink-600' },
    { label: 'Resolved Issues', value: stats.resolvedIssues ?? 0, icon: CheckCircleIcon, color: 'from-cyan-500 to-blue-600' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card-strong p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{card.value.toLocaleString()}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', card.color)}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPIs */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-amber-500" /> Key Performance Indicators
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Avg Resolution Time', value: kpis.averageResolutionTime != null ? `${kpis.averageResolutionTime}h` : 'N/A', icon: ClockIcon },
              { label: 'Response Rate', value: kpis.responseRate != null ? `${kpis.responseRate}%` : 'N/A', icon: BoltIcon },
              { label: 'Satisfaction Score', value: kpis.satisfactionScore != null ? `${kpis.satisfactionScore}/5` : 'N/A', icon: AcademicCapIcon },
              { label: 'Issues Per Day', value: kpis.issuesPerDay != null ? kpis.issuesPerDay.toString() : 'N/A', icon: ChartBarIcon },
            ].map((kpi) => (
              <div key={kpi.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <kpi.icon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{kpi.label}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FireIcon className="w-5 h-5 text-red-500" /> Recent Activity
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {(stats.recentActivity || []).length > 0 ? (
              stats.recentActivity!.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.user && <span className="text-xs text-slate-500">{activity.user}</span>}
                      <span className="text-xs text-slate-400">{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={ClockIcon} title="No recent activity" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

  const fetchUsers = useCallback(async (p = page, role = roleFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: p, limit: 20 };
      if (role) params.role = role;
      const { data } = await api.get('/admin/users', { params });
      const res = data.data || data;
      setUsers(res.users || res || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data.data?.departments || data.departments || data.data || data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchDepartments(); }, []);
  useEffect(() => { fetchUsers(page, roleFilter); }, [page, roleFilter]);

  const handleUpdateRole = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: editRole });
      toast.success('Role updated');
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleAssignDepartment = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/department`, { departmentId: editDepartment });
      toast.success('Department assigned');
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to assign department');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q));
  }, [users, search]);

  const getRoleBadge = (role: string) => {
    const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'default'> = {
      citizen: 'default', volunteer: 'success', department_admin: 'warning',
      municipal_admin: 'danger', super_admin: 'danger',
    };
    return <Badge variant={map[role] || 'default'}>{role.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Management</h2>
          <p className="text-sm text-slate-500">{total} total users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 !py-2 text-sm w-56"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="input-field !py-2 text-sm w-40"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={() => fetchUsers()} className="btn-ghost text-sm">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchUsers()} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white whitespace-nowrap">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="py-3 px-4">
                      {editingUser === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="input-field !py-1 !px-2 text-xs w-36"
                          >
                            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <button onClick={() => handleUpdateRole(u.id)} className="text-green-500 hover:text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-500">
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => { setEditingUser(u.id); setEditRole(u.role); setEditDepartment(u.departmentId || ''); }}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {getRoleBadge(u.role)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                      {editingUser === u.id ? (
                        <select
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          className="input-field !py-1 !px-2 text-xs w-36"
                        >
                          <option value="">None</option>
                          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      ) : (
                        u.department || <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {editingUser === u.id ? (
                          <>
                            <button
                              onClick={() => { handleAssignDepartment(u.id); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Save department"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingUser(u.id); setEditRole(u.role); setEditDepartment(u.departmentId || ''); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Edit"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeactivate(u.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Deactivate"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6}><EmptyState icon={UsersIcon} title="No users found" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </motion.div>
  );
}

function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [assignHeadId, setAssignHeadId] = useState<string | null>(null);
  const [headValue, setHeadValue] = useState('');

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data.data?.departments || data.departments || data.data || data || []);
    } catch {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/users', { params: { limit: 200 } });
      const res = data.data || data;
      setUsers(res.users || res || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchDepartments(); fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Enter department name'); return; }
    try {
      await api.post('/admin/departments', { name: newName, description: newDesc });
      toast.success('Department created');
      setNewName(''); setNewDesc('');
      fetchDepartments();
    } catch {
      toast.error('Failed to create department');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) { toast.error('Enter department name'); return; }
    try {
      await api.patch(`/admin/departments/${id}`, { name: editName, description: editDesc });
      toast.success('Department updated');
      setEditingId(null);
      fetchDepartments();
    } catch {
      toast.error('Failed to update department');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    try {
      await api.delete(`/admin/departments/${id}`);
      toast.success('Department deleted');
      fetchDepartments();
    } catch {
      toast.error('Failed to delete department');
    }
  };

  const handleAssignHead = async (id: string) => {
    try {
      await api.patch(`/admin/departments/${id}`, { headId: headValue || null });
      toast.success('Department head updated');
      setAssignHeadId(null);
      fetchDepartments();
    } catch {
      toast.error('Failed to update department head');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Create Department */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create Department</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Department name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input-field !py-2 text-sm flex-1"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="input-field !py-2 text-sm flex-1"
          />
          <button onClick={handleCreate} className="btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 !py-2 !px-4 text-sm whitespace-nowrap flex items-center gap-1">
            <PlusIcon className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {/* Department List */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Departments ({departments.length})</h3>
          <button onClick={fetchDepartments} className="btn-ghost text-sm"><ArrowPathIcon className="w-4 h-4" /> Refresh</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDepartments} />
        ) : (
          <div className="space-y-3">
            {departments.map((dept) => (
              <div key={dept.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                {editingId === dept.id ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field !py-2 text-sm flex-1" placeholder="Name" />
                      <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="input-field !py-2 text-sm flex-1" placeholder="Description" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(dept.id)} className="btn-primary !py-1.5 !px-3 text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary !py-1.5 !px-3 text-xs">Cancel</button>
                    </div>
                  </div>
                ) : assignHeadId === dept.id ? (
                  <div className="flex items-center gap-3">
                    <select value={headValue} onChange={(e) => setHeadValue(e.target.value)} className="input-field !py-2 text-sm flex-1">
                      <option value="">No Head</option>
                      {users.filter((u) => u.role === 'department_admin' || u.role === 'municipal_admin').map((u) => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                      ))}
                    </select>
                    <button onClick={() => handleAssignHead(dept.id)} className="btn-primary !py-1.5 !px-3 text-xs">Assign</button>
                    <button onClick={() => setAssignHeadId(null)} className="btn-secondary !py-1.5 !px-3 text-xs">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{dept.name}</h4>
                      {dept.description && <p className="text-xs text-slate-500 mt-1">{dept.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        {dept.memberCount !== undefined && <span className="text-xs text-slate-400">{dept.memberCount} members</span>}
                        {dept.headName && <Badge variant="info">Head: {dept.headName}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingId(dept.id); setEditName(dept.name); setEditDesc(dept.description || ''); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setAssignHeadId(dept.id); setHeadValue(dept.headId || ''); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        title="Assign head"
                      >
                        <UserGroupIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {departments.length === 0 && <EmptyState icon={BuildingOffice2Icon} title="No departments yet" description="Create one above to get started" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RolesTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/admin/users', { params: { limit: 500 } });
        const res = data.data || data;
        setUsers(res.users || res || []);
      } catch {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRoleChange = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      setEditingUserId(null);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      toast.error('Failed to update role');
    }
  };

  const usersByRole = useMemo(() => {
    const grouped: Record<string, AdminUser[]> = {};
    ROLES.forEach((r) => { grouped[r.value] = []; });
    users.forEach((u) => {
      if (grouped[u.role]) grouped[u.role].push(u);
      else grouped[u.role] = [u];
    });
    return grouped;
  }, [users]);

  const badgeVariant = (v: string): 'default' | 'success' | 'warning' | 'danger' | 'default' => {
    const map: Record<string, any> = { default: 'default', success: 'success', warning: 'warning', danger: 'danger', info: 'default' };
    return map[v] || 'default';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLES.map((role) => (
          <div
            key={role.value}
            onClick={() => setSelectedRole(selectedRole === role.value ? null : role.value)}
            className={cn(
              'glass-card-strong p-5 cursor-pointer transition-all hover:scale-[1.02]',
              selectedRole === role.value && 'ring-2 ring-blue-500'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <Badge variant={badgeVariant(role.color)}>{role.label}</Badge>
              <span className="text-xs text-slate-400">Level {role.level}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{(usersByRole[role.value] || []).length}</p>
            <p className="text-xs text-slate-500 mt-1">users with this role</p>
          </div>
        ))}
      </div>

      {/* Permission Details */}
      {selectedRole && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            {ROLES.find((r) => r.value === selectedRole)?.label} — Permissions
          </h3>
          <div className="space-y-2 mb-6">
            {(ROLES.find((r) => r.value === selectedRole)?.permissions || []).map((perm, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{perm}</span>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Users with this role</h4>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : error ? (
            <ErrorState message={error} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">User</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Email</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(usersByRole[selectedRole] || []).map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 px-3 text-slate-900 dark:text-white">{u.firstName} {u.lastName}</td>
                      <td className="py-2 px-3 text-slate-500">{u.email}</td>
                      <td className="py-2 px-3 text-right">
                        {editingUserId === u.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="input-field !py-1 !px-2 text-xs w-32">
                              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                            <button onClick={() => handleRoleChange(u.id)} className="text-green-500"><CheckCircleIcon className="w-4 h-4" /></button>
                            <button onClick={() => setEditingUserId(null)} className="text-slate-400"><XCircleIcon className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingUserId(u.id); setNewRole(u.role); }}
                            className="btn-ghost text-xs"
                          >
                            <PencilSquareIcon className="w-3 h-3 inline mr-1" /> Change
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(usersByRole[selectedRole] || []).length === 0 && (
                    <tr><td colSpan={3} className="py-4 text-center text-slate-500">No users with this role</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function IssuesTab() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      const { data } = await api.get('/admin/requests', { params });
      setRequests(data.data?.requests || data.requests || data.data || data || []);
    } catch {
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data.data?.departments || data.departments || data.data || data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchIssues(); fetchDepartments(); }, []);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/requests/${id}/review`, { status });
      toast.success(`Issue ${status}`);
      fetchIssues();
    } catch {
      toast.error('Failed to review issue');
    }
  };

  const handleAssignDept = async (id: string, departmentId: string) => {
    try {
      await api.patch(`/admin/requests/${id}/review`, { departmentId, status: 'in_progress' });
      toast.success('Assigned to department');
      fetchIssues();
    } catch {
      toast.error('Failed to assign');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return requests;
    const q = search.toLowerCase();
    return requests.filter((r) => (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q));
  }, [requests, search]);

  const statusBadge = (s: string) => {
    const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'default'> = {
      open: 'default', pending: 'warning', in_progress: 'default', approved: 'success', resolved: 'success', rejected: 'danger', closed: 'default',
    };
    return <Badge variant={map[s] || 'default'}>{s?.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Issue Management ({filtered.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search issues..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 !py-2 text-sm w-48" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }} className="input-field !py-2 text-sm w-32">
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); }} className="input-field !py-2 text-sm w-32">
            <option value="">All Priority</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); }} className="input-field !py-2 text-sm w-36">
            <option value="">All Category</option>
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={fetchIssues} className="btn-ghost text-sm"><ArrowPathIcon className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchIssues} />
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{req.title}</h4>
                    {statusBadge(req.status)}
                    {req.priority && <Badge variant={req.priority === 'critical' ? 'danger' : req.priority === 'high' ? 'warning' : 'default'}>{req.priority}</Badge>}
                    {req.category && <Badge variant="info">{req.category}</Badge>}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{req.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {req.submittedBy && <span className="text-xs text-slate-400">by {req.submittedBy}</span>}
                    <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                    {req.departmentName && <Badge variant="default">{req.departmentName}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    onChange={(e) => { if (e.target.value) handleAssignDept(req.id, e.target.value); e.target.value = ''; }}
                    className="input-field !py-1 !px-2 text-xs w-28"
                    defaultValue=""
                  >
                    <option value="" disabled>Assign...</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {req.status !== 'approved' && req.status !== 'rejected' && (
                    <>
                      <button onClick={() => handleReview(req.id, 'approved')} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Approve">
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleReview(req.id, 'rejected')} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject">
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState icon={ClipboardDocumentListIcon} title="No issues found" description="Adjust your filters or check back later" />}
        </div>
      )}
    </motion.div>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [sendTitle, setSendTitle] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendType, setSendType] = useState('default');
  const [sending, setSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data?.notifications || data.notifications || data.data || data || []);
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  const handleSend = async () => {
    if (!sendTitle.trim() || !sendMessage.trim()) { toast.error('Fill all fields'); return; }
    setSending(true);
    try {
      await api.post('/notifications', { title: sendTitle, message: sendMessage, type: sendType, broadcast: true });
      toast.success('Notification sent');
      setShowSend(false);
      setSendTitle(''); setSendMessage(''); setSendType('default');
      fetchNotifications();
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const typeIcon = (type?: string) => {
    switch (type) {
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />;
      case 'danger': return <FireIcon className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default: return <BellIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Send Notification */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send System Notification</h3>
          <button onClick={() => setShowSend(!showSend)} className="btn-ghost text-sm">
            {showSend ? 'Cancel' : <><PlusIcon className="w-4 h-4 inline mr-1" /> Compose</>}
          </button>
        </div>
        <AnimatePresence>
          {showSend && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  <input type="text" placeholder="Title" value={sendTitle} onChange={(e) => setSendTitle(e.target.value)} className="input-field !py-2 text-sm flex-1" />
                  <select value={sendType} onChange={(e) => setSendType(e.target.value)} className="input-field !py-2 text-sm w-32">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Urgent</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                <textarea placeholder="Message content..." value={sendMessage} onChange={(e) => setSendMessage(e.target.value)} className="input-field !py-2 text-sm min-h-[80px] w-full" />
                <button onClick={handleSend} disabled={sending} className="btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 !py-2 !px-4 text-sm disabled:opacity-50">
                  {sending ? <Spinner size="sm" /> : 'Send Notification'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notification History */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notification History</h3>
          <button onClick={fetchNotifications} className="btn-ghost text-sm"><ArrowPathIcon className="w-4 h-4" /> Refresh</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchNotifications} />
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className={cn('p-4 rounded-xl border transition-colors', n.read ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800')}>
                <div className="flex items-start gap-3">
                  {typeIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{n.title}</h4>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                    <span className="text-xs text-slate-400 mt-2 block">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <EmptyState icon={BellIcon} title="No notifications" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: p, limit: 50 };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;
      const { data } = await api.get('/audit/logs', { params });
      const res = data.data || data;
      setLogs(res.logs || res || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/audit/stats');
      setStats(data.data || data || {});
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchLogs(1); fetchStats(); }, []);
  useEffect(() => { fetchLogs(page); }, [page, actionFilter, entityFilter]);

  const actionBadge = (action: string) => {
    if (action.includes('create') || action.includes('add')) return <Badge variant="success">{action}</Badge>;
    if (action.includes('delete') || action.includes('remove')) return <Badge variant="danger">{action}</Badge>;
    if (action.includes('update') || action.includes('edit') || action.includes('patch')) return <Badge variant="warning">{action}</Badge>;
    return <Badge variant="info">{action}</Badge>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card-strong p-4">
          <p className="text-sm text-slate-500">Total Logs</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalLogs ?? 0}</p>
        </div>
        <div className="glass-card-strong p-4">
          <p className="text-sm text-slate-500">Today's Logs</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.logsToday ?? 0}</p>
        </div>
        <div className="glass-card-strong p-4">
          <p className="text-sm text-slate-500">Action Types</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.actionsBreakdown ? Object.keys(stats.actionsBreakdown).length : 0}</p>
        </div>
      </div>

      {/* Filters & Logs */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audit Trail</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by action..."
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="input-field !py-2 text-sm w-40"
            />
            <input
              type="text"
              placeholder="Filter by entity..."
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              className="input-field !py-2 text-sm w-40"
            />
            <button onClick={() => { setPage(1); fetchLogs(1); }} className="btn-ghost text-sm"><ArrowPathIcon className="w-4 h-4" /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchLogs()} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">Timestamp</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">User</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">Action</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">Entity</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">Details</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{log.userName || log.userId || '—'}</td>
                      <td className="py-3 px-3">{actionBadge(log.action)}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{log.entity}</td>
                      <td className="py-3 px-3 text-slate-500 text-xs max-w-[200px] truncate">{log.details || '—'}</td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{log.ipAddress || '—'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={6}><EmptyState icon={DocumentTextIcon} title="No audit logs" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </motion.div>
  );
}

function SystemHealthTab() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = Date.now();
      const statsRes = await api.get('/analytics/dashboard');
      const latency = Date.now() - start;
      setStats(statsRes.data?.data || statsRes.data || {});
      setApiHealth(latency < 2000 ? 'healthy' : latency < 5000 ? 'degraded' : 'down');
    } catch {
      setError('Failed to load system health');
      setApiHealth('down');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, []);

  const healthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-amber-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const healthBadge = (status: string): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      default: return 'danger';
    }
  };

  const systemItems = [
    { label: 'API Server', status: apiHealth, detail: 'Backend API endpoint' },
    { label: 'Database', status: stats.dbStatus || (error ? 'down' : 'healthy'), detail: 'PostgreSQL connection' },
    { label: 'File Storage', status: stats.storageStatus || 'healthy', detail: 'File upload service' },
    { label: 'Email Service', status: stats.emailStatus || 'healthy', detail: 'SMTP delivery' },
    { label: 'Cache Layer', status: stats.cacheStatus || 'healthy', detail: 'Redis caching' },
    { label: 'Background Jobs', status: stats.jobsStatus || 'healthy', detail: 'Queue workers' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">System Health Monitor</h2>
        <button onClick={fetchHealth} className="btn-ghost text-sm"><ArrowPathIcon className="w-4 h-4" /> Refresh</button>
      </div>

      {loading ? (
        <div className="glass-card p-6"><div className="flex justify-center py-16"><Spinner /></div></div>
      ) : error ? (
        <div className="glass-card p-6"><ErrorState message={error} onRetry={fetchHealth} /></div>
      ) : (
        <>
          {/* Service Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemItems.map((item) => (
              <div key={item.label} className="glass-card-strong p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2.5 h-2.5 rounded-full', healthColor(item.status))} />
                    <span className="font-medium text-sm text-slate-900 dark:text-white">{item.label}</span>
                  </div>
                  <Badge variant={healthBadge(item.status)}>{item.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 ml-[18px]">{item.detail}</p>
              </div>
            ))}
          </div>

          {/* System Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ServerIcon className="w-5 h-5 text-blue-500" /> System Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Uptime', value: stats.uptime || 'N/A' },
                { label: 'Environment', value: stats.environment || process.env.NODE_ENV || 'production' },
                { label: 'Node Version', value: stats.nodeVersion || 'v18+' },
                { label: 'Total Users', value: (stats.totalUsers ?? 0).toString() },
                { label: 'Total Issues', value: (stats.totalIssues ?? 0).toString() },
                { label: 'Active Sessions', value: stats.activeSessions?.toString() || 'N/A' },
                { label: 'Memory Usage', value: stats.memoryUsage || 'N/A' },
                { label: 'CPU Load', value: stats.cpuLoad || 'N/A' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState({
    platformName: 'FixMyCity',
    contactEmail: '',
    contactPhone: '',
    maintenanceMode: false,
    emailNotifications: true,
    autoAssign: false,
    aiAnalysis: true,
    publicRegistration: true,
    maxIssuesPerUser: 10,
    issueExpiryDays: 30,
    defaultPriority: 'medium',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/settings');
        const d = data?.data || data || {};
        setSettings((s) => ({
          ...s,
          platformName: d.platformName || s.platformName,
          contactEmail: d.contactEmail || s.contactEmail,
          contactPhone: d.contactPhone || s.contactPhone,
          maintenanceMode: d.maintenanceMode ?? s.maintenanceMode,
          emailNotifications: d.emailNotifications ?? s.emailNotifications,
          autoAssign: d.autoAssign ?? s.autoAssign,
          aiAnalysis: d.aiAnalysis ?? s.aiAnalysis,
          publicRegistration: d.publicRegistration ?? s.publicRegistration,
        }));
      } catch { /* use defaults */ }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };

  if (loading) return <div className="glass-card p-6"><div className="flex justify-center py-16"><Spinner /></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Platform Info */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Platform Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Platform Name</label>
            <input type="text" value={settings.platformName} onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))} className="input-field !py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Contact Email</label>
            <input type="email" value={settings.contactEmail} onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))} className="input-field !py-2 text-sm w-full" placeholder="admin@fixmycity.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Contact Phone</label>
            <input type="tel" value={settings.contactPhone} onChange={(e) => setSettings((s) => ({ ...s, contactPhone: e.target.value }))} className="input-field !py-2 text-sm w-full" placeholder="+1 (555) 000-0000" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Default Issue Priority</label>
            <select value={settings.defaultPriority} onChange={(e) => setSettings((s) => ({ ...s, defaultPriority: e.target.value }))} className="input-field !py-2 text-sm w-full">
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">System Toggles</h3>
        <div className="space-y-3">
          {[
            { key: 'maintenanceMode' as const, label: 'Maintenance Mode', desc: 'Temporarily disable public access', danger: true },
            { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Send email alerts for new issues' },
            { key: 'autoAssign' as const, label: 'Auto-Assign Issues', desc: 'Automatically assign issues to departments' },
            { key: 'aiAnalysis' as const, label: 'AI Analysis', desc: 'Enable AI-powered issue analysis' },
            { key: 'publicRegistration' as const, label: 'Public Registration', desc: 'Allow new user signups' },
          ].map((setting) => (
            <div key={setting.key} className={cn(
              'flex items-center justify-between p-4 rounded-xl border transition-colors',
              setting.danger && settings[setting.key]
                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            )}>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{setting.label}</p>
                <p className="text-xs text-slate-500">{setting.desc}</p>
              </div>
              <button
                onClick={() => toggleSetting(setting.key)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  settings[setting.key]
                    ? setting.danger ? 'bg-red-600' : 'bg-blue-600'
                    : 'bg-slate-300 dark:bg-slate-600'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  settings[setting.key] && 'translate-x-5'
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Numeric Settings */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Limits & Policies</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Max Issues Per User</label>
            <input type="number" min={1} max={100} value={settings.maxIssuesPerUser} onChange={(e) => setSettings((s) => ({ ...s, maxIssuesPerUser: parseInt(e.target.value) || 10 }))} className="input-field !py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Issue Expiry (days)</label>
            <input type="number" min={1} max={365} value={settings.issueExpiryDays} onChange={(e) => setSettings((s) => ({ ...s, issueExpiryDays: parseInt(e.target.value) || 30 }))} className="input-field !py-2 text-sm w-full" />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 !py-2.5 !px-6 text-sm disabled:opacity-50 flex items-center gap-2">
          {saving ? <Spinner size="sm" /> : <Cog6ToothIcon className="w-4 h-4" />}
          Save Settings
        </button>
      </div>
    </motion.div>
  );
}

function EmergencyTab() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newSeverity, setNewSeverity] = useState('high');
  const [creating, setCreating] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/emergency/alerts');
      setAlerts(data.data?.alerts || data.alerts || data.data || data || []);
    } catch {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newMessage.trim()) { toast.error('Fill all fields'); return; }
    setCreating(true);
    try {
      await api.post('/emergency/alerts', { type: 'public_safety', title: newTitle, description: newMessage, severity: newSeverity });
      toast.success('Emergency alert created');
      setShowCreate(false);
      setNewTitle(''); setNewMessage(''); setNewSeverity('high');
      fetchAlerts();
    } catch {
      toast.error('Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.patch(`/emergency/alerts/${id}/resolve`);
      toast.success('Alert resolved');
      fetchAlerts();
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const severityBadge = (s: string): 'default' | 'success' | 'warning' | 'danger' => {
    switch (s) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'default';
      default: return 'default';
    }
  };

  const severityIcon = (s: string) => {
    switch (s) {
      case 'critical': return <FireIcon className="w-5 h-5 text-red-500" />;
      case 'high': return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
      case 'medium': return <BellIcon className="w-5 h-5 text-blue-500" />;
      default: return <BellIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Create Alert */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" /> Emergency Alert Management
          </h3>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary bg-gradient-to-r from-red-600 to-rose-600 !py-2 !px-4 text-sm">
            {showCreate ? 'Cancel' : <><PlusIcon className="w-4 h-4 inline mr-1" /> Create Alert</>}
          </button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 space-y-3 mb-4">
                <div className="flex gap-3">
                  <input type="text" placeholder="Alert title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input-field !py-2 text-sm flex-1" />
                  <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value)} className="input-field !py-2 text-sm w-32">
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                    <option value="severe">Severe</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
                <textarea placeholder="Alert message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="input-field !py-2 text-sm min-h-[80px] w-full" />
                <button onClick={handleCreate} disabled={creating} className="btn-primary bg-gradient-to-r from-red-600 to-rose-600 !py-2 !px-4 text-sm disabled:opacity-50">
                  {creating ? <Spinner size="sm" /> : 'Broadcast Alert'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Alerts */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alerts ({alerts.length})</h3>
          <button onClick={fetchAlerts} className="btn-ghost text-sm"><ArrowPathIcon className="w-4 h-4" /> Refresh</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAlerts} />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={cn(
                'p-4 rounded-xl border transition-colors',
                alert.isActive
                  ? 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {severityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{alert.title}</h4>
                        <Badge variant={severityBadge(alert.severity)}>{alert.severity}</Badge>
                        {alert.isActive ? (
                          <Badge variant="danger">Active</Badge>
                        ) : (
                          <Badge variant="success">Resolved</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                        {alert.createdBy && <span>by {alert.createdBy}</span>}
                        {alert.resolvedAt && <span>Resolved: {new Date(alert.resolvedAt).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                  {alert.isActive && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="btn-secondary !py-1.5 !px-3 text-xs whitespace-nowrap flex items-center gap-1"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
            {alerts.length === 0 && <EmptyState icon={ExclamationTriangleIcon} title="No emergency alerts" description="System is operating normally" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}
