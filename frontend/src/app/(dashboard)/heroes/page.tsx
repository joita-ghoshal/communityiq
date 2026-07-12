'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrophyIcon } from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import api from '@/lib/api';

const BADGE_ICONS: Record<string, string> = {
  report: '📝',
  verify: '✅',
  comment: '💬',
  streak: '🔥',
  accuracy: '🎯',
};

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  points: number;
  heroLevel: string;
  badges: number;
  totalContributions: number;
}

interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface VolunteerStats {
  totalVolunteers: number;
  totalPoints: number;
  totalContributions: number;
}

const heroLevels = [
  { key: 'newcomer', level: 1, name: 'Newcomer', minPoints: 0, color: 'from-slate-400 to-gray-500', icon: '🌱' },
  { key: 'contributor', level: 2, name: 'Contributor', minPoints: 100, color: 'from-emerald-400 to-green-500', icon: '🤝' },
  { key: 'active_citizen', level: 3, name: 'Active Citizen', minPoints: 250, color: 'from-blue-400 to-indigo-500', icon: '🛡️' },
  { key: 'community_guardian', level: 4, name: 'Community Guardian', minPoints: 500, color: 'from-purple-400 to-violet-500', icon: '🏆' },
  { key: 'city_champion', level: 5, name: 'City Champion', minPoints: 1000, color: 'from-amber-400 to-yellow-500', icon: '👑' },
  { key: 'legendary_hero', level: 6, name: 'Legendary Hero', minPoints: 5000, color: 'from-red-400 to-rose-500', icon: '⚡' },
];

const fallbackLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: '1', name: 'Priya Sharma', points: 4820, heroLevel: 'city_champion', badges: 12, totalContributions: 156, avatar: 'PS' },
  { rank: 2, userId: '2', name: 'Rahul Kumar', points: 3650, heroLevel: 'city_champion', badges: 10, totalContributions: 128, avatar: 'RK' },
  { rank: 3, userId: '3', name: 'Anita Patel', points: 2890, heroLevel: 'community_guardian', badges: 8, totalContributions: 98, avatar: 'AP' },
  { rank: 4, userId: '4', name: 'Vikram Singh', points: 2140, heroLevel: 'community_guardian', badges: 7, totalContributions: 82, avatar: 'VS' },
  { rank: 5, userId: '5', name: 'Meera Reddy', points: 1780, heroLevel: 'community_guardian', badges: 6, totalContributions: 65, avatar: 'MR' },
  { rank: 6, userId: '6', name: 'Arjun Nair', points: 1420, heroLevel: 'active_citizen', badges: 5, totalContributions: 54, avatar: 'AN' },
  { rank: 7, userId: '7', name: 'Deepa Iyer', points: 1100, heroLevel: 'active_citizen', badges: 4, totalContributions: 42, avatar: 'DI' },
  { rank: 8, userId: '8', name: 'Karthik Menon', points: 850, heroLevel: 'active_citizen', badges: 3, totalContributions: 35, avatar: 'KM' },
];

const fallbackBadges: BadgeDef[] = [
  { id: 'first_report', name: 'First Responder', icon: 'report', description: 'Reported your first issue' },
  { id: 'verifier', name: 'Truth Seeker', icon: 'verify', description: 'Verified 10 issues' },
  { id: 'commenter', name: 'Voice of Community', icon: 'comment', description: 'Added 50 comments' },
  { id: 'streak_7', name: 'Week Warrior', icon: 'streak', description: '7-day contribution streak' },
  { id: 'streak_30', name: 'Monthly Champion', icon: 'streak', description: '30-day contribution streak' },
  { id: 'reports_10', name: 'Issue Hunter', icon: 'report', description: 'Reported 10 issues' },
  { id: 'reports_50', name: 'City Guardian', icon: 'report', description: 'Reported 50 issues' },
  { id: 'accuracy_90', name: 'Precision Expert', icon: 'accuracy', description: '90%+ verification accuracy' },
];

