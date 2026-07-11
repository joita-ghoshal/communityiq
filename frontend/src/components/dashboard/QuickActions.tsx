'use client';
import Link from 'next/link';
import { ExclamationTriangleIcon, MapIcon, FireIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const actions = [
  { href: '/report', label: 'Report Issue', desc: 'Report a new civic issue', icon: ExclamationTriangleIcon, color: 'from-emerald-500 to-green-600' },
  { href: '/map', label: 'View Map', desc: 'See issues near you', icon: MapIcon, color: 'from-blue-500 to-indigo-600' },
  { href: '/emergency', label: 'Emergency', desc: 'Report an emergency', icon: FireIcon, color: 'from-red-500 to-rose-600' },
  { href: '/analytics', label: 'Analytics', desc: 'View reports & charts', icon: ChartBarIcon, color: 'from-amber-500 to-orange-600' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <Link key={action.href} href={action.href}>
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 cursor-pointer group"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br mx-auto shadow-lg mb-3 group-hover:scale-110 transition-transform"
                 style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` } as React.CSSProperties}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white text-center">{action.label}</p>
            <p className="text-xs text-slate-500 mt-0.5 text-center">{action.desc}</p>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
