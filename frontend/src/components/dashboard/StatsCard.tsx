'use client';
import Link from 'next/link';
import { type ElementType } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ElementType;
  color: string;
  gradient: string;
  href?: string;
}

export default function StatsCard({ title, value, change, changeLabel, icon: Icon, color, gradient, href }: StatsCardProps) {
  const isPositive = change && change > 0;
  const content = (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer h-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shadow-sm', gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <div className={cn('flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full', isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400')}>
            {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold font-heading text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
        {changeLabel && <p className="text-[10px] text-slate-400 mt-1">{changeLabel}</p>}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">View details →</p>
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}