function getLevelInfo(heroLevel: string) {
  return heroLevels.find((l) => l.key === heroLevel) || heroLevels[0];
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function HeroesPage() {
  const theme = pageThemes.heroes;
  const [tab, setTab] = useState<'leaderboard' | 'badges' | 'levels'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<BadgeDef[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [lbRes, badgesRes] = await Promise.allSettled([
          api.get('/volunteers/leaderboard', { params: { period: 'all', limit: 20 } }),
          api.get('/volunteers/badges'),
        ]);

        const lbData = lbRes.status === 'fulfilled' ? lbRes.value.data : null;
        const bdData = badgesRes.status === 'fulfilled' ? badgesRes.value.data : null;

        if (lbData) {
          const entries: LeaderboardEntry[] = Array.isArray(lbData) ? lbData : lbData.data || [];
          setLeaderboard(entries.length > 0 ? entries : fallbackLeaderboard);
          setStats({
            totalVolunteers: entries.length,
            totalPoints: entries.reduce((sum: number, e: LeaderboardEntry) => sum + e.points, 0),
            totalContributions: entries.reduce((sum: number, e: LeaderboardEntry) => sum + e.totalContributions, 0),
          });
        } else {
          setLeaderboard(fallbackLeaderboard);
        }

        if (bdData) {
          const bdList: BadgeDef[] = Array.isArray(bdData) ? bdData : bdData.data || [];
          setBadges(bdList.length > 0 ? bdList : fallbackBadges);
        } else {
          setBadges(fallbackBadges);
        }
      } catch {
        setLeaderboard(fallbackLeaderboard);
        setBadges(fallbackBadges);
        setError('Could not load live data. Showing sample data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`${theme.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHN0YXIgc3R5bGU9ImZpbGw6cmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgY3g9IjIwIiBjeT0iMjAiIG9yPSIxMCI+PC9zdGFyPjwvc3ZnPg==')] opacity-50" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm text-3xl">🏆</div>
                <div>
                  <h1 className="text-2xl font-bold font-heading">Community Heroes</h1>
                  <p className="text-white/80 text-sm">Celebrating our civic champions making a difference</p>
                </div>
              </div>
              {stats && (
                <div className="relative z-10 mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
                    <p className="text-lg font-bold">{stats.totalVolunteers}</p>
                    <p className="text-[11px] text-white/70">Volunteers</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
                    <p className="text-lg font-bold">{stats.totalPoints.toLocaleString()}</p>
                    <p className="text-[11px] text-white/70">Total Points</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
                    <p className="text-lg font-bold">{stats.totalContributions.toLocaleString()}</p>
                    <p className="text-[11px] text-white/70">Contributions</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Error banner */}
          {error && (
            <div className="bg-amber-100 text-amber-800 text-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {(['leaderboard', 'badges', 'levels'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-amber-500 text-white shadow-md' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-4 animate-pulse flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                  </div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard */}
          {!loading && tab === 'leaderboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {leaderboard.length === 0 ? (
                <div className="glass-card p-12 text-center text-slate-400">
                  <TrophyIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No volunteers yet</p>
                  <p className="text-sm mt-1">Be the first hero to contribute!</p>
                </div>
              ) : (
                <>
                  {/* Top 3 Podium */}
                  {topThree.length >= 3 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[topThree[1], topThree[0], topThree[2]].map((hero, i) => {
                        const heights = ['h-36', 'h-44', 'h-32'];
                        const medals = ['🥈', '🥇', '🥉'];
                        const order = [1, 0, 2];
                        const levelInfo = getLevelInfo(hero.heroLevel);
                        return (
                          <motion.div key={hero.userId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                            className={`flex flex-col items-center ${i === 1 ? 'order-first md:order-none' : ''}`}>
                            <span className="text-3xl mb-1">{medals[i]}</span>
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold text-lg border-3 border-white shadow-lg">
                              {getInitials(hero.name)}
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-2 text-center">{hero.name}</p>
                            <p className="text-xs text-slate-500">{hero.points.toLocaleString()} pts</p>
                            <p className="text-[10px] text-amber-600 mt-0.5">{levelInfo.icon} {levelInfo.name}</p>
                            <div className={`${heights[i]} w-full bg-gradient-to-b from-amber-400/20 to-amber-400/5 rounded-t-xl mt-2 flex items-start justify-center pt-3`}>
                              <span className="text-2xl font-black text-amber-600/50">#{hero.rank}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Rest of leaderboard */}
                  {rest.map((hero, i) => {
                    const levelInfo = getLevelInfo(hero.heroLevel);
                    return (
                      <motion.div key={hero.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                        className="glass-card p-4 flex items-center gap-4 hover:shadow-lg transition-all">
                        <span className="text-lg font-bold text-slate-400 w-8 text-center">#{hero.rank}</span>
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">{getInitials(hero.name)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{hero.name}</p>
                          <p className="text-xs text-slate-500">{hero.totalContributions} contributions · {hero.badges} badges</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{hero.points.toLocaleString()}</p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            {levelInfo.icon} {levelInfo.name}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </motion.div>
          )}

          {/* Badges */}
          {!loading && tab === 'badges' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {badges.map((badge, i) => {
                const icon = BADGE_ICONS[badge.icon] || '🏅';
                return (
                  <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                    className="glass-card p-5 text-center hover:shadow-lg transition-all">
                    <span className="text-4xl block mb-2">{icon}</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{badge.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Hero Levels */}
          {!loading && tab === 'levels' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {heroLevels.map((level, i) => (
                <motion.div key={level.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                  className="glass-card p-5 flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center text-2xl shadow-lg`}>{level.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">LEVEL {level.level}</span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{level.name}</h4>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{level.minPoints.toLocaleString()} points required</p>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 w-48 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (i < 3 ? 100 : i < 4 ? 60 : 20))}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full bg-gradient-to-r ${level.color} rounded-full`} />
                    </div>
                  </div>
                  {i < 3 && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">✓ Reached</span>}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
