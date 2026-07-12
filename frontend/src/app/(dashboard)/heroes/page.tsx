'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon, MagnifyingGlassIcon, FunnelIcon,
  UserGroupIcon, StarIcon, ChartBarIcon, SparklesIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const BADGE_ICONS: Record<string, string> = {
  report: '📝', verify: '✅', comment: '💬', streak: '🔥',
  accuracy: '🎯', speed: '⚡', helpful: '🤝', leader: '👑',
};

interface LeaderboardEntry {
  rank: number; userId: string; name: string; avatar?: string;
  points: number; heroLevel: string; badges: number; totalContributions: number;
  assignedTasks?: number; completedTasks?: number; pendingTasks?: number;
  avgResolutionTime?: number; monthlyPerformance?: number[];
  activeThisMonth?: boolean; earnedBadgeIds?: string[];
}

interface BadgeDef { id: string; name: string; icon: string; description: string; rarity?: string; }

interface VolunteerStats {
  totalVolunteers: number; totalPoints: number; totalContributions: number;
  activeThisMonth: number; avgContributions: number;
}

const heroLevels = [
  { key: 'newcomer', level: 1, name: 'Newcomer', minPoints: 0, color: 'from-slate-400 to-gray-500', icon: '🌱', description: 'Just getting started on your civic journey. Every hero begins here!' },
  { key: 'contributor', level: 2, name: 'Contributor', minPoints: 100, color: 'from-emerald-400 to-green-500', icon: '🤝', description: 'Your first contributions are making waves. The community notices!' },
  { key: 'active_citizen', level: 3, name: 'Active Citizen', minPoints: 250, color: 'from-blue-400 to-indigo-500', icon: '🛡️', description: 'A regular defender of civic wellbeing. Your efforts matter!' },
  { key: 'community_guardian', level: 4, name: 'Community Guardian', minPoints: 500, color: 'from-purple-400 to-violet-500', icon: '🏆', description: 'A trusted protector of the community. You go above and beyond!' },
  { key: 'city_champion', level: 5, name: 'City Champion', minPoints: 1000, color: 'from-amber-400 to-yellow-500', icon: '👑', description: 'An exceptional civic leader. Your city is better because of you!' },
  { key: 'legendary_hero', level: 6, name: 'Legendary Hero', minPoints: 5000, color: 'from-red-400 to-rose-500', icon: '⚡', description: 'The pinnacle of civic heroism. You are an inspiration to all!' },
];

const fallbackLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: '1', name: 'Priya Sharma', points: 4820, heroLevel: 'city_champion', badges: 12, totalContributions: 156, avatar: 'PS', assignedTasks: 45, completedTasks: 42, pendingTasks: 3, avgResolutionTime: 2.4, monthlyPerformance: [18, 22, 15, 28, 32, 20, 25], activeThisMonth: true, earnedBadgeIds: ['first_report', 'verifier', 'streak_7', 'streak_30', 'reports_10', 'reports_50', 'accuracy_90'] },
  { rank: 2, userId: '2', name: 'Rahul Kumar', points: 3650, heroLevel: 'city_champion', badges: 10, totalContributions: 128, avatar: 'RK', assignedTasks: 38, completedTasks: 35, pendingTasks: 3, avgResolutionTime: 3.1, monthlyPerformance: [12, 18, 22, 16, 20, 24, 18], activeThisMonth: true, earnedBadgeIds: ['first_report', 'verifier', 'streak_7', 'reports_10', 'reports_50'] },
  { rank: 3, userId: '3', name: 'Anita Patel', points: 2890, heroLevel: 'community_guardian', badges: 8, totalContributions: 98, avatar: 'AP', assignedTasks: 30, completedTasks: 28, pendingTasks: 2, avgResolutionTime: 3.8, monthlyPerformance: [10, 14, 12, 18, 15, 20, 16], activeThisMonth: true, earnedBadgeIds: ['first_report', 'streak_7', 'reports_10', 'accuracy_90'] },
  { rank: 4, userId: '4', name: 'Vikram Singh', points: 2140, heroLevel: 'community_guardian', badges: 7, totalContributions: 82, avatar: 'VS', assignedTasks: 25, completedTasks: 22, pendingTasks: 3, avgResolutionTime: 4.2, monthlyPerformance: [8, 12, 10, 14, 16, 11, 13], activeThisMonth: true, earnedBadgeIds: ['first_report', 'streak_7', 'reports_10'] },
  { rank: 5, userId: '5', name: 'Meera Reddy', points: 1780, heroLevel: 'community_guardian', badges: 6, totalContributions: 65, avatar: 'MR', assignedTasks: 20, completedTasks: 18, pendingTasks: 2, avgResolutionTime: 4.5, monthlyPerformance: [6, 8, 10, 12, 9, 11, 10], activeThisMonth: true, earnedBadgeIds: ['first_report', 'streak_7', 'reports_10'] },
  { rank: 6, userId: '6', name: 'Arjun Nair', points: 1420, heroLevel: 'active_citizen', badges: 5, totalContributions: 54, avatar: 'AN', assignedTasks: 18, completedTasks: 15, pendingTasks: 3, avgResolutionTime: 5.0, monthlyPerformance: [5, 7, 8, 10, 8, 9, 7], activeThisMonth: true, earnedBadgeIds: ['first_report', 'streak_7', 'reports_10'] },
  { rank: 7, userId: '7', name: 'Deepa Iyer', points: 1100, heroLevel: 'active_citizen', badges: 4, totalContributions: 42, avatar: 'DI', assignedTasks: 15, completedTasks: 13, pendingTasks: 2, avgResolutionTime: 5.5, monthlyPerformance: [4, 6, 5, 8, 7, 6, 8], activeThisMonth: true, earnedBadgeIds: ['first_report', 'streak_7', 'reports_10'] },
  { rank: 8, userId: '8', name: 'Karthik Menon', points: 850, heroLevel: 'active_citizen', badges: 3, totalContributions: 35, avatar: 'KM', assignedTasks: 12, completedTasks: 10, pendingTasks: 2, avgResolutionTime: 6.2, monthlyPerformance: [3, 5, 4, 6, 7, 5, 6], activeThisMonth: false, earnedBadgeIds: ['first_report', 'streak_7'] },
];

const fallbackBadges: BadgeDef[] = [
  { id: 'first_report', name: 'First Responder', icon: 'report', description: 'Reported your first issue', rarity: 'common' },
  { id: 'verifier', name: 'Truth Seeker', icon: 'verify', description: 'Verified 10 issues', rarity: 'uncommon' },
  { id: 'commenter', name: 'Voice of Community', icon: 'comment', description: 'Added 50 comments', rarity: 'uncommon' },
  { id: 'streak_7', name: 'Week Warrior', icon: 'streak', description: '7-day contribution streak', rarity: 'rare' },
  { id: 'streak_30', name: 'Monthly Champion', icon: 'streak', description: '30-day contribution streak', rarity: 'epic' },
  { id: 'reports_10', name: 'Issue Hunter', icon: 'report', description: 'Reported 10 issues', rarity: 'uncommon' },
  { id: 'reports_50', name: 'City Guardian', icon: 'report', description: 'Reported 50 issues', rarity: 'rare' },
  { id: 'accuracy_90', name: 'Precision Expert', icon: 'accuracy', description: '90%+ verification accuracy', rarity: 'epic' },
  { id: 'speed_demon', name: 'Speed Demon', icon: 'speed', description: 'Average resolution under 3 hours', rarity: 'rare' },
  { id: 'helpful', name: 'Helping Hand', icon: 'helpful', description: 'Helped 25 community members', rarity: 'uncommon' },
  { id: 'leader', name: 'Born Leader', icon: 'leader', description: 'Reached City Champion level', rarity: 'legendary' },
];

