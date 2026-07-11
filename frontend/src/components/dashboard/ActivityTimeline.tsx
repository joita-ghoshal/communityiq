'use client';
import Link from 'next/link';
import { CheckCircleIcon, ExclamationTriangleIcon, UserIcon, ChatBubbleLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

const activities = [
  { id: '1', icon: ExclamationTriangleIcon, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'New issue reported', detail: 'Broken streetlight near Central Park', time: '10 min ago', href: '/map' },
  { id: '2', icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', text: 'Issue resolved', detail: 'Garbage cleared from Main Street', time: '30 min ago', href: '/analytics' },
  { id: '3', icon: UserIcon, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'Volunteer assigned', detail: 'Rahul K. assigned to water leak', time: '1 hour ago', href: '/heroes' },
  { id: '4', icon: ChatBubbleLeftIcon, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'Community verified', detail: '3 citizens confirmed road damage', time: '2 hours ago', href: '/report' },
  { id: '5', icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'Priority escalated', detail: 'Electrical wire fall escalated', time: '3 hours ago', href: '/emergency' },
];

export default function ActivityTimeline() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Activity</h3>
        <Link href="/analytics" className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
          View all <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-4">
          {activities.map((a, i) => (
            <Link key={a.id} href={a.href}>
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-3 relative cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${a.bg}`}>
                  <a.icon className={`w-5 h-5 ${a.color}`} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{a.text}</p>
                  <p className="text-xs text-slate-500 truncate">{a.detail}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
