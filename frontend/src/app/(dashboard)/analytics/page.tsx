'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon, ArrowTrendingUpIcon, CalendarDaysIcon,
  ArrowUpIcon, ArrowDownIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon, UsersIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { formatNumber } from '@/lib/utils';

const kpis = [
  { label: 'Resolution Rate', value: '92.4%', change: '+3.2%', up: true, icon: CheckCircleIcon, color: 'from-emerald-500 to-green-600' },
  { label: 'Avg Resolution Time', value: '3.2 days', change: '-0.8 days', up: true, icon: ClockIcon, color: 'from-blue-500 to-indigo-600' },
  { label: 'Active Issues', value: '486', change: '+12', up: false, icon: ExclamationTriangleIcon, color: 'from-amber-500 to-orange-600' },
  { label: 'Community Score', value: '87/100', change: '+5', up: true, icon: UsersIcon, color: 'from-purple-500 to-violet-600' },
];

const departments = [
  { name: 'Public Works', resolved: 342, total: 380, rate: 90, trend: '+5%' },
  { name: 'Water Supply', resolved: 198, total: 215, rate: 92, trend: '+2%' },
  { name: 'Electricity', resolved: 156, total: 170, rate: 92, trend: '+8%' },
  { name: 'Sanitation', resolved: 289, total: 340, rate: 85, trend: '-3%' },
  { name: 'Roads & Transport', resolved: 234, total: 280, rate: 84, trend: '+1%' },
  { name: 'Environment', resolved: 112, total: 125, rate: 90, trend: '+4%' },
];

const monthlyData = [
  { month: 'Jan', issues: 245, resolved: 210, predicted: 260 },
  { month: 'Feb', issues: 280, resolved: 250, predicted: 290 },
  { month: 'Mar', issues: 310, resolved: 290, predicted: 320 },
  { month: 'Apr', issues: 295, resolved: 275, predicted: 300 },
  { month: 'May', issues: 350, resolved: 320, predicted: 360 },
  { month: 'Jun', issues: 380, resolved: 355, predicted: 390 },
];

const categoryData = [
  { name: 'Road Damage', count: 486, color: 'bg-blue-500' },
  { name: 'Water Leakage', count: 312, color: 'bg-cyan-500' },
  { name: 'Garbage', count: 278, color: 'bg-green-500' },
  { name: 'Electricity', count: 198, color: 'bg-yellow-500' },
  { name: 'Drainage', count: 156, color: 'bg-purple-500' },
  { name: 'Safety', count: 134, color: 'bg-red-500' },
  { name: 'Other', count: 283, color: 'bg-gray-400' },
];

export default function AnalyticsPage() {
  const theme = pageThemes.analytics;
  const [timeRange, setTimeRange] = useState('6m');

  const maxCount = Math.max(...categoryData.map((c) => c.count));

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}>
                    {kpi.up ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{kpi.value}</p>
                <p className="text-sm text-slate-500">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Monthly Trends Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Monthly Trends</h3>
            <div className="h-64 flex items-end gap-3 overflow-x-auto scrollbar-thin pb-2">
              {monthlyData.map((data, i) => (
                <div key={data.month} className="flex-1 min-w-[60px] flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end" style={{ height: '220px' }}>
                    <div className="flex-1 bg-blue-400 dark:bg-blue-600 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${(data.issues / 400) * 100}%` }} />
                    <div className="flex-1 bg-emerald-400 dark:bg-emerald-600 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${(data.resolved / 400) * 100}%` }} />
                    <div className="flex-1 border-2 border-dashed border-purple-400 dark:border-purple-500 rounded-t-lg transition-all" style={{ height: `${(data.predicted / 400) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-400 rounded" /> Reported</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-400 rounded" /> Resolved</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-dashed border-purple-400 rounded" /> AI Predicted</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Category Distribution</h3>
              <div className="space-y-3">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-28 truncate">{cat.name}</span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.count / maxCount) * 100}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                        className={`h-full ${cat.color} rounded-full`} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white w-12 text-right">{cat.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Department Performance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Department Performance</h3>
              <div className="space-y-3">
                {departments.map((dept) => (
                  <div key={dept.name} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${dept.rate >= 90 ? 'text-emerald-600' : dept.rate >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{dept.rate}%</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${dept.trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{dept.trend}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${dept.rate}%` }} transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${dept.rate >= 90 ? 'bg-emerald-500' : dept.rate >= 85 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{dept.resolved}/{dept.total} issues resolved</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* AI Insights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200/50">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🤖</span> AI Intelligence Report
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Predicted Issues</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">390</p>
                <p className="text-xs text-slate-500 mt-1">Next month forecast based on seasonal patterns and historical data</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Risk Zones Identified</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">12</p>
                <p className="text-xs text-slate-500 mt-1">Areas with high probability of recurring infrastructure issues</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Optimization Savings</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">₹14.2L</p>
                <p className="text-xs text-slate-500 mt-1">Estimated resource savings through AI-recommended routing</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
