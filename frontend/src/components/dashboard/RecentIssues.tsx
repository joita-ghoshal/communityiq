'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPinIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { getCategoryIcon, getStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

const mockIssues = [
  { id: '1', title: 'Broken streetlight near Central Park', category: 'street_lighting', status: 'in_progress', priority: 'high', location: 'Sector 14, Block A', time: '10 min ago' },
  { id: '2', title: 'Water leakage on main road', category: 'water_leakage', status: 'verified', priority: 'critical', location: 'MG Road, Near Metro', time: '25 min ago' },
  { id: '3', title: 'Garbage dump overflowing', category: 'garbage', status: 'reported', priority: 'medium', location: 'Ward 7, Colony Rd', time: '1 hour ago' },
  { id: '4', title: 'Pothole causing accidents', category: 'road_damage', status: 'in_progress', priority: 'high', location: 'Highway 45, KM 12', time: '2 hours ago' },
  { id: '5', title: 'Fallen tree blocking road', category: 'environmental', status: 'assigned', priority: 'medium', location: 'Park Street', time: '3 hours ago' },
];

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function RecentIssues() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Recent Issues</h3>
        <Link href="/report" className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
          View all <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {mockIssues.map((issue, i) => (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link href={`/report?id=${issue.id}`}>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group">
                <span className="text-xl mt-0.5">{getCategoryIcon(issue.category)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{issue.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><MapPinIcon className="w-3 h-3" />{issue.location}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><ClockIcon className="w-3 h-3" />{issue.time}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusColor(issue.status))}>{issue.status.replace(/_/g, ' ')}</span>
                  <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', priorityColors[issue.priority])}>{issue.priority}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
