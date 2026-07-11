'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, MapIcon, ExclamationTriangleIcon, FireIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useEmergencyStore } from '@/stores/emergency.store';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', icon: HomeIcon, label: 'Home' },
  { href: '/map', icon: MapIcon, label: 'Map' },
  { href: '/report', icon: ExclamationTriangleIcon, label: 'Report' },
  { href: '/emergency', icon: FireIcon, label: 'Alerts' },
  { href: '/profile', icon: UserCircleIcon, label: 'Profile' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { emergencyActive } = useEmergencyStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const isEmergency = item.href === '/emergency' && emergencyActive;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]',
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
                isEmergency && 'text-red-500 animate-pulse'
              )}>
                <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
