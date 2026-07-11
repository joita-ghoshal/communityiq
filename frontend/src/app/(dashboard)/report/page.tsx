'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  ExclamationTriangleIcon, PhotoIcon, VideoCameraIcon, MicrophoneIcon,
  MapPinIcon, SparklesIcon, PaperAirplaneIcon, XMarkIcon,
  CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getCategoryIcon } from '@/lib/utils';
import toast from 'react-hot-toast';

const categories = [
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'water_leakage', label: 'Water Leakage' },
  { value: 'garbage', label: 'Garbage/Waste' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'noise', label: 'Noise Pollution' },
  { value: 'public_safety', label: 'Public Safety' },
  { value: 'street_lighting', label: 'Street Lighting' },
  { value: 'encroachment', label: 'Encroachment' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'other', label: 'Other' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-300' },
];

export default function ReportIssuePage() {
  const theme = pageThemes.report;
  const { latitude, longitude } = useGeolocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'medium',
    address: '', city: '', state: '', pincode: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [], 'audio/*': [] },
    maxSize: 50 * 1024 * 1024,
    maxFiles: 5,
  });

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSubmitting(false);
    setSubmitted(true);
    toast.success('Issue reported successfully!');
  };

  if (submitted) {
    return (
      <AppShell>
        <div className={`${theme.bg} ${theme.darkBg} min-h-full flex items-center justify-center p-4`}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card-strong p-12 text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2">Issue Reported!</h2>
            <p className="text-slate-500 mb-6">Your report has been submitted. Our AI is analyzing it now. You&apos;ll be notified when the status changes.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setSubmitted(false); setForm({ title: '', description: '', category: '', priority: 'medium', address: '', city: '', state: '', pincode: '' }); setFiles([]); setStep(1); }} className="btn-primary bg-gradient-to-r from-green-600 to-emerald-600">Report Another</button>
              <button onClick={() => window.location.href = '/dashboard'} className="btn-secondary border-slate-300 text-slate-700">Go to Dashboard</button>
            </div>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={`${theme.bg} ${theme.darkBg} min-h-full`}>
        <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className={`${theme.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <ExclamationTriangleIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-heading">Report an Issue</h1>
                  <p className="text-white/80 text-sm">Help improve your community by reporting civic issues</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['Details', 'Location', 'Media', 'Review'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? `${theme.gradient} text-white shadow-lg` : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                  {step > i + 1 ? <CheckCircleIcon className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{s}</span>
                {i < 3 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Details */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card-strong p-6 space-y-5">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Issue Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {categories.map((cat) => (
                        <button key={cat.value} type="button" onClick={() => setForm({ ...form, category: cat.value })}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all text-sm ${form.category === cat.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                          <span className="text-lg block mb-0.5">{getCategoryIcon(cat.value)}</span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail..." rows={4} required className="input-field resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
                    <div className="flex gap-2">
                      {priorities.map((p) => (
                        <button key={p.value} type="button" onClick={() => setForm({ ...form, priority: p.value })}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${form.priority === p.value ? p.color + ' shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card-strong p-6 space-y-5">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Location</h3>
                  {latitude && longitude && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                      <MapPinIcon className="w-4 h-4" />
                      GPS detected: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                    <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address or landmark" required className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">City</label>
                      <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" required className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">State</label>
                      <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" required className="input-field" />
                    </div>
                  </div>
                  <div className="w-full h-48 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <MapPinIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm">Interactive Map Coming Soon</p>
                      <p className="text-xs text-slate-400">Click to select location on map</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Media */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card-strong p-6 space-y-5">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Evidence (Optional)</h3>
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'}`}>
                    <input {...getInputProps()} />
                    <div className="flex justify-center gap-4 mb-4">
                      <PhotoIcon className="w-8 h-8 text-blue-500" />
                      <VideoCameraIcon className="w-8 h-8 text-purple-500" />
                      <MicrophoneIcon className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {isDragActive ? 'Drop files here...' : 'Drag & drop files, or click to browse'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Images, videos, audio up to 50MB. Max 5 files.</p>
                  </div>
                  {files.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {files.map((file, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 p-3">
                          <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white z-10">
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                          <p className="text-xs text-slate-700 dark:text-slate-300 truncate pr-4">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card-strong p-6 space-y-5">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Review & Submit</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-sm text-slate-500">Title</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{form.title}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-sm text-slate-500">Category</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{getCategoryIcon(form.category)} {categories.find(c => c.value === form.category)?.label}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-sm text-slate-500">Priority</span>
                      <span className="text-sm font-medium capitalize">{form.priority}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-sm text-slate-500">Address</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white text-right">{form.address}, {form.city}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-sm text-slate-500">Description</span>
                      <span className="text-sm text-slate-900 dark:text-white text-right max-w-xs">{form.description}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-slate-500">Files</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{files.length} file(s)</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">AI Analysis</p>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">After submission, our AI will analyze your report for classification, severity assessment, duplicate detection, and department recommendation.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                  <ArrowLeftIcon className="w-4 h-4" /> Back
                </button>
              ) : <div />}
              {step < 4 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="btn-primary bg-gradient-to-r from-green-600 to-emerald-600">
                  Next <ArrowRightIcon className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="btn-primary bg-gradient-to-r from-green-600 to-emerald-600">
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><PaperAirplaneIcon className="w-4 h-4" /> Submit Report</>}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
