'use client';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, FireIcon,
  MagnifyingGlassIcon, PhotoIcon, ChartBarIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentIssues from '@/components/dashboard/RecentIssues';
import AIInsights from '@/components/dashboard/AIInsights';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import Link from 'next/link';

const stats = [
  { title: 'Total Issues', value: '2,847', change: 12, changeLabel: 'vs last month', icon: ExclamationTriangleIcon, color: 'blue', gradient: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200 dark:shadow-blue-900/50', href: '/report' },
  { title: 'Resolved', value: '1,923', change: 8, changeLabel: 'vs last month', icon: CheckCircleIcon, color: 'emerald', gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200 dark:shadow-emerald-900/50', href: '/analytics' },
  { title: 'In Progress', value: '634', change: -3, changeLabel: 'vs last month', icon: ClockIcon, color: 'amber', gradient: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200 dark:shadow-amber-900/50', href: '/map' },
  { title: 'Emergency', value: '12', change: 25, changeLabel: 'critical alerts active', icon: FireIcon, color: 'red', gradient: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200 dark:shadow-red-900/50', href: '/emergency' },
];

const quickActions = [
  { label: 'Report Issue', icon: ExclamationTriangleIcon, color: 'from-blue-500 to-indigo-600', href: '/report' },
  { label: 'Verify Issue', icon: PhotoIcon, color: 'from-emerald-500 to-teal-600', href: '/map' },
  { label: 'View Analytics', icon: ChartBarIcon, color: 'from-violet-500 to-purple-600', href: '/analytics' },
  { label: 'Find Nearby', icon: MagnifyingGlassIcon, color: 'from-amber-500 to-orange-600', href: '/map' },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="min-h-full bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 md:p-8 text-white mb-8 shadow-xl"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold font-heading">Welcome back to CommunityIQ</h1>
              <p className="text-blue-100 mt-2 text-sm md:text-base">Your AI-powered civic intelligence platform. Monitor, report, and resolve community issues.</p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link href="/report" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-xl text-sm font-medium transition-all">
                  <ExclamationTriangleIcon className="w-4 h-4" /> Report Issue
                </Link>
                <Link href="/map" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-sm font-medium transition-all">
                  <MagnifyingGlassIcon className="w-4 h-4" /> Explore Map
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <StatsCard {...stat} />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action, i) => (
                <Link key={action.label} href={action.href}>
                  <motion.div
                    whileHover={{ y: -2, scale: 1.02 }}
                    className={`bg-gradient-to-br ${action.color} rounded-2xl p-4 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all`}
                  >
                    <action.icon className="w-6 h-6 mb-2" />
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <RecentIssues />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <ActivityTimeline />
              </motion.div>
            </div>
            {/* Right Column */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <AIInsights />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
