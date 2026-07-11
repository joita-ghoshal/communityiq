'use client';
import { motion } from 'framer-motion';

const mockIssues = [
  { id: '1', title: 'Broken streetlight near Central Park', category: 'street_lighting', status: 'in_progress', priority: 'high', time: '2 hours ago' },
  { id: '2', title: 'Water leakage on MG Road', category: 'water_leakage', status: 'verified', priority: 'critical', time: '4 hours ago' },
  { id: '3', title: 'Garbage accumulation near school', category: 'garbage', status: 'assigned', priority: 'medium', time: '6 hours ago' },
  { id: '4', title: 'Pothole damage on Highway 45', category: 'road_damage', status: 'ai_analyzing', priority: 'high', time: '8 hours ago' },
  { id: '5', title: 'Drainage blocked in Sector 12', category: 'drainage', status: 'reported', priority: 'medium', time: '1 day ago' },
];

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    reported: 'border-slate-300 text-slate-600',
    verified: 'border-blue-300 text-blue-600',
    ai_analyzing: 'border-purple-300 text-purple-600',
    assigned: 'border-amber-300 text-amber-700',
    in_progress: 'border-indigo-300 text-indigo-600',
    resolved: 'border-green-300 text-green-600',
  };
  return map[status] || 'border-slate-300 text-slate-600';
}

function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  return map[priority] || 'bg-slate-100 text-slate-600';
}

function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    garbage: '🗑️',
    pothole: '🕳️',
    road_damage: '🛣️',
    street_lamp: '💡',
    street_lighting: '💡',
    water_leakage: '💧',
    water: '💧',
    drainage: '🌊',
    electrical: '⚡',
    noise: '🔊',
    graffiti: '🎨',
  };
  return map[category] || '📌';
}

export default function RecentIssues() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Issues</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</button>
      </div>
      <div className="space-y-3">
        {mockIssues.map((issue, i) => (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
          >
            <span className="text-2xl">{getCategoryIcon(issue.category)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{issue.title}</p>
              <p className="text-xs text-slate-500">{issue.time}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(issue.status)}`}>{issue.status.replace(/_/g, ' ')}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(issue.priority)}`}>{issue.priority}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
