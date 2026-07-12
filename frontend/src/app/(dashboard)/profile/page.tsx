'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon, EnvelopeIcon, PhoneIcon, CalendarDaysIcon,
  PencilSquareIcon, CameraIcon, CheckBadgeIcon, ShieldCheckIcon,
  MapPinIcon, TrophyIcon, StarIcon, KeyIcon, ChevronDownIcon,
  ChevronUpIcon, CheckCircleIcon, ExclamationCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const theme = pageThemes.profile;
  const { user, isLoading } = useAuthStore();
  const { logout } = useAuthStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const handleSendOtp = async () => {
    if (!otpEmail) {
      toast.error('Please enter your email');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/auth/send-otp', { email: otpEmail });
      toast.success('OTP sent to your email');
      setPasswordStep(2);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      toast.error('Please enter the OTP');
      return;
    }
    setPasswordLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: otpEmail, otp: otpCode });
      setOtpToken(data.data?.token || data.token || '');
      toast.success('OTP verified');
      setPasswordStep(3);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/auth/verify-otp-reset', {
        email: otpEmail,
        token: otpToken,
        otp: otpCode,
        newPassword,
      });
      toast.success('Password updated successfully');
      setShowPasswordChange(false);
      setPasswordStep(1);
      setOtpEmail('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Unable to load profile.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full`}>
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Profile Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-strong overflow-hidden">
            <div className={`${theme.gradient} h-32 md:h-40 relative`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
            </div>
            <div className="px-6 pb-6 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-slate-900 shadow-xl">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <CameraIcon className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </h1>
                    {user.isVerified && <CheckBadgeIcon className="w-5 h-5 text-blue-500" />}
                  </div>
                  <p className="text-sm text-slate-500 capitalize">{user.role?.replace(/_/g, ' ')}</p>
                </div>
                <button onClick={() => setEditing(!editing)} className="btn-primary bg-gradient-to-r from-teal-600 to-cyan-600 !py-2 !px-4 text-sm">
                  <PencilSquareIcon className="w-4 h-4" /> {editing ? 'Save' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Personal Information</h3>
              <div className="space-y-4">
                {[
                  { icon: EnvelopeIcon, label: 'Email', value: user.email || '-' },
                  { icon: PhoneIcon, label: 'Phone', value: user.phone || '-' },
                  { icon: MapPinIcon, label: 'Location', value: 'New Delhi, India' },
                  { icon: CalendarDaysIcon, label: 'Joined', value: 'January 2024' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <item.icon className="w-5 h-5 text-teal-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Change Password Section */}
              <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                <button
                  onClick={() => { setShowPasswordChange(!showPasswordChange); setPasswordStep(1); }}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <KeyIcon className="w-5 h-5 text-teal-500" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</span>
                  </div>
                  {showPasswordChange ? (
                    <ChevronUpIcon className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {showPasswordChange && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-4">
                        {/* Step indicators */}
                        <div className="flex items-center gap-2 mb-4">
                          {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                passwordStep >= step
                                  ? 'bg-teal-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                              }`}>
                                {passwordStep > step ? <CheckCircleIcon className="w-4 h-4" /> : step}
                              </div>
                              {step < 3 && <div className={`w-8 h-0.5 ${passwordStep > step ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                            </div>
                          ))}
                        </div>

                        {passwordStep === 1 && (
                          <>
                            <input
                              type="email"
                              placeholder="Enter your email"
                              value={otpEmail}
                              onChange={(e) => setOtpEmail(e.target.value)}
                              className="input-field"
                            />
                            <button
                              onClick={handleSendOtp}
                              disabled={passwordLoading}
                              className="btn-primary w-full bg-gradient-to-r from-teal-600 to-cyan-600"
                            >
                              {passwordLoading ? 'Sending...' : 'Send OTP'}
                            </button>
                          </>
                        )}

                        {passwordStep === 2 && (
                          <>
                            <p className="text-xs text-slate-500">OTP sent to <strong>{otpEmail}</strong></p>
                            <input
                              type="text"
                              placeholder="Enter 6-digit OTP"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              className="input-field"
                              maxLength={6}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setPasswordStep(1)} className="btn-secondary flex-1">
                                Back
                              </button>
                              <button
                                onClick={handleVerifyOtp}
                                disabled={passwordLoading}
                                className="btn-primary flex-1 bg-gradient-to-r from-teal-600 to-cyan-600"
                              >
                                {passwordLoading ? 'Verifying...' : 'Verify OTP'}
                              </button>
                            </div>
                          </>
                        )}

                        {passwordStep === 3 && (
                          <>
                            <div>
                              <input
                                type="password"
                                placeholder="New password (min 8 characters)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input-field"
                              />
                              {newPassword.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                                        i <= getPasswordStrength(newPassword).score
                                          ? getPasswordStrength(newPassword).color
                                          : 'bg-slate-200 dark:bg-slate-700'
                                      }`} />
                                    ))}
                                  </div>
                                  <p className={`text-xs font-medium ${
                                    getPasswordStrength(newPassword).score <= 2 ? 'text-red-500' :
                                    getPasswordStrength(newPassword).score <= 4 ? 'text-yellow-500' : 'text-green-500'
                                  }`}>
                                    {getPasswordStrength(newPassword).label} password
                                  </p>
                                </div>
                              )}
                            </div>
                            <input
                              type="password"
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="input-field"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setPasswordStep(2)} className="btn-secondary flex-1">
                                Back
                              </button>
                              <button
                                onClick={handleResetPassword}
                                disabled={passwordLoading}
                                className="btn-primary flex-1 bg-gradient-to-r from-teal-600 to-cyan-600"
                              >
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Logout */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => { logout(); router.push('/login'); }}
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                >
                  <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
              {/* Stats */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">Contributions</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Reports', value: '24', icon: '📝' },
                    { label: 'Verified', value: '18', icon: '✅' },
                    { label: 'Points', value: '1,240', icon: '⭐' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-2xl">{stat.icon}</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                      <p className="text-[10px] text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-amber-500" /> Recent Badges
                </h3>
                <div className="flex gap-3">
                  {['📝', '✅', '🌙'].map((badge, i) => (
                    <div key={i} className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer">{badge}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
