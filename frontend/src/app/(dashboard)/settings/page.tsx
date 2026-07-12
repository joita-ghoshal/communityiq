'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  Cog6ToothIcon, BellIcon, ShieldCheckIcon, GlobeAltIcon,
  MoonIcon, SunIcon, KeyIcon, UserGroupIcon, PaintBrushIcon,
  UserIcon, PencilIcon, CheckIcon, XMarkIcon, ArrowLeftIcon,
  CameraIcon, LockClosedIcon, DevicePhoneMobileIcon,
  TrashIcon, ArrowRightOnRectangleIcon, DocumentTextIcon,
  EyeIcon, EyeSlashIcon, ShieldExclamationIcon,
  CommandLineIcon, InformationCircleIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [selectedLanguage, setSelectedLanguage] = useState(i18next.language || 'en');

  const [profile, setProfile] = useState({
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91 98765 43210',
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ ...profile });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsAlerts: false,
    issueUpdates: true,
    communityActivity: true,
    aiInsights: false,
    emergencyAlerts: true,
    weeklyDigest: true,
  });

  // Security state
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [activeSessions] = useState([
    { device: 'Chrome on Windows', location: 'Mumbai, India', time: 'Active now', current: true },
    { device: 'Safari on iPhone', location: 'Mumbai, India', time: '2 hours ago', current: false },
    { device: 'Firefox on Linux', location: 'Delhi, India', time: '3 days ago', current: false },
  ]);

  // Privacy state
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    shareLocation: true,
    anonymousReporting: false,
  });

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const langCode = e.target.value;
    setSelectedLanguage(langCode);
    await i18next.changeLanguage(langCode);
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'privacy', label: 'Data & Privacy', icon: KeyIcon },
    { id: 'language', label: 'Language', icon: GlobeAltIcon },
    { id: 'about', label: 'About', icon: InformationCircleIcon },
  ];

  const handleSaveProfile = () => {
    setProfile({ ...profileDraft });
    setEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setProfileDraft({ ...profile });
    setEditingProfile(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const passwordStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength];
  const passwordStrengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'][passwordStrength];

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
          {/* Back Arrow + Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
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
              <AnimatePresence mode="wait">
                <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass-card-strong p-6 space-y-6">

                  {/* Profile Section */}
                  {activeSection === 'profile' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit Profile</h3>
                          <p className="text-sm text-slate-500 mt-0.5">Manage your personal information</p>
                        </div>
                        {!editingProfile ? (
                          <button onClick={() => { setProfileDraft({ ...profile }); setEditingProfile(true); }}
                            className="btn-secondary border-slate-300 dark:border-slate-600 !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                            <PencilIcon className="w-3.5 h-3.5" />
                            Edit Profile
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

                      {/* Avatar */}
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="relative group">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                            {avatarPreview ? (
                              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{profile.firstName[0]}{profile.lastName[0]}</span>
                            )}
                          </div>
                          {editingProfile && (
                            <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <CameraIcon className="w-6 h-6 text-white" />
                              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </label>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{profile.firstName} {profile.lastName}</p>
                          <p className="text-xs text-slate-500">{profile.email}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Member since Jan 2024</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { key: 'firstName', label: 'First Name', value: profileDraft.firstName },
                          { key: 'lastName', label: 'Last Name', value: profileDraft.lastName },
                          { key: 'email', label: 'Email', value: profileDraft.email },
                          { key: 'phone', label: 'Phone', value: profileDraft.phone },
                        ].map((field) => (
                          <div key={field.key}>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                            {editingProfile ? (
                              <input
                                type={field.key === 'email' ? 'email' : field.key === 'phone' ? 'tel' : 'text'}
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
                            Discard
                          </button>
                          <button onClick={handleSaveProfile}
                            className="btn-primary !py-2 !px-4 text-sm">
                            Save Changes
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Appearance Section */}
                  {activeSection === 'appearance' && (
                    <>
                      <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Appearance</h3>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Theme</p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'light', label: 'Light', icon: SunIcon, preview: 'bg-white border-2', accent: 'border-slate-200' },
                            { value: 'dark', label: 'Dark', icon: MoonIcon, preview: 'bg-slate-900 border-2 border-slate-700', accent: 'border-slate-700' },
                            { value: 'system', label: 'System', icon: Cog6ToothIcon, preview: 'bg-gradient-to-r from-white to-slate-900 border-2', accent: 'border-slate-300' },
                          ].map((t_item) => (
                            <button key={t_item.value} onClick={() => setTheme(t_item.value)}
                              className={cn('p-4 rounded-xl border-2 text-center transition-all', uiTheme === t_item.value ? 'border-blue-500 shadow-md shadow-blue-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300')}>
                              <div className={`w-full h-16 ${t_item.preview} rounded-lg mb-2 relative overflow-hidden`}>
                                <div className="absolute top-1 left-1 right-1 h-2 rounded bg-slate-200/50 dark:bg-slate-600/50" />
                                <div className="absolute top-4 left-1 w-1/3 h-6 rounded bg-slate-100/50 dark:bg-slate-700/50" />
                                <div className="absolute top-4 right-1 w-2/3 h-6 rounded bg-blue-100/50 dark:bg-blue-900/30" />
                                <div className="absolute bottom-1 left-1 right-1 h-3 rounded bg-slate-100/50 dark:bg-slate-800/50" />
                              </div>
                              <t_item.icon className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-slate-400" />
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t_item.label}</p>
                              {uiTheme === t_item.value && (
                                <div className="flex items-center justify-center mt-1">
                                  <CheckIcon className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Preview</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">FX</div>
                          <div className="flex-1">
                            <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
                            <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                          </div>
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckIcon className="w-3 h-3 text-green-600" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notifications Section */}
                  {activeSection === 'notifications' && (
                    <>
                      <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Notifications</h3>
                      <p className="text-sm text-slate-500 -mt-2">Choose what you want to be notified about</p>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">General</p>
                        {[
                          { key: 'pushNotifications' as const, label: 'Push Notifications', desc: 'Receive push notifications on your devices' },
                          { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Get notified via email' },
                          { key: 'smsAlerts' as const, label: 'SMS Alerts', desc: 'Receive SMS for critical updates' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                            </div>
                            <button onClick={() => toggleNotification(item.key)}
                              className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', notifications[item.key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')}>
                              <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', notifications[item.key] ? 'translate-x-6' : 'translate-x-1')} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity</p>
                        {[
                          { key: 'issueUpdates' as const, label: 'Issue Updates', desc: 'Status changes on your reported issues' },
                          { key: 'communityActivity' as const, label: 'Community Activity', desc: 'New issues and votes in your area' },
                          { key: 'aiInsights' as const, label: 'AI Insights', desc: 'Smart analysis and recommendations' },
                          { key: 'emergencyAlerts' as const, label: 'Emergency Alerts', desc: 'Critical alerts in your vicinity' },
                          { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Summary of community progress each week' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                            </div>
                            <button onClick={() => toggleNotification(item.key)}
                              className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', notifications[item.key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')}>
                              <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', notifications[item.key] ? 'translate-x-6' : 'translate-x-1')} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Security Section */}
                  {activeSection === 'security' && (
                    <>
                      <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Security</h3>

                      {/* Password Change */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <LockClosedIcon className="w-4 h-4 text-slate-500" />
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Current Password</label>
                            <div className="relative">
                              <input
                                type={security.showCurrentPassword ? 'text' : 'password'}
                                value={security.currentPassword}
                                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                                className="input-field pr-10"
                                placeholder="Enter current password"
                              />
                              <button type="button" onClick={() => setSecurity({ ...security, showCurrentPassword: !security.showCurrentPassword })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {security.showCurrentPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">New Password</label>
                            <div className="relative">
                              <input
                                type={security.showNewPassword ? 'text' : 'password'}
                                value={security.newPassword}
                                onChange={(e) => {
                                  setSecurity({ ...security, newPassword: e.target.value });
                                  calculatePasswordStrength(e.target.value);
                                }}
                                className="input-field pr-10"
                                placeholder="Enter new password"
                              />
                              <button type="button" onClick={() => setSecurity({ ...security, showNewPassword: !security.showNewPassword })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {security.showNewPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                              </button>
                            </div>
                            {security.newPassword && (
                              <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= passwordStrength ? passwordStrengthColor : 'bg-slate-200 dark:bg-slate-700')} />
                                  ))}
                                </div>
                                <p className="text-[10px] font-medium text-slate-500">{passwordStrengthLabel}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Confirm Password</label>
                            <input
                              type="password"
                              value={security.confirmPassword}
                              onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                              className="input-field"
                              placeholder="Confirm new password"
                            />
                            {security.confirmPassword && security.newPassword !== security.confirmPassword && (
                              <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>
                            )}
                          </div>
                          <button className="btn-primary !py-2 !px-4 text-sm w-full sm:w-auto">
                            Update Password
                          </button>
                        </div>
                      </div>

                      {/* 2FA Toggle */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <ShieldExclamationIcon className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</p>
                            <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                          </div>
                        </div>
                        <button onClick={() => setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled })}
                          className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', security.twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700')}>
                          <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1')} />
                        </button>
                      </div>

                      {/* Active Sessions */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DevicePhoneMobileIcon className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Active Sessions</p>
                        </div>
                        <div className="space-y-2">
                          {activeSessions.map((session, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <div className="flex items-center gap-3">
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', session.current ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-200 dark:bg-slate-700')}>
                                  <DevicePhoneMobileIcon className={cn('w-4 h-4', session.current ? 'text-green-600' : 'text-slate-500')} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">{session.device}</p>
                                  <p className="text-xs text-slate-500">{session.location} · {session.time}</p>
                                </div>
                              </div>
                              {session.current ? (
                                <span className="text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">Current</span>
                              ) : (
                                <button className="text-xs text-red-500 hover:text-red-600 font-medium">Revoke</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Data & Privacy Section */}
                  {activeSection === 'privacy' && (
                    <>
                      <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Data & Privacy</h3>
                      <p className="text-sm text-slate-500 -mt-2">Manage your data and privacy preferences</p>

                      <div className="space-y-3">
                        {[
                          { key: 'showProfile' as const, label: 'Show Profile Publicly', desc: 'Allow others to see your profile and contribution history' },
                          { key: 'shareLocation' as const, label: 'Share Location Data', desc: 'Help improve issue detection with anonymous location data' },
                          { key: 'anonymousReporting' as const, label: 'Anonymous Reporting', desc: 'Hide your identity when reporting issues' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                            </div>
                            <button onClick={() => togglePrivacy(item.key)}
                              className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', privacy[item.key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')}>
                              <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', privacy[item.key] ? 'translate-x-6' : 'translate-x-1')} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Management</p>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                            <div className="text-left">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">Export My Data</p>
                              <p className="text-xs text-slate-500">Download a copy of all your data</p>
                            </div>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <TrashIcon className="w-5 h-5 text-red-500" />
                            <div className="text-left">
                              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete Account</p>
                              <p className="text-xs text-red-400">Permanently delete your account and all data</p>
                            </div>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Language Section */}
                  {activeSection === 'language' && (
                    <>
                      <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Language & Region</h3>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Language</label>
                        <select className="input-field" value={selectedLanguage} onChange={handleLanguageChange}>
                          {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Timezone</label>
                        <select className="input-field">
                          <option>Asia/Kolkata (IST)</option>
                          <option>Asia/Dubai (GST)</option>
                          <option>UTC</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* About Section */}
                  {activeSection === 'about' && (
                    <>
                      <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">About FixMyCity</h3>

                      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                          FX
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">FixMyCity</p>
                          <p className="text-xs text-slate-500">Version 2.4.1 (Build 241)</p>
                          <p className="text-xs text-slate-400">AI-Powered Civic Intelligence Platform</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <CommandLineIcon className="w-5 h-5 text-slate-500" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">What's New</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-5 h-5 text-slate-500" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Terms of Service</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <ShieldCheckIcon className="w-5 h-5 text-slate-500" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Privacy Policy</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <InformationCircleIcon className="w-5 h-5 text-slate-500" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Open Source Licenses</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 text-center">Made with care for smarter, cleaner cities.</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
