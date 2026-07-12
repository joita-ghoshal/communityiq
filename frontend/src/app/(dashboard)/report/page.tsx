'use client';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import dynamic from 'next/dynamic';
import {
  ExclamationTriangleIcon, PhotoIcon, VideoCameraIcon, MicrophoneIcon,
  MapPinIcon, SparklesIcon, PaperAirplaneIcon, XMarkIcon,
  CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { pageThemes } from '@/lib/theme/page-themes';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getCategoryIcon } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

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

const DynamicLocationMap = dynamic<{ lat: number; lng: number }>(async () => {
  const { MapContainer, TileLayer, Marker } = await import('react-leaflet');
  const L = (await import('leaflet')).default;
  (await import('leaflet/dist/leaflet.css'));
  const component = ({ lat, lng }: { lat: number; lng: number }) => (
    <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ width: '100%', height: '100%', borderRadius: '12px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} icon={L.divIcon({ className: '', html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>', iconSize: [20, 20], iconAnchor: [10, 10] })} />
    </MapContainer>
  );
  return { default: component };
}, { ssr: false });

interface VerificationResult {
  passed: boolean;
  confidence?: number;
  message?: string;
}

export default function ReportIssuePage() {
  const theme = pageThemes.report;
  const router = useRouter();
  const { latitude, longitude } = useGeolocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'medium',
    address: '', city: '', state: '', pincode: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [geoDetecting, setGeoDetecting] = useState(false);
  const [geoDetected, setGeoDetected] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState(false);

  const [stepErrors, setStepErrors] = useState<string[]>([]);

  useEffect(() => {
    if (latitude && longitude && !geoDetected) {
      setCoords([latitude, longitude]);
    }
  }, [latitude, longitude, geoDetected]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles].slice(0, 5));
    setVerification(null);
    setVerificationError(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [], 'audio/*': [] },
    maxSize: 50 * 1024 * 1024,
    maxFiles: 5,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setVerification(null);
    setVerificationError(false);
  };

  useEffect(() => {
    if (files.length > 0 && !verification && !verifying) {
      const firstImage = files.find(f => f.type.startsWith('image/'));
      if (firstImage) {
        setVerifying(true);
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await api.post('/ai/verify-image', { imageBase64: base64 });
            const v = res.data?.data || res.data;
            setVerification({ passed: v?.verified !== false && v?.passed !== false, confidence: v?.confidence || 0, message: v?.analysis || '' });
          } catch {
            setVerificationError(true);
            setVerification({ passed: true, confidence: 0, message: 'AI verification unavailable' });
          } finally {
            setVerifying(false);
          }
        };
        reader.readAsDataURL(firstImage);
      } else {
        setVerification(null);
      }
    }
  }, [files, verifying, verification]);

  const validateStep = (s: number): boolean => {
    const errors: string[] = [];
    if (s === 1) {
      if (!form.title.trim()) errors.push('Title is required');
      if (!form.category) errors.push('Please select a category');
      if (!form.description.trim()) errors.push('Description is required');
      if (!form.priority) errors.push('Please select a priority');
    } else if (s === 2) {
      if (!form.address.trim()) errors.push('Address is required');
      if (!form.city.trim()) errors.push('City is required');
      if (!form.state.trim()) errors.push('State is required');
    } else if (s === 3) {
      if (files.length === 0) errors.push('Please upload at least one photo or video');
    }
    setStepErrors(errors);
    if (errors.length > 0) {
      toast.error(errors[0], { id: 'step-error' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => prev + 1);
  };

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      return;
    }
    setGeoDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords([lat, lng]);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          const addr = data.address || {};
          setForm(prev => ({
            ...prev,
            address: addr.road || addr.suburb || addr.display_name?.split(',')[0] || '',
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            pincode: addr.postcode || '',
          }));
          setGeoDetected(true);
          toast.success('Location detected!');
        } catch {
          toast.error('Could not reverse geocode, fill manually.');
        } finally {
          setGeoDetecting(false);
        }
      },
      () => { toast.error('GPS access denied. Check settings.'); setGeoDetecting(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('priority', form.priority);
      formData.append('address', form.address);
      formData.append('city', form.city);
      formData.append('state', form.state);
      formData.append('pincode', form.pincode);
      if (coords) {
        formData.append('latitude', coords[0].toString());
        formData.append('longitude', coords[1].toString());
      }
      files.forEach((f) => formData.append('media', f));
      await api.post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Issue reported successfully!');
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Details', 'Location', 'Media', 'Review'];

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center max-w-md shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2">Issue Reported!</h2>
          <p className="text-slate-500 mb-6">Your report has been submitted. Our AI is analyzing it now.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSubmitted(false); setForm({ title: '', description: '', category: '', priority: 'medium', address: '', city: '', state: '', pincode: '' }); setFiles([]); setStep(1); setVerification(null); setVerificationError(false); setCoords(null); setGeoDetected(false); }} className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
              Report Another
            </button>
            <button onClick={() => router.push('/')} className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
      >
        {/* Close Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-slate-500" />
        </button>

        {/* Header */}
        <div className={`${theme.gradient} rounded-t-3xl p-6 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading">Report an Issue</h1>
              <p className="text-white/80 text-sm">Help improve your community</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-1 sm:gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? `${theme.gradient} text-white shadow-lg` : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {step > i + 1 ? <CheckCircleIcon className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{label}</span>
                {i < 3 && <div className={`w-6 sm:w-8 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Issue Details */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Issue Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category *</label>
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description *</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail..." rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority *</label>
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
                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Location</h3>
                  {!coords && (
                    <button type="button" onClick={detectLocation} disabled={geoDetecting} className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <MapPinIcon className="w-5 h-5" />
                      {geoDetecting ? 'Detecting...' : 'Use Current Location'}
                    </button>
                  )}
                  {coords && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                      <MapPinIcon className="w-4 h-4" />
                      GPS detected: {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address *</label>
                    <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address or landmark" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">City *</label>
                      <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">State *</label>
                      <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                    </div>
                  </div>
                  {coords && (
                    <div className="w-full h-48 rounded-xl overflow-hidden">
                      <DynamicLocationMap lat={coords[0]} lng={coords[1]} />
                    </div>
                  )}
                  {!coords && (
                    <div className="w-full h-48 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <MapPinIcon className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Detect location to see map preview</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Media */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Evidence (Required)</h3>
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
                  {files.length > 0 && (
                    <div className="rounded-xl p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 space-y-2">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-blue-500" />
                        AI Media Verification
                      </p>
                      {verifying && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          AI Verifying...
                        </div>
                      )}
                      {!verifying && verification && (
                        <div className={`flex items-center gap-2 text-sm font-medium ${verification.passed ? 'text-green-600' : 'text-amber-600'}`}>
                          {verification.passed ? 'Verified' : 'Needs Review'}
                          {verification.confidence ? <span className="text-slate-400">({(verification.confidence * 100).toFixed(0)}% confidence)</span> : null}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Review & Submit</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Title', value: form.title },
                      { label: 'Category', value: `${getCategoryIcon(form.category)} ${categories.find(c => c.value === form.category)?.label}` },
                      { label: 'Priority', value: form.priority },
                      { label: 'Address', value: `${form.address}, ${form.city}` },
                      { label: 'Description', value: form.description },
                      { label: 'Files', value: `${files.length} file(s)` },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white text-right max-w-[60%]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">AI Analysis</p>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">After submission, our AI will classify, assess severity, detect duplicates, and recommend a department.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  <ArrowLeftIcon className="w-4 h-4" /> Back
                </button>
              ) : <div />}
              {step < 4 ? (
                <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium hover:shadow-lg transition-all">
                  Next <ArrowRightIcon className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50">
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><PaperAirplaneIcon className="w-4 h-4" /> Submit Report</>}
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
