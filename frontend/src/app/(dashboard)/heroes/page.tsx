'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrophyIcon, StarIcon, FireIcon, HeartIcon,
  CheckBadgeIcon, ArrowUpIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';

const heroLevels = [
  { level: 1, name: 'Newcomer', minPoints: 0, color: 'from-slate-400 to-gray-500', icon: '🌱' },
  { level: 2, name: 'Helper', minPoints: 100, color: 'from-emerald-400 to-green-500', icon: '🤝' },
  { level: 3, name: 'Guardian', minPoints: 500, color: 'from-blue-400 to-indigo-500', icon: '🛡️' },
  { level: 4, name: 'Champion', minPoints: 1500, color: 'from-purple-400 to-violet-500', icon: '🏆' },
  { level: 5, name: 'Legend', minPoints: 5000, color: 'from-amber-400 to-yellow-500', icon: '👑' },
];

const leaderboard = [
  { rank: 1, name: 'Priya Sharma', points: 4820, contributions: 156, badges: 12, level: 5, avatar: 'PS', trend: '+230' },
  { rank: 2, name: 'Rahul Kumar', points: 3650, contributions: 128, badges: 10, level: 5, avatar: 'RK', trend: '+180' },
  { rank: 3, name: 'Anita Patel', points: 2890, contributions: 98, badges: 8, level: 4, avatar: 'AP', trend: '+150' },
  { rank: 4, name: 'Vikram Singh', points: 2140, contributions: 82, badges: 7, level: 4, avatar: 'VS', trend: '+120' },
  { rank: 5, name: 'Meera Reddy', points: 1780, contributions: 65, badges: 6, level: 4, avatar: 'MR', trend: '+95' },
  { rank: 6, name: 'Arjun Nair', points: 1420, contributions: 54, badges: 5, level: 3, avatar: 'AN', trend: '+80' },
  { rank: 7, name: 'Deepa Iyer', points: 1100, contributions: 42, badges: 4, level: 3, avatar: 'DI', trend: '+65' },
  { rank: 8, name: 'Karthik Menon', points: 850, contributions: 35, badges: 3, level: 3, avatar: 'KM', trend: '+50' },
];

const badges = [
  { name: 'First Report', icon: '📝', desc: 'Submit your first issue report', earned: true },
  { name: 'Verified Helper', icon: '✅', desc: 'Verify 10 community reports', earned: true },
  { name: 'Night Watch', icon: '🌙', desc: 'Report 5 issues between 10PM-6AM', earned: true },
  { name: 'Speed Demon', icon: '⚡', desc: 'Report an issue within 1 minute of occurrence', earned: false },
  { name: 'Community Pillar', icon: '🏛️', desc: 'Reach 100 verified contributions', earned: false },
  { name: 'Eagle Eye', icon: '🦅', desc: 'Correctly identify 25 fake reports', earned: false },
];

export default function HeroesPage() {
  const theme = pageThemes.heroes;
  const [tab, setTab] = useState<'leaderboard' | 'badges' | 'levels'>('leaderboard');

  return (
    <AppShell>
      <div className={`${theme.bg} ${theme.darkBg} min-h-full`}>
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
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(['leaderboard', 'badges', 'levels'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-amber-500 text-white shadow-md' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Leaderboard */}
          {tab === 'leaderboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[leaderboard[1], leaderboard[0], leaderboard[2]].map((hero, i) => {
                  const heights = ['h-36', 'h-44', 'h-32'];
                  const medals = ['🥈', '🥇', '🥉'];
                  const order = [1, 0, 2];
                  return (
                    <motion.div key={hero.rank} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                      className={`flex flex-col items-center ${i === 1 ? 'order-first md:order-none' : ''}`}>
                      <span className="text-3xl mb-1">{medals[i]}</span>
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold text-lg border-3 border-white shadow-lg">
                        {hero.avatar}
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-2 text-center">{hero.name}</p>
                      <p className="text-xs text-slate-500">{hero.points.toLocaleString()} pts</p>
                      <div className={`${heights[i]} w-full bg-gradient-to-b from-amber-400/20 to-amber-400/5 rounded-t-xl mt-2 flex items-start justify-center pt-3`}>
                        <span className="text-2xl font-black text-amber-600/50">#{hero.rank}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Rest of leaderboard */}
              {leaderboard.slice(3).map((hero, i) => (
                <motion.div key={hero.rank} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                  className="glass-card p-4 flex items-center gap-4 hover:shadow-lg transition-all">
                  <span className="text-lg font-bold text-slate-400 w-8 text-center">#{hero.rank}</span>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">{hero.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{hero.name}</p>
                    <p className="text-xs text-slate-500">{hero.contributions} contributions · {hero.badges} badges</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{hero.points.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <ArrowUpIcon className="w-3 h-3" />{hero.trend}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Badges */}
          {tab === 'badges' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {badges.map((badge, i) => (
                <motion.div key={badge.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                  className={`glass-card p-5 text-center transition-all ${badge.earned ? 'hover:shadow-lg' : 'opacity-50 grayscale'}`}>
                  <span className="text-4xl block mb-2">{badge.icon}</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{badge.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{badge.desc}</p>
                  {badge.earned && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckBadgeIcon className="w-3 h-3" /> Earned
                    </span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Hero Levels */}
          {tab === 'levels' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {heroLevels.map((level, i) => (
                <motion.div key={level.level} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
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