const rarityStyles: Record<string, { bg: string; border: string; glow: string; label: string }> = {
  common: { bg: 'from-slate-100 to-gray-100 dark:from-slate-700 dark:to-slate-800', border: 'border-slate-300 dark:border-slate-600', glow: '', label: 'Common' },
  uncommon: { bg: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20', border: 'border-emerald-300 dark:border-emerald-700', glow: 'shadow-emerald-200/50', label: 'Uncommon' },
  rare: { bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-300 dark:border-blue-700', glow: 'shadow-blue-200/50', label: 'Rare' },
  epic: { bg: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20', border: 'border-purple-300 dark:border-purple-700', glow: 'shadow-purple-200/50', label: 'Epic' },
  legendary: { bg: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20', border: 'border-amber-400 dark:border-amber-600', glow: 'shadow-amber-300/50', label: 'Legendary' },
};

function getLevelInfo(heroLevel: string) {
  return heroLevels.find((l) => l.key === heroLevel) || heroLevels[0];
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getLevelProgress(points: number, levelKey: string) {
  const level = heroLevels.find((l) => l.key === levelKey);
  if (!level) return 0;
  const nextLevel = heroLevels.find((l) => l.level === level.level + 1);
  if (!nextLevel) return 100;
  const range = nextLevel.minPoints - level.minPoints;
  const current = points - level.minPoints;
  return Math.min(100, Math.round((current / range) * 100));
}

function Sparkline({ data, max }: { data: number[]; max: number }) {
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J'];
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${max > 0 ? (v / max) * 100 : 0}%` }}
            transition={{ duration: 0.5, delay: 0.05 * i }}
            className="w-full min-h-[2px] bg-gradient-to-t from-amber-400 to-yellow-300 rounded-t-sm"
          />
          <span className="text-[8px] text-slate-400">{months[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function HeroesPage() {
  const theme = pageThemes.heroes;
  const [tab, setTab] = useState<'leaderboard' | 'performance' | 'badges' | 'levels'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<BadgeDef[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [lbRes, badgesRes, statsRes] = await Promise.allSettled([
          api.get('/volunteers/leaderboard', { params: { period: 'all', limit: 20 } }),
          api.get('/volunteers/badges'),
          api.get('/volunteers/stats'),
        ]);
        const lbData = lbRes.status === 'fulfilled' ? lbRes.value.data : null;
        const bdData = badgesRes.status === 'fulfilled' ? badgesRes.value.data : null;
        const stData = statsRes.status === 'fulfilled' ? statsRes.value.data : null;
        if (lbData) {
          const entries: LeaderboardEntry[] = Array.isArray(lbData) ? lbData : lbData.data || [];
          setLeaderboard(entries.length > 0 ? entries : fallbackLeaderboard);
        } else { setLeaderboard(fallbackLeaderboard); }
        if (stData) {
          setStats({ totalVolunteers: stData.totalVolunteers || 0, totalPoints: stData.totalPoints || 0, totalContributions: stData.totalContributions || 0, activeThisMonth: stData.activeThisMonth || 0, avgContributions: stData.avgContributions || 0 });
        } else {
          setStats({ totalVolunteers: fallbackLeaderboard.length, totalPoints: fallbackLeaderboard.reduce((s, e) => s + e.points, 0), totalContributions: fallbackLeaderboard.reduce((s, e) => s + e.totalContributions, 0), activeThisMonth: fallbackLeaderboard.filter(e => e.activeThisMonth).length, avgContributions: 90 });
        }
        if (bdData) {
          const bdList: BadgeDef[] = Array.isArray(bdData) ? bdData : bdData.data || [];
          setBadges(bdList.length > 0 ? bdList : fallbackBadges);
        } else { setBadges(fallbackBadges); }
      } catch {
        setLeaderboard(fallbackLeaderboard);
        setBadges(fallbackBadges);
        setStats({ totalVolunteers: fallbackLeaderboard.length, totalPoints: fallbackLeaderboard.reduce((s, e) => s + e.points, 0), totalContributions: fallbackLeaderboard.reduce((s, e) => s + e.totalContributions, 0), activeThisMonth: fallbackLeaderboard.filter(e => e.activeThisMonth).length, avgContributions: 90 });
        setError('Could not load live data. Showing sample data.');
      } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const filteredLeaderboard = useMemo(() => {
    let result = leaderboard;
    if (searchQuery) result = result.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (levelFilter !== 'all') result = result.filter(e => e.heroLevel === levelFilter);
    return result;
  }, [leaderboard, searchQuery, levelFilter]);

  const topThree = filteredLeaderboard.slice(0, 3);
  const rest = filteredLeaderboard.slice(3);
  const statsDisplay = stats || { totalVolunteers: fallbackLeaderboard.length, totalPoints: 18650, totalContributions: 660, activeThisMonth: 7, avgContributions: 90 };

  return (
    <AppShell>
      <div className={cn(theme.background, 'min-h-full')}>
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={cn(theme.gradient, 'rounded-2xl p-6 text-white relative overflow-hidden')}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHN0YXIgc3R5bGU9ImZpbGw6cmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgY3g9IjIwIiBjeT0iMjAiIG9yPSIxMCI+PC9zdGFyPjwvc3ZnPg==')] opacity-50" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm text-3xl">🏆</div>
                <div>
                  <h1 className="text-2xl font-bold font-heading">Community Heroes</h1>
                  <p className="text-white/80 text-sm">Celebrating our civic champions making a difference</p>
                </div>
              </div>
              <div className="relative z-10 mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
                  <UserGroupIcon className="w-4 h-4 text-white/60 mx-auto mb-1" />
                  <p className="text-lg font-bold">{statsDisplay.totalVolunteers}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Volunteers</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
                  <StarIcon className="w-4 h-4 text-white/60 mx-auto mb-1" />
                  <p className="text-lg font-bold">{statsDisplay.totalPoints.toLocaleString()}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Total Points</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
                  <ChartBarIcon className="w-4 h-4 text-white/60 mx-auto mb-1" />
                  <p className="text-lg font-bold">{statsDisplay.activeThisMonth}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Active This Month</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
                  <SparklesIcon className="w-4 h-4 text-white/60 mx-auto mb-1" />
                  <p className="text-lg font-bold">{statsDisplay.avgContributions}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Avg Contributions</p>
                </div>
              </div>
            </div>
          </motion.div>

          {error && (
            <div className="bg-amber-100 text-amber-800 text-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Search & Filter */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search volunteers by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" />
            </div>
            <div className="relative">
              <FunnelIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none cursor-pointer">
                <option value="all">All Levels</option>
                {heroLevels.map((l) => (<option key={l.key} value={l.key}>{l.icon} {l.name}</option>))}
              </select>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([['leaderboard', '🏆 Leaderboard'], ['performance', '📊 Performance'], ['badges', '🎖️ Badges'], ['levels', '⬆️ Levels']] as const).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap', tab === t ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700')}>
                {label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 animate-pulse flex items-center gap-4 border border-white/20 dark:border-slate-700/50">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LEADERBOARD TAB */}
          {!loading && tab === 'leaderboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {filteredLeaderboard.length === 0 ? (
                <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/20 dark:border-slate-700/50">
                  <TrophyIcon className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">No volunteers found</p>
                  <p className="text-sm mt-1 text-slate-400 dark:text-slate-500">Try adjusting your search or filter</p>
                </div>
              ) : (
                <>
                  {topThree.length >= 3 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[topThree[1], topThree[0], topThree[2]].map((hero, i) => {
                        const heights = ['h-36', 'h-44', 'h-32'];
                        const medals = ['🥈', '🥇', '🥉'];
                        const levelInfo = getLevelInfo(hero.heroLevel);
                        const avatarColors = ['from-slate-400 to-gray-500', 'from-amber-400 to-yellow-500', 'from-orange-400 to-amber-500'];
                        return (
                          <motion.div key={hero.userId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="flex flex-col items-center">
                            <span className="text-3xl mb-1">{medals[i]}</span>
                            <div className={cn('w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg border-3 border-white shadow-lg', avatarColors[i])}>
                              {hero.avatar || getInitials(hero.name)}
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-2 text-center">{hero.name}</p>
                            <p className="text-xs text-slate-500">{hero.points.toLocaleString()} pts</p>
                            <p className="text-[10px] text-amber-600 mt-0.5">{levelInfo.icon} {levelInfo.name}</p>
                            <div className={cn('w-full bg-gradient-to-b from-amber-400/20 to-amber-400/5 rounded-t-xl mt-2 flex items-start justify-center pt-3', heights[i])}>
                              <span className="text-2xl font-black text-amber-600/50">#{hero.rank}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                  {rest.map((hero, i) => {
                    const levelInfo = getLevelInfo(hero.heroLevel);
                    return (
                      <motion.div key={hero.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-all border border-white/20 dark:border-slate-700/50">
                        <span className="text-lg font-bold text-slate-400 w-8 text-center">#{hero.rank}</span>
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                          {hero.avatar || getInitials(hero.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{hero.name}</p>
                          <p className="text-xs text-slate-500">{hero.totalContributions} contributions · {hero.badges} badges</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{hero.points.toLocaleString()}</p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 justify-end">{levelInfo.icon} {levelInfo.name}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </motion.div>
          )}

          {/* PERFORMANCE TAB */}
          {!loading && tab === 'performance' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLeaderboard.length === 0 ? (
                <div className="col-span-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/20 dark:border-slate-700/50">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">No volunteers found</p>
                </div>
              ) : (
                filteredLeaderboard.map((hero, i) => {
                  const levelInfo = getLevelInfo(hero.heroLevel);
                  const progress = getLevelProgress(hero.points, hero.heroLevel);
                  const maxPerf = hero.monthlyPerformance ? Math.max(...hero.monthlyPerformance, 1) : 1;
                  const completionRate = hero.assignedTasks ? Math.round((hero.completedTasks || 0) / hero.assignedTasks * 100) : 0;
                  const nextLevelPoints = heroLevels.find(l => l.level === levelInfo.level + 1)?.minPoints;
                  return (
                    <motion.div key={hero.userId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-sm font-bold">
                          {hero.avatar || getInitials(hero.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{hero.name}</p>
                          <p className="text-[11px] text-slate-500">Rank #{hero.rank} · {levelInfo.icon} {levelInfo.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{hero.points.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 uppercase">points</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5 text-center">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{hero.assignedTasks || 0}</p>
                          <p className="text-[9px] text-blue-500/70 uppercase tracking-wider">Assigned</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2.5 text-center">
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{hero.completedTasks || 0}</p>
                          <p className="text-[9px] text-emerald-500/70 uppercase tracking-wider">Completed</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5 text-center">
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{hero.pendingTasks || 0}</p>
                          <p className="text-[9px] text-amber-500/70 uppercase tracking-wider">Pending</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs text-slate-500">Avg Resolution Time</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{hero.avgResolutionTime || 0} hrs</span>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Completion Rate</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{completionRate}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" />
                        </div>
                      </div>
                      {hero.monthlyPerformance && (
                        <div className="mb-3">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Monthly Performance</p>
                          <Sparkline data={hero.monthlyPerformance} max={maxPerf} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Hero Level Progress</span>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                            className={cn('h-full bg-gradient-to-r rounded-full', levelInfo.color)} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {hero.points.toLocaleString()} / {nextLevelPoints ? nextLevelPoints.toLocaleString() : 'MAX'} pts to next level
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* BADGES TAB */}
          {!loading && tab === 'badges' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.map((badge, i) => {
                  const icon = BADGE_ICONS[badge.icon] || '🏅';
                  const rarity = rarityStyles[badge.rarity || 'common'] || rarityStyles.common;
                  const isUnlocked = filteredLeaderboard.some(v => v.earnedBadgeIds?.includes(badge.id));
                  return (
                    <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.04 * i }}
                      className={cn('relative rounded-2xl p-5 text-center border-2 transition-all hover:shadow-lg', rarity.border, isUnlocked ? `bg-gradient-to-br ${rarity.bg} ${rarity.glow}` : 'bg-slate-100/50 dark:bg-slate-800/50 opacity-60 grayscale')}>
                      {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center z-10"><span className="text-2xl">🔒</span></div>}
                      <span className="text-4xl block mb-2">{icon}</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{badge.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                      <span className={cn('inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                        badge.rarity === 'legendary' ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                        badge.rarity === 'epic' ? 'bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                        badge.rarity === 'rare' ? 'bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                        badge.rarity === 'uncommon' ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      )}>{rarity.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* LEVELS TAB */}
          {!loading && tab === 'levels' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {heroLevels.map((level, i) => {
                const volunteersAtLevel = filteredLeaderboard.filter(e => e.heroLevel === level.key).length;
                return (
                  <motion.div key={level.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                    className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg', level.color)}>
                        {level.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">LEVEL {level.level}</span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">{level.name}</h4>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{level.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-xs text-slate-400">{level.minPoints.toLocaleString()} points required</p>
                          {volunteersAtLevel > 0 && (
                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                              {volunteersAtLevel} volunteer{volunteersAtLevel !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: volunteersAtLevel > 0 ? `${Math.min(100, (volunteersAtLevel / filteredLeaderboard.length) * 100)}%` : '0%' }} transition={{ duration: 0.8, delay: 0.2 }}
                            className={cn('h-full bg-gradient-to-r rounded-full', level.color)} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
