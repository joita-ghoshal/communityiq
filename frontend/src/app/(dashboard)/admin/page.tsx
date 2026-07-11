'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersIcon, BuildingOffice2Icon, ClipboardDocumentListIcon,
  Cog6ToothIcon, PlusIcon, TrashIcon, PencilSquareIcon,
  CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon,
  ChevronDownIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Tab = 'users' | 'departments' | 'requests' | 'settings';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
}

interface AdminRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  submittedBy?: string;
  createdAt: string;
}

const roles = ['citizen', 'volunteer', 'department_admin', 'municipal_admin', 'super_admin'];

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [loading, setLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

  // Departments state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  // Requests state
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');

  // Settings state
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    emailNotifications: true,
    autoAssign: false,
    aiAnalysis: true,
    publicRegistration: true,
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/');
      toast.error('Access denied');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'departments') fetchDepartments();
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.data || data.users || data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data.data || data.departments || data || []);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/requests');
      setRequests(data.data || data.requests || data || []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) {
      toast.error('Enter department name');
      return;
    }
    try {
      await api.post('/admin/departments', { name: newDeptName, description: newDeptDesc });
      toast.success('Department created');
      setNewDeptName('');
      setNewDeptDesc('');
      fetchDepartments();
    } catch {
      toast.error('Failed to create department');
    }
  };

  const handleReviewRequest = async (reqId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/requests/${reqId}/review`, { status });
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch {
      toast.error('Failed to review request');
    }
  };

  const handleCreateRequest = async () => {
    if (!newReqTitle.trim() || !newReqDesc.trim()) {
      toast.error('Fill all fields');
      return;
    }
    try {
      await api.post('/admin/requests', { title: newReqTitle, description: newReqDesc });
      toast.success('Request submitted');
      setShowNewRequest(false);
      setNewReqTitle('');
      setNewReqDesc('');
      fetchRequests();
    } catch {
      toast.error('Failed to submit request');
    }
  };

  if (authLoading) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
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

  const filteredUsers = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: typeof UsersIcon }[] = [
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'departments', label: 'Departments', icon: BuildingOffice2Icon },
    { id: 'requests', label: 'Requests', icon: ClipboardDocumentListIcon },
    { id: 'settings', label: 'App Settings', icon: Cog6ToothIcon },
  ];

  return (
    <AppShell>
      <div className="min-h-full">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-6">Admin Panel</h1>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700 overflow-x-auto">
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
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Users ({filteredUsers.length})</h2>
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="input-field pl-9 !py-2 text-sm w-64"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">User</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Role</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                            <td className="py-3 px-4">
                              {editingUser === u.id ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="input-field !py-1 !px-2 text-xs w-32"
                                  >
                                    {roles.map((r) => (
                                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                    ))}
                                  </select>
                                  <button onClick={() => handleUpdateRole(u.id)} className="text-green-500 hover:text-green-600">
                                    <CheckCircleIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-500">
                                    <XCircleIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 capitalize cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                  onClick={() => { setEditingUser(u.id); setEditRole(u.role); setEditDepartment(u.department || ''); }}>
                                  {u.role?.replace(/_/g, ' ')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                'inline-flex px-2 py-1 rounded-lg text-xs font-medium',
                                u.isActive ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              )}>
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setEditingUser(u.id); setEditRole(u.role); }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeactivateUser(u.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">No users found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Departments ({departments.length})</h2>
                  <button onClick={fetchRequests} className="btn-ghost text-sm">
                    <ArrowPathIcon className="w-4 h-4" /> Refresh
                  </button>
                </div>

                {/* Add Department Form */}
                <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Add New Department</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Department name"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="input-field !py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newDeptDesc}
                      onChange={(e) => setNewDeptDesc(e.target.value)}
                      className="input-field !py-2 text-sm"
                    />
                    <button onClick={handleCreateDepartment} className="btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 !py-2 !px-4 text-sm whitespace-nowrap">
                      <PlusIcon className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                      <div key={dept.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{dept.name}</h4>
                        {dept.description && (
                          <p className="text-xs text-slate-500 mt-1">{dept.description}</p>
                        )}
                        {dept.memberCount !== undefined && (
                          <p className="text-xs text-slate-400 mt-2">{dept.memberCount} members</p>
                        )}
                      </div>
                    ))}
                    {departments.length === 0 && (
                      <p className="col-span-full py-12 text-center text-slate-500">No departments yet. Create one above.</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Requests ({requests.length})</h2>
                  <div className="flex gap-2">
                    <button onClick={fetchRequests} className="btn-ghost text-sm">
                      <ArrowPathIcon className="w-4 h-4" /> Refresh
                    </button>
                    <button onClick={() => setShowNewRequest(true)} className="btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 !py-2 !px-4 text-sm">
                      <PlusIcon className="w-4 h-4" /> New Request
                    </button>
                  </div>
                </div>

                {/* New Request Modal */}
                <AnimatePresence>
                  {showNewRequest && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-6"
                    >
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                        <input
                          type="text"
                          placeholder="Request title"
                          value={newReqTitle}
                          onChange={(e) => setNewReqTitle(e.target.value)}
                          className="input-field !py-2 text-sm"
                        />
                        <textarea
                          placeholder="Description"
                          value={newReqDesc}
                          onChange={(e) => setNewReqDesc(e.target.value)}
                          className="input-field !py-2 text-sm min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setShowNewRequest(false)} className="btn-secondary text-sm">Cancel</button>
                          <button onClick={handleCreateRequest} className="btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 !py-2 !px-4 text-sm">Submit</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <div key={req.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{req.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">{req.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                req.status === 'approved' ? 'bg-green-50 dark:bg-green-900/30 text-green-600' :
                                req.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/30 text-red-600' :
                                'bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                              )}>
                                {req.status}
                              </span>
                              {req.submittedBy && (
                                <span className="text-xs text-slate-400">by {req.submittedBy}</span>
                              )}
                            </div>
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReviewRequest(req.id, 'approved')}
                                className="p-2 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReviewRequest(req.id, 'rejected')}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {requests.length === 0 && (
                      <p className="py-12 text-center text-slate-500">No requests yet</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* App Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Platform Settings</h2>
                <div className="space-y-4">
                  {[
                    { key: 'maintenanceMode' as const, label: 'Maintenance Mode', desc: 'Temporarily disable public access' },
                    { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Send email alerts for new issues' },
                    { key: 'autoAssign' as const, label: 'Auto-Assign Issues', desc: 'Automatically assign issues to departments' },
                    { key: 'aiAnalysis' as const, label: 'AI Analysis', desc: 'Enable AI-powered issue analysis' },
                    { key: 'publicRegistration' as const, label: 'Public Registration', desc: 'Allow new user signups' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{setting.label}</p>
                        <p className="text-xs text-slate-500">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => setSettings((s) => ({ ...s, [setting.key]: !s[setting.key] }))}
                        className={cn(
                          'relative w-11 h-6 rounded-full transition-colors',
                          settings[setting.key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
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
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
