'use client';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function StatsCard({ label, value, change, up, icon: Icon, color }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full', up ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100')}>
          {up ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}
