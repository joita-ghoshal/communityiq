'use client';
import { usePathname } from 'next/navigation';
import { BellIcon, MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/stores/notification.store';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/report': 'Report Issue',
  '/map': 'Live Map',
  '/ai-assistant': 'AI Assistant',
  '/emergency': 'Emergency Center',
  '/analytics': 'Analytics',
  '/government': 'Government Operations',
  '/heroes': 'Community Heroes',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export default function Header() {
  const pathname = usePathname();
  const { unreadCount, notifications, markAsRead, markAllRead } = useNotificationStore();
  const { toggleSidebar } = useUIStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const title = pageTitles[pathname] || 'CommunityIQ';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">{title}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>CommunityIQ</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400">{title}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 256, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden">
              <input autoFocus type="text" placeholder="Search issues, users..." className="input-field text-sm !py-2" onBlur={() => setSearchOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setSearchOpen(!searchOpen)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-500" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
            <BellIcon className="w-5 h-5 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto glass-card-strong p-2 shadow-2xl"
              >
                <div className="flex items-center justify-between p-2 border-b border-slate-200/50 dark:border-slate-700/50">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-8">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-3 rounded-xl cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
