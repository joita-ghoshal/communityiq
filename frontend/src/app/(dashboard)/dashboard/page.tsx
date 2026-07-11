'use client';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import AppShell from '@/components/layout/AppShell';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentIssues from '@/components/dashboard/RecentIssues';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import AIInsights from '@/components/dashboard/AIInsights';
import QuickActions from '@/components/dashboard/QuickActions';
import { pageThemes } from '@/lib/theme/page-themes';
import {
  ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, FireIcon,
  ArrowUpIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  const stats = [
    { label: 'Total Issues', value: '2,847', change: '+12%', up: true, icon: ExclamationTriangleIcon, color: 'from-blue-500 to-indigo-600' },
    { label: 'Resolved', value: '1,923', change: '+8%', up: true, icon: CheckCircleIcon, color: 'from-emerald-500 to-green-600' },
    { label: 'In Progress', value: '486', change: '-3%', up: false, icon: ClockIcon, color: 'from-amber-500 to-orange-600' },
    { label: 'Emergency Active', value: '3', change: '+1', up: true, icon: FireIcon, color: 'from-red-500 to-rose-600' },
  ];

  return (
    <AppShell>
      <div className="bg-gray-50 dark:bg-black min-h-full">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {user?.firstName || 'User'}
              </h1>
              <p className="text-white/80 mt-2 text-sm md:text-base">
                Here&apos;s what&apos;s happening in your community today. Your engagement makes a difference.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-sm backdrop-blur-sm">
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  <span>Community Health: <strong>87%</strong></span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-sm backdrop-blur-sm">
                  <ArrowUpIcon className="w-4 h-4" />
                  <span>Resolution Rate: <strong>92%</strong></span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (i + 1) }}
              >
                <StatsCard {...stat} />
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <QuickActions />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <RecentIssues />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <AIInsights />
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <ActivityTimeline />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
