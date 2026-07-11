'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cog6ToothIcon, BellIcon, ShieldCheckIcon, GlobeAltIcon,
  MoonIcon, SunIcon, KeyIcon, UserGroupIcon, PaintBrushIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const theme = pageThemes.settings;
  const { theme: uiTheme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('appearance');

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'privacy', label: 'Privacy', icon: KeyIcon },
    { id: 'language', label: 'Language', icon: GlobeAltIcon },
  ];

  return (
    <AppShell>
      <div className={`${theme.bg} ${theme.darkBg} min-h-full`}>
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
            <div className={`${theme.gradient} rounded-xl p-2.5 text-white`}>
              <Cog6ToothIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">Settings</h1>
              <p className="text-sm text-slate-500">Customize your experience</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="glass-card p-2 space-y-1">
                {sections.map((s) => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      activeSection === s.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="md:col-span-3">
              <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass-card-strong p-6 space-y-6">
                {activeSection === 'appearance' && (
                  <>
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Appearance</h3>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Theme</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Light', icon: SunIcon, preview: 'bg-white border-2' },
                          { value: 'dark', label: 'Dark', icon: MoonIcon, preview: 'bg-slate-900 border-2 border-slate-700' },
                          { value: 'system', label: 'System', icon: Cog6ToothIcon, preview: 'bg-gradient-to-r from-white to-slate-900 border-2' },
                        ].map((t) => (
                          <button key={t.value} onClick={() => setTheme(t.value)}
                            className={cn('p-4 rounded-xl border-2 text-center transition-all', uiTheme === t.value ? 'border-blue-500 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300')}>
                            <div className={`w-full h-16 ${t.preview} rounded-lg mb-2`} />
                            <t.icon className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-slate-400" />
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'notifications' && (
                  <>
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Notification Preferences</h3>
                    {[
                      { label: 'Push Notifications', desc: 'Receive push notifications for important updates', default: true },
                      { label: 'Email Notifications', desc: 'Receive email for issue status changes', default: true },
                      { label: 'SMS Alerts', desc: 'Get SMS for emergency alerts', default: false },
                      { label: 'Issue Updates', desc: 'Notifications when your reported issues change status', default: true },
                      { label: 'Community Activity', desc: 'Updates from your community and volunteers', default: true },
                      { label: 'AI Insights', desc: 'Weekly AI-generated community intelligence reports', default: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                    ))}
                  </>
                )}

                {activeSection === 'security' && (
                  <>
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Security</h3>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</p>
                          <p className="text-xs text-slate-500">Update your password regularly</p>
                        </div>
                        <button className="btn-secondary border-slate-300 dark:border-slate-600 !py-1.5 !px-3 text-xs">Update</button>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</p>
                          <p className="text-xs text-slate-500">Add an extra layer of security</p>
                        </div>
                        <button className="btn-primary !py-1.5 !px-3 text-xs bg-emerald-600">Enable</button>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Active Sessions</p>
                          <p className="text-xs text-slate-500">Manage your active sessions</p>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">2 devices</span>
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'privacy' && (
                  <>
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Privacy</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Show Profile to Others', desc: 'Allow other users to see your profile', default: true },
                        { label: 'Share Location', desc: 'Share your location for nearby issue detection', default: true },
                        { label: 'Anonymous Reporting', desc: 'Allow anonymous issue submissions', default: false },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeSection === 'language' && (
                  <>
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Language & Region</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language</label>
                      <select className="input-field">
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Bengali</option>
                        <option>Tamil</option>
                        <option>Telugu</option>
                        <option>Marathi</option>
                        <option>Gujarati</option>
                        <option>Kannada</option>
                        <option>Malayalam</option>
                        <option>Punjabi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Timezone</label>
                      <select className="input-field">
                        <option>Asia/Kolkata (IST)</option>
                        <option>Asia/Dubai (GST)</option>
                        <option>UTC</option>
                      </select>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
