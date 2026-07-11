'use client';
import { SparklesIcon, ArrowTrendingUpIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const insights = [
  { icon: ArrowTrendingUpIcon, color: 'text-blue-500', bg: 'bg-blue-100', title: 'Rising Trend', desc: 'Water leakage reports increased 23% in Sector 14 this week.' },
  { icon: ExclamationTriangleIcon, color: 'text-amber-500', bg: 'bg-amber-100', title: 'Pattern Detected', desc: 'Road damage reports cluster near Highway 45.' },
  { icon: LightBulbIcon, color: 'text-emerald-500', bg: 'bg-emerald-100', title: 'Recommendation', desc: 'Deploy 3 additional waste collection teams to Ward 7.' },
];

export default function AIInsights() {
  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-200/50 dark:border-violet-800/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <SparklesIcon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/80 backdrop-blur dark:bg-slate-800/80"
          >
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', insight.bg)}>
              <insight.icon className={cn('w-4 h-4', insight.color)} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{insight.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{insight.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
