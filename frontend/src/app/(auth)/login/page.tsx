'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BoltIcon, EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30 p-4">
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl mb-4">
            <BoltIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to CommunityIQ</p>
        </div>

        {/* Form Card */}
        <div className="glass-card-strong p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="input-field !pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="???????" className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all rounded-xl pl-10 pr-10 py-2.5 outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">Create Account</Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 glass-card-strong p-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            Demo Credentials
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-1.5">
              <span className="text-slate-600 dark:text-slate-300">Super Admin</span>
              <button type="button" onClick={() => { setEmail('superadmin@test.com'); setPassword('Test@1234'); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer">superadmin@test.com</button>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-1.5">
              <span className="text-slate-600 dark:text-slate-300">Municipal Admin</span>
              <button type="button" onClick={() => { setEmail('municipal@test.com'); setPassword('Test@1234'); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer">municipal@test.com</button>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-1.5">
              <span className="text-slate-600 dark:text-slate-300">Dept Admin</span>
              <button type="button" onClick={() => { setEmail('deptadmin@test.com'); setPassword('Test@1234'); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer">deptadmin@test.com</button>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-1.5">
              <span className="text-slate-600 dark:text-slate-300">Volunteer</span>
              <button type="button" onClick={() => { setEmail('volunteer@test.com'); setPassword('Test@1234'); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer">volunteer@test.com</button>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-1.5">
              <span className="text-slate-600 dark:text-slate-300">Citizen</span>
              <button type="button" onClick={() => { setEmail('citizen@test.com'); setPassword('Test@1234'); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer">citizen@test.com</button>
            </div>
            <div className="text-center text-slate-400 pt-1">Password for all: <span className="text-slate-500 font-semibold">Test@1234</span></div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          AI-Powered Civic Intelligence Platform
        </p>
      </motion.div>
    </div>
  );
}
