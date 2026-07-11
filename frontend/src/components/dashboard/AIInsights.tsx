'use client';
import Link from 'next/link';
import { SparklesIcon, ArrowTrendingUpIcon, ExclamationTriangleIcon, LightBulbIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const insights = [
  { icon: ArrowTrendingUpIcon, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', title: 'Rising Trend', desc: 'Water leakage reports increased 23% in Sector 14 this week.', href: '/analytics' },
  { icon: ExclamationTriangleIcon, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', title: 'Pattern Detected', desc: 'Road damage reports cluster near Highway 45 — possible infrastructure issue.', href: '/map' },
  { icon: LightBulbIcon, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', title: 'Recommendation', desc: 'Deploy 3 additional waste collection teams to Ward 7.', href: '/government' },
];

export default function AIInsights() {
  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-200/50 dark:border-violet-800/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">AI Insights</h3>
        </div>
        <Link href="/analytics" className="text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline flex items-center gap-1">
          See all <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <Link key={i} href={insight.href}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ x: 2 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/80 backdrop-blur dark:bg-slate-800/80 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', insight.bg)}>
                <insight.icon className={cn('w-4 h-4', insight.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{insight.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{insight.desc}</p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-1 flex-shrink-0 group-hover:text-violet-500 transition-colors" />
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
