'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircleIcon, EnvelopeIcon, PhoneIcon, CalendarDaysIcon,
  PencilSquareIcon, CameraIcon, CheckBadgeIcon, ShieldCheckIcon,
  MapPinIcon, TrophyIcon, StarIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const theme = pageThemes.profile;
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  return (
    <AppShell>
      <div className={`${theme.bg} ${theme.darkBg} min-h-full`}>
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Profile Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-strong overflow-hidden">
            <div className={`${theme.gradient} h-32 md:h-40 relative`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
            </div>
            <div className="px-6 pb-6 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-slate-900 shadow-xl">
                    {user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : 'U'}
                  </div>
                  <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <CameraIcon className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                      {user ? `${user.firstName} ${user.lastName}` : 'User'}
                    </h1>
                    {user?.isVerified && <CheckBadgeIcon className="w-5 h-5 text-blue-500" />}
                  </div>
                  <p className="text-sm text-slate-500 capitalize">{user?.role?.replace(/_/g, ' ') || 'Citizen'}</p>
                </div>
                <button onClick={() => setEditing(!editing)} className="btn-primary bg-gradient-to-r from-teal-600 to-cyan-600 !py-2 !px-4 text-sm">
                  <PencilSquareIcon className="w-4 h-4" /> {editing ? 'Save' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Personal Information</h3>
              <div className="space-y-4">
                {[
                  { icon: EnvelopeIcon, label: 'Email', value: user?.email || 'john@example.com' },
                  { icon: PhoneIcon, label: 'Phone', value: '+91 98765 43210' },
                  { icon: MapPinIcon, label: 'Location', value: 'New Delhi, India' },
                  { icon: CalendarDaysIcon, label: 'Joined', value: 'January 2024' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <item.icon className="w-5 h-5 text-teal-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
              {/* Stats */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Contributions</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Reports', value: '24', icon: '📝' },
                    { label: 'Verified', value: '18', icon: '✅' },
                    { label: 'Points', value: '1,240', icon: '⭐' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-2xl">{stat.icon}</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                      <p className="text-[10px] text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-amber-500" /> Recent Badges
                </h3>
                <div className="flex gap-3">
                  {['📝', '✅', '🌙'].map((badge, i) => (
                    <div key={i} className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer">{badge}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
