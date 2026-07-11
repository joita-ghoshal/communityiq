'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon, ExclamationTriangleIcon, MapIcon, SparklesIcon, FireIcon,
  ChartBarIcon, BuildingOffice2Icon, TrophyIcon, UserCircleIcon,
  Cog6ToothIcon, ChevronLeftIcon, ChevronRightIcon, BellIcon, SunIcon,
  MoonIcon, ArrowRightOnRectangleIcon, BoltIcon,
} from '@heroicons/react/24/outline';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from 'next-themes';
import { cn, getInitials } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: HomeIcon, roles: ['citizen', 'volunteer', 'department_admin', 'municipal_admin', 'super_admin'] },
  { href: '/report', label: 'Report Issue', icon: ExclamationTriangleIcon, roles: ['citizen', 'volunteer'] },
  { href: '/map', label: 'Live Map', icon: MapIcon, roles: ['citizen', 'volunteer', 'department_admin', 'municipal_admin', 'super_admin'] },
  { href: '/ai-assistant', label: 'AI Assistant', icon: SparklesIcon, roles: ['citizen', 'volunteer', 'department_admin', 'municipal_admin', 'super_admin'] },
  { href: '/emergency', label: 'Emergency', icon: FireIcon, roles: ['citizen', 'volunteer', 'department_admin', 'municipal_admin', 'super_admin'] },
  { href: '/analytics', label: 'Analytics', icon: ChartBarIcon, roles: ['department_admin', 'municipal_admin', 'super_admin'] },
  { href: '/government', label: 'Operations', icon: BuildingOffice2Icon, roles: ['municipal_admin', 'super_admin'] },
  { href: '/heroes', label: 'Community Heroes', icon: TrophyIcon, roles: ['citizen', 'volunteer', 'department_admin', 'municipal_admin', 'super_admin'] },
];

const bottomItems = [
  { href: '/profile', label: 'Profile', icon: UserCircleIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const collapsed = sidebarCollapsed;

  const filteredNav = navItems.filter((item) => !user || item.roles.includes(user.role));

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-700/50"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center">
            <BoltIcon className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                <h1 className="text-lg font-bold font-heading bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">CommunityIQ</h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                  collapsed && 'justify-center px-2'
                )}>
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-blue-600 dark:text-blue-400')} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">{item.label}</motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-3 space-y-1">
          {bottomItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                pathname === item.href ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                collapsed && 'justify-center px-2'
              )}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          ))}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-full transition-all', collapsed && 'justify-center px-2')}
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* User Info */}
          {user && (
            <div className={cn('flex items-center gap-3 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50', collapsed && 'justify-center')}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(user.firstName, user.lastName)}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              )}
              {!collapsed && (
                <button onClick={logout} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebarCollapsed}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {collapsed ? <ChevronRightIcon className="w-3 h-3" /> : <ChevronLeftIcon className="w-3 h-3" />}
        </button>
      </motion.aside>
    </>
  );
}
