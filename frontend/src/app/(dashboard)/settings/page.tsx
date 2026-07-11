'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  Cog6ToothIcon, BellIcon, ShieldCheckIcon, GlobeAltIcon,
  MoonIcon, SunIcon, KeyIcon, UserGroupIcon, PaintBrushIcon,
  UserIcon, PencilIcon, CheckIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

export default function SettingsPage() {
  const { t } = useTranslation('common');
  const theme = pageThemes.settings;
  const { theme: uiTheme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('appearance');
  const [selectedLanguage, setSelectedLanguage] = useState(i18next.language || 'en');

  const [profile, setProfile] = useState({
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91 98765 43210',
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ ...profile });

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const langCode = e.target.value;
    setSelectedLanguage(langCode);
    await i18next.changeLanguage(langCode);
  };

  const sections = [
    { id: 'profile', label: t('settings.profile'), icon: UserIcon },
    { id: 'appearance', label: t('settings.appearance'), icon: PaintBrushIcon },
    { id: 'notifications', label: t('settings.notifications'), icon: BellIcon },
    { id: 'security', label: t('settings.security'), icon: ShieldCheckIcon },
    { id: 'privacy', label: t('settings.privacy'), icon: KeyIcon },
    { id: 'language', label: t('settings.language'), icon: GlobeAltIcon },
  ];

  const handleSaveProfile = () => {
    setProfile({ ...profileDraft });
    setEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setProfileDraft({ ...profile });
    setEditingProfile(false);
  };

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
            <div className={`${theme.gradient} rounded-xl p-2.5 text-white`}>
              <Cog6ToothIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">{t('settings.title')}</h1>
              <p className="text-sm text-slate-500">{t('settings.subtitle')}</p>
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

                {activeSection === 'profile' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">{t('settings.editProfile')}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{t('settings.profileDescription')}</p>
                      </div>
                      {!editingProfile ? (
                        <button onClick={() => { setProfileDraft({ ...profile }); setEditingProfile(true); }}
                          className="btn-secondary border-slate-300 dark:border-slate-600 !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                          <PencilIcon className="w-3.5 h-3.5" />
                          {t('settings.editProfile')}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={handleCancelEdit}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                          <button onClick={handleSaveProfile}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                        {profile.firstName[0]}{profile.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{profile.firstName} {profile.lastName}</p>
                        <p className="text-xs text-slate-500">{profile.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t('settings.memberSince')}: Jan 2024</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: 'firstName', label: t('settings.firstName'), value: profileDraft.firstName },
                        { key: 'lastName', label: t('settings.lastName'), value: profileDraft.lastName },
                        { key: 'email', label: t('settings.email'), value: profileDraft.email },
                        { key: 'phone', label: t('settings.phone'), value: profileDraft.phone },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                          {editingProfile ? (
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => setProfileDraft({ ...profileDraft, [field.key]: e.target.value })}
                              className="input-field"
                            />
                          ) : (
                            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200">
                              {field.value || '—'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {editingProfile && (
                      <div className="flex justify-end gap-3 pt-2">
                        <button onClick={handleCancelEdit}
                          className="btn-secondary border-slate-300 dark:border-slate-600 !py-2 !px-4 text-sm">
                          {t('settings.discard')}
                        </button>
                        <button onClick={handleSaveProfile}
                          className="btn-primary !py-2 !px-4 text-sm">
                          {t('settings.saveChanges')}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {activeSection === 'appearance' && (
                  <>
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">{t('settings.appearance')}</h3>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('settings.theme')}</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: t('settings.light'), icon: SunIcon, preview: 'bg-white border-2' },
                          { value: 'dark', label: t('settings.dark'), icon: MoonIcon, preview: 'bg-slate-900 border-2 border-slate-700' },
                          { value: 'system', label: t('settings.system'), icon: Cog6ToothIcon, preview: 'bg-gradient-to-r from-white to-slate-900 border-2' },
                        ].map((t_item) => (
                          <button key={t_item.value} onClick={() => setTheme(t_item.value)}
                            className={cn('p-4 rounded-xl border-2 text-center transition-all', uiTheme === t_item.value ? 'border-blue-500 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300')}>
                            <div className={`w-full h-16 ${t_item.preview} rounded-lg mb-2`} />
                            <t_item.icon className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-slate-400" />
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t_item.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'notifications' && (
                  <>
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">{t('settings.notifications')}</h3>
                    {[
                      { label: t('settings.pushNotifications'), desc: t('settings.pushNotificationsDesc'), default: true },
                      { label: t('settings.emailNotifications'), desc: t('settings.emailNotificationsDesc'), default: true },
                      { label: t('settings.smsAlerts'), desc: t('settings.smsAlertsDesc'), default: false },
                      { label: t('settings.issueUpdates'), desc: t('settings.issueUpdatesDesc'), default: true },
                      { label: t('settings.communityActivity'), desc: t('settings.communityActivityDesc'), default: true },
                      { label: t('settings.aiInsightsNotifications'), desc: t('settings.aiInsightsDesc'), default: false },
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
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">{t('settings.security')}</h3>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.changePassword')}</p>
                          <p className="text-xs text-slate-500">{t('settings.changePasswordDesc')}</p>
                        </div>
                        <button className="btn-secondary border-slate-300 dark:border-slate-600 !py-1.5 !px-3 text-xs">Update</button>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.twoFactor')}</p>
                          <p className="text-xs text-slate-500">{t('settings.twoFactorDesc')}</p>
                        </div>
                        <button className="btn-primary !py-1.5 !px-3 text-xs bg-emerald-600">Enable</button>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.activeSessions')}</p>
                          <p className="text-xs text-slate-500">{t('settings.activeSessionsDesc')}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{t('settings.devices')}</span>
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'privacy' && (
                  <>
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">{t('settings.privacy')}</h3>
                    <div className="space-y-3">
                      {[
                        { label: t('settings.showProfile'), desc: t('settings.showProfileDesc'), default: true },
                        { label: t('settings.shareLocation'), desc: t('settings.shareLocationDesc'), default: true },
                        { label: t('settings.anonymousReporting'), desc: t('settings.anonymousReportingDesc'), default: false },
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
                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">{t('settings.languageAndRegion')}</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.selectLanguage')}</label>
                      <select
                        className="input-field"
                        value={selectedLanguage}
                        onChange={handleLanguageChange}
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.selectTimezone')}</label>
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
