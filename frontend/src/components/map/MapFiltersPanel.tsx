'use client';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ISSUE_CATEGORIES, STATUS_GROUPS } from '@/lib/map-data';

export interface MapFilters {
  category: string;
  priority: string;
  status: string;
  department: string;
  radiusKm: number;
  since: string;
  verifiedOnly: boolean;
  aiVerifiedOnly: boolean;
  emergencyOnly: boolean;
}

export const DEFAULT_FILTERS: MapFilters = {
  category: 'all',
  priority: 'all',
  status: '__active',
  department: 'all',
  radiusKm: 10,
  since: 'all',
  verifiedOnly: false,
  aiVerifiedOnly: false,
  emergencyOnly: false,
};

interface FiltersPanelProps {
  open: boolean;
  onClose: () => void;
  filters: MapFilters;
  onChange: (f: MapFilters) => void;
  departments: string[];
  activeCount: number;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-1.5 group"
    >
      <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
      <span className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}

export default function MapFiltersPanel({ open, onClose, filters, onChange, departments, activeCount }: FiltersPanelProps) {
  return (
    <motion.div
      initial={false}
      animate={{ width: open ? 300 : 0, opacity: open ? 1 : 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className={`${open ? 'overflow-visible' : 'overflow-hidden'} absolute top-2 left-2 bottom-2 z-[1100]`}
    >
      <div className="w-[300px] h-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Map Filters</h3>
            <p className="text-[10px] text-slate-400">{activeCount} issues match</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              Reset
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Category */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category</p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => onChange({ ...filters, category: 'all' })}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${filters.category === 'all' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
              >
                All
              </button>
              {Object.entries(ISSUE_CATEGORIES).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => onChange({ ...filters, category: filters.category === key ? 'all' : key })}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${filters.category === key ? 'text-white shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  style={filters.category === key ? { backgroundColor: meta.color } : undefined}
                >
                  <span>{meta.emoji}</span> {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Priority</p>
            <div className="flex flex-wrap gap-1">
              {['all', 'low', 'medium', 'high', 'critical', 'emergency'].map((p) => (
                <button
                  key={p}
                  onClick={() => onChange({ ...filters, priority: p })}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium capitalize transition-all ${
                    filters.priority === p
                      ? p === 'critical' || p === 'emergency' ? 'bg-red-600 text-white shadow' : 'bg-slate-700 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status</p>
            <div className="flex flex-wrap gap-1">
              {STATUS_GROUPS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => onChange({ ...filters, status: g.value })}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${filters.status === g.value ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Department</p>
            <select
              value={filters.department}
              onChange={(e) => onChange({ ...filters, department: e.target.value })}
              className="w-full px-2.5 py-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent focus:border-emerald-400 outline-none"
            >
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Radius */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Radius: {filters.radiusKm} km
            </p>
            <input
              type="range"
              min={0.5}
              max={50}
              step={0.5}
              value={filters.radiusKm}
              onChange={(e) => onChange({ ...filters, radiusKm: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>0.5 km</span>
              <span>50 km</span>
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Reported Since</p>
            <div className="flex flex-wrap gap-1">
              {[['all', 'Any time'], ['24h', '24 hours'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days']].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => onChange({ ...filters, since: v })}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${filters.since === v ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
            <Toggle label="✅ Verified issues only" checked={filters.verifiedOnly} onChange={(v) => onChange({ ...filters, verifiedOnly: v })} />
            <Toggle label="🤖 AI verified only" checked={filters.aiVerifiedOnly} onChange={(v) => onChange({ ...filters, aiVerifiedOnly: v })} />
            <Toggle label="🚨 Emergency only" checked={filters.emergencyOnly} onChange={(v) => onChange({ ...filters, emergencyOnly: v })} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
