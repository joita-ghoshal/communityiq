'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapIcon, AdjustmentsHorizontalIcon, FunnelIcon, MagnifyingGlassIcon,
  MapPinIcon, Squares2X2Icon, ListBulletIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { getCategoryIcon, getStatusColor } from '@/lib/utils';

const mapFilters = {
  categories: ['All', 'Road Damage', 'Water Leakage', 'Garbage', 'Electricity', 'Drainage', 'Safety'],
  statuses: ['All', 'Reported', 'Verified', 'In Progress', 'Resolved'],
  priorities: ['All', 'Low', 'Medium', 'High', 'Critical'],
};

const mockMapIssues = [
  { id: '1', title: 'Broken streetlight', category: 'street_lighting', status: 'in_progress', priority: 'high', lat: 28.6139, lng: 77.209, distance: '0.3 km' },
  { id: '2', title: 'Water leakage on road', category: 'water_leakage', status: 'verified', priority: 'critical', lat: 28.6200, lng: 77.215, distance: '0.8 km' },
  { id: '3', title: 'Garbage dump', category: 'garbage', status: 'reported', priority: 'medium', lat: 28.6080, lng: 77.200, distance: '1.2 km' },
  { id: '4', title: 'Pothole on highway', category: 'road_damage', status: 'assigned', priority: 'high', lat: 28.6250, lng: 77.218, distance: '1.5 km' },
  { id: '5', title: 'Fallen tree', category: 'environmental', status: 'community_verifying', priority: 'medium', lat: 28.6110, lng: 77.212, distance: '0.6 km' },
];

export default function MapPage() {
  const theme = pageThemes.map;
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  return (
    <AppShell>
      <div className={`${theme.bg} ${theme.darkBg} min-h-full`}>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Map Header */}
          <div className="p-4 md:p-6 pb-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`${theme.gradient} rounded-xl p-2.5 text-white`}>
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Live Issue Map</h1>
                  <p className="text-xs text-slate-500">Real-time civic issues in your area</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('map')} className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="px-4 md:px-6 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {mapFilters.categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Map / List Content */}
          <div className="flex-1 px-4 md:px-6 pb-4">
            {viewMode === 'map' ? (
              <div className="h-full rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                {/* Simulated Map */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30">
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                  {/* Issue markers */}
                  {mockMapIssues.map((issue, i) => (
                    <motion.div
                      key={issue.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 * i, type: 'spring' }}
                      className={`absolute cursor-pointer transition-all hover:scale-125 ${selectedIssue === issue.id ? 'z-20 scale-125' : 'z-10'}`}
                      style={{ top: `${20 + i * 15}%`, left: `${15 + i * 18}%` }}
                      onClick={() => setSelectedIssue(issue.id)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-lg ${issue.priority === 'critical' ? 'bg-red-500 animate-pulse' : issue.priority === 'high' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                        {getCategoryIcon(issue.category)}
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900/20 rounded-full blur-sm" />
                    </motion.div>
                  ))}
                  {/* Map center pin */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl p-3 text-xs space-y-1.5">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Priority</p>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Critical</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> High</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Medium/Low</div>
                </div>
                {/* Issue detail card */}
                {selectedIssue && (() => {
                  const issue = mockMapIssues.find((i) => i.id === selectedIssue);
                  if (!issue) return null;
                  return (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-4 right-4 w-64 glass-card-strong p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{issue.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{issue.distance} away</p>
                        </div>
                        <button onClick={() => setSelectedIssue(null)} className="text-slate-400 hover:text-slate-600">×</button>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(issue.status)}`}>{issue.status.replace(/_/g, ' ')}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${issue.priority === 'critical' ? 'bg-red-100 text-red-700' : issue.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>{issue.priority}</span>
                      </div>
                      <button className="btn-primary w-full mt-3 !py-2 text-xs bg-gradient-to-r from-emerald-600 to-teal-600">View Details</button>
                    </motion.div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-3">
                {mockMapIssues.map((issue, i) => (
                  <motion.div key={issue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="glass-card p-4 cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(issue.category)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{issue.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPinIcon className="w-3 h-3" />{issue.distance} away</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(issue.status)}`}>{issue.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
