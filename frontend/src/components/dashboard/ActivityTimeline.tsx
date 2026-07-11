'use client';
import { CheckCircleIcon, ExclamationTriangleIcon, UserIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';

const activities = [
  { id: '1', icon: ExclamationTriangleIcon, color: 'text-amber-500', bg: 'bg-amber-100', text: 'New issue reported', detail: 'Broken streetlight near Central Park', time: '10 min ago' },
  { id: '2', icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-100', text: 'Issue resolved', detail: 'Garbage cleared from Main Street', time: '30 min ago' },
  { id: '3', icon: UserIcon, color: 'text-blue-500', bg: 'bg-blue-100', text: 'Volunteer assigned', detail: 'Rahul K. assigned to water leak', time: '1 hour ago' },
  { id: '4', icon: ChatBubbleLeftIcon, color: 'text-purple-500', bg: 'bg-purple-100', text: 'Community verified', detail: '3 citizens confirmed road damage', time: '2 hours ago' },
  { id: '5', icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-100', text: 'Priority escalated', detail: 'Electrical wire fall escalated', time: '3 hours ago' },
  { id: '6', icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-100', text: 'Issue resolved', detail: 'Drainage blockage cleared', time: '5 hours ago' },
];

export default function ActivityTimeline() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Activity</h3>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-4">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${a.bg}`}>
                <a.icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{a.text}</p>
                <p className="text-xs text-slate-500 truncate">{a.detail}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
