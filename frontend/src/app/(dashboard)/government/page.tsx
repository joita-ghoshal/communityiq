'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOffice2Icon, ClipboardDocumentListIcon, UserGroupIcon,
  ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowUpIcon,
  FunnelIcon, EyeIcon, PencilSquareIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { getStatusColor, getPriorityColor, getCategoryIcon } from '@/lib/utils';

const overviewStats = [
  { label: 'Pending Assignment', value: 89, icon: ClipboardDocumentListIcon, color: 'from-amber-500 to-orange-600' },
  { label: 'In Progress', value: 156, icon: ClockIcon, color: 'from-blue-500 to-indigo-600' },
  { label: 'Resolved Today', value: 34, icon: CheckCircleIcon, color: 'from-emerald-500 to-green-600' },
  { label: 'SLA Violations', value: 12, icon: ExclamationTriangleIcon, color: 'from-red-500 to-rose-600' },
];

const queueIssues = [
  { id: '1', title: 'Major pothole on NH-48 near toll', category: 'road_damage', status: 'verified', priority: 'critical', department: 'Public Works', sla: '4h remaining', reported: '2h ago' },
  { id: '2', title: 'Water main burst at MG Road', category: 'water_leakage', status: 'assigned', priority: 'critical', department: 'Water Supply', sla: '1h remaining', reported: '5h ago' },
  { id: '3', title: 'Streetlights out in Sector 7', category: 'street_lighting', status: 'in_progress', priority: 'high', department: 'Electricity', sla: '12h remaining', reported: '1d ago' },
  { id: '4', title: 'Garbage overflow near hospital', category: 'garbage', status: 'verified', priority: 'high', department: 'Sanitation', sla: '6h remaining', reported: '3h ago' },
  { id: '5', title: 'Drainage blockage in Ward 5', category: 'drainage', status: 'community_verifying', priority: 'medium', department: 'Public Works', sla: '24h remaining', reported: '8h ago' },
  { id: '6', title: 'Unauthorized construction site', category: 'encroachment', status: 'reported', priority: 'medium', department: 'Revenue', sla: '48h remaining', reported: '1d ago' },
];

const workers = [
  { name: 'Rajesh Kumar', dept: 'Public Works', status: 'available', tasks: 3, avatar: 'RK' },
  { name: 'Priya Singh', dept: 'Water Supply', status: 'busy', tasks: 5, avatar: 'PS' },
  { name: 'Amit Patel', dept: 'Electricity', status: 'available', tasks: 2, avatar: 'AP' },
  { name: 'Sunita Devi', dept: 'Sanitation', status: 'on_leave', tasks: 0, avatar: 'SD' },
];

export default function GovernmentPage() {
  const theme = pageThemes.government;
  const [activeTab, setActiveTab] = useState<'queue' | 'workers' | 'sla'>('queue');

  return (
    <AppShell>
      <div className={`${theme.bg} ${theme.darkBg} min-h-full`}>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Issue</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Priority</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Department</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase hidden xl:table-cell">SLA</th>
                      <th className="text-right p-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueIssues.map((issue, i) => (
                      <motion.tr key={issue.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(issue.category)}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{issue.title}</p>
                              <p className="text-[10px] text-slate-500">{issue.reported}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell"><span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{issue.category.replace(/_/g, ' ')}</span></td>
                        <td className="p-4"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(issue.status)}`}>{issue.status.replace(/_/g, ' ')}</span></td>
                        <td className="p-4 hidden lg:table-cell"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getPriorityColor(issue.priority)}`}>{issue.priority}</span></td>
                        <td className="p-4 hidden lg:table-cell"><span className="text-xs text-slate-600 dark:text-slate-400">{issue.department}</span></td>
                        <td className="p-4 hidden xl:table-cell"><span className={`text-xs font-medium ${issue.sla.includes('remaining') && parseInt(issue.sla) < 4 ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'}`}>{issue.sla}</span></td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors"><EyeIcon className="w-4 h-4" /></button>
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600 transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Workers */}
          {activeTab === 'workers' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workers.map((w, i) => (
                <motion.div key={w.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                  className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">{w.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{w.name}</p>
                      <p className="text-xs text-slate-500">{w.dept}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${w.status === 'available' ? 'bg-emerald-100 text-emerald-700' : w.status === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{w.status.replace('_', ' ')}</span>
                    <span className="text-xs text-slate-500">{w.tasks} tasks</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* SLA */}
          {activeTab === 'sla' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">SLA Compliance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Within SLA', value: 389, pct: 88, color: 'bg-emerald-500' },
                  { label: 'Approaching Deadline', value: 42, pct: 10, color: 'bg-amber-500' },
                  { label: 'SLA Violated', value: 12, pct: 2, color: 'bg-red-500' },
                ].map((item) => (
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
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
