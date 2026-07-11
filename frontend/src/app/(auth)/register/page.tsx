'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BoltIcon, EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

const roles = [
  { value: 'citizen', label: 'Citizen', desc: 'Report and track civic issues' },
  { value: 'volunteer', label: 'Volunteer', desc: 'Help verify and resolve issues' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'citizen' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone, role: form.role });
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl mb-4">
            <BoltIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Create Account</h1>
          <p className="text-slate-500 mt-1">Join CommunityIQ today</p>
        </div>

        <div className="glass-card-strong p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button key={r.value} type="button" onClick={() => update('role', r.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${form.role === r.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="John" required className="w-full border border-slate-300 bg-white disabled:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all rounded-xl outline-none disabled:opacity-50 pl-9 py-2.5 text-sm" />
                  </div>
                  </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Doe" required className="w-full border border-slate-300 bg-white disabled:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all rounded-xl outline-none disabled:opacity-50 py-2.5 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" required className="w-full border border-slate-300 bg-white disabled:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all rounded-xl outline-none disabled:opacity-50 pl-9 py-2.5 text-sm" />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone (optional)</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" className="w-full border border-slate-300 bg-white disabled:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all rounded-xl outline-none disabled:opacity-50 pl-9 py-2.5 text-sm" />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Min 8 characters" required minLength={8} className="w-full border border-slate-300 bg-white disabled:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all rounded-xl outline-none disabled:opacity-50 pl-9 pr-10 py-2.5 text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Repeat password" required className="w-full border border-slate-300 bg-white disabled:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all rounded-xl outline-none disabled:opacity-50 pl-9 py-2.5 text-sm" />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span>I agree to the <Link href="#" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link></span>
            </label>

            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center transition-all bg-[length:100%] bg-[position:0%] hover:bg-[length:120%]">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Sign In</Link></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
