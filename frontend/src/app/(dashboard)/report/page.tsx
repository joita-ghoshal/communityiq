'use client';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import dynamic from 'next/dynamic';
import {
  ExclamationTriangleIcon, PhotoIcon, VideoCameraIcon, MicrophoneIcon,
  MapPinIcon, SparklesIcon, PaperAirplaneIcon, XMarkIcon,
  CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import { pageThemes } from '@/lib/theme/page-themes';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getCategoryIcon } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const categories = [
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'garbage', label: 'Garbage/Waste' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'noise_pollution', label: 'Noise Pollution' },
  { value: 'public_safety', label: 'Public Safety' },
  { value: 'street_lighting', label: 'Street Lighting' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'air_pollution', label: 'Air Pollution' },
  { value: 'parks_green', label: 'Parks & Green Spaces' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'building_safety', label: 'Building Safety' },
  { value: 'flooding', label: 'Flooding' },
  { value: 'animal_control', label: 'Animal Control' },
  { value: 'other', label: 'Other' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' },
  { value: 'emergency', label: 'Emergency', color: 'bg-rose-600 text-white border-rose-700 animate-pulse dark:bg-rose-700 dark:border-rose-800' },
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
    address: '', city: '', state: '', pincode: '', ward: '', tags: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedIssueId, setSubmittedIssueId] = useState<string>('');

  const [geoDetecting, setGeoDetecting] = useState(false);
  const [geoDetected, setGeoDetected] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState(false);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);

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

  const validateStep = (s: number): string[] => {
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
    return errors;
  };

  const showValidationErrors = (errors: string[]) => {
    setValidationErrors(errors);
    setShowErrorModal(true);
  };

  const handleNext = () => {
    const errors = validateStep(step);
    if (errors.length > 0) {
      showValidationErrors(errors);
      return;
    }
    setStep(prev => prev + 1);
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
    const allErrors = [...validateStep(1), ...validateStep(2), ...validateStep(3)];
    if (allErrors.length > 0) {
      showValidationErrors(Array.from(new Set(allErrors)));
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        ward: form.ward,
      };
      if (form.tags) payload.tags = form.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      if (coords) {
        payload.latitude = coords[0];
        payload.longitude = coords[1];
      }
      const res = await api.post('/issues', payload);
      const issueId = res.data?.data?.id || res.data?.id || '';
      setSubmittedIssueId(issueId);
      toast.success('Issue reported successfully!');
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Details', 'Location', 'Media', 'Review'];

  const resetForm = () => {
    setSubmitted(false);
    setSubmittedIssueId('');
    setForm({ title: '', description: '', category: '', priority: 'medium', address: '', city: '', state: '', pincode: '', ward: '', tags: '' });
    setFiles([]);
    setStep(1);
    setVerification(null);
    setVerificationError(false);
    setCoords(null);
    setGeoDetected(false);
    setGeoDetecting(false);
    setSubmitting(false);
    setValidationErrors([]);
    setShowErrorModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card-strong w-full max-w-2xl max-h-[92vh] overflow-y-auto relative"
      >
        {/* Back Arrow */}
        <button
          onClick={() => step > 1 && !submitted ? setStep(step - 1) : router.back()}
          className="absolute top-4 left-4 z-10 p-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all border border-white/40 dark:border-slate-600/40"
        >
          <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Close Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all border border-white/40 dark:border-slate-600/40"
        >
          <XMarkIcon className="w-5 h-5 text-slate-500" />
        </button>

        {/* Header */}
        <div className={`${theme.gradient} rounded-t-2xl p-6 text-white relative overflow-hidden`}>
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
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step > i + 1
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                    : step === i + 1
                      ? `${theme.gradient} text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/40`
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {step > i + 1 ? <CheckCircleIcon className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block transition-colors ${
                  step === i + 1 ? 'text-slate-900 dark:text-white font-semibold' : step > i + 1 ? 'text-green-600 dark:text-green-400' : 'text-slate-400'
                }`}>{label}</span>
                {i < 3 && <div className={`w-6 sm:w-10 h-0.5 transition-all duration-300 ${step > i + 1 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
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
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category *</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {categories.map((cat) => (
                        <button key={cat.value} type="button" onClick={() => setForm({ ...form, category: cat.value })}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all duration-200 text-sm ${
                            form.category === cat.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm shadow-blue-500/10'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}>
                          <span className="text-lg block mb-0.5">{getCategoryIcon(cat.value)}</span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description *</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail..." rows={4} className="input-field resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority *</label>
                    <div className="flex gap-2 flex-wrap">
                      {priorities.map((p) => (
                        <button key={p.value} type="button" onClick={() => setForm({ ...form, priority: p.value })}
                          className={`flex-1 min-w-[60px] py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                            form.priority === p.value
                              ? p.color + ' shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                          }`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tags</label>
                    <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. pothole, main-street, recurring" className="input-field" />
                    <p className="text-xs text-slate-400 mt-1">Separate tags with commas</p>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Location</h3>
                  {!coords ? (
                    <button type="button" onClick={detectLocation} disabled={geoDetecting}
                      className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <MapPinIcon className="w-5 h-5" />
                      {geoDetecting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          Detecting location...
                        </span>
                      ) : 'Auto-Detect Location (GPS)'}
                    </button>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                      <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                      GPS detected: {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address *</label>
                    <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address or landmark" className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">City *</label>
                      <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">State *</label>
                      <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ward</label>
                      <input type="text" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} placeholder="Ward number/name" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Pincode</label>
                      <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" className="input-field" />
                    </div>
                  </div>
                  {coords ? (
                    <div className="w-full h-48 rounded-xl overflow-hidden glass-card">
                      <DynamicLocationMap lat={coords[0]} lng={coords[1]} />
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 glass-card">
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
                  <div {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}>
                    <input {...getInputProps()} />
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <PhotoIcon className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <VideoCameraIcon className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <MicrophoneIcon className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {isDragActive ? 'Drop files here...' : 'Drag & drop files, or click to browse'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Images, videos, audio up to 50MB. Max 5 files.</p>
                  </div>
                  {files.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {files.map((file, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden glass-card p-3 group">
                          <button type="button" onClick={() => removeFile(i)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                          {file.type.startsWith('image/') && (
                            <div className="w-full h-20 rounded-lg bg-slate-200 dark:bg-slate-700 mb-2 overflow-hidden">
                              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          {file.type.startsWith('video/') && (
                            <div className="w-full h-20 rounded-lg bg-slate-200 dark:bg-slate-700 mb-2 flex items-center justify-center">
                              <VideoCameraIcon className="w-8 h-8 text-purple-400" />
                            </div>
                          )}
                          {file.type.startsWith('audio/') && (
                            <div className="w-full h-20 rounded-lg bg-slate-200 dark:bg-slate-700 mb-2 flex items-center justify-center">
                              <MicrophoneIcon className="w-8 h-8 text-green-400" />
                            </div>
                          )}
                          <p className="text-xs text-slate-700 dark:text-slate-300 truncate pr-4">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {files.length > 0 && (
                    <div className="rounded-xl p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 space-y-2 glass-card">
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
                        <div className="space-y-2">
                          <div className={`flex items-center gap-2 text-sm font-medium ${verification.passed ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {verification.passed ? <CheckCircleIcon className="w-4 h-4" /> : <ExclamationTriangleIcon className="w-4 h-4" />}
                            {verification.passed ? 'Verified Authentic' : 'Needs Review'}
                            {verification.confidence ? <span className="text-slate-400 font-normal">({(verification.confidence * 100).toFixed(0)}% confidence)</span> : null}
                          </div>
                          {verification.message && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{verification.message}</p>
                          )}
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

                  {/* Details Section */}
                  <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Details</h4>
                      <button type="button" onClick={() => setStep(1)} className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
                        <PencilIconInline /> Edit
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500">Title</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white text-right max-w-[60%]">{form.title}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500">Category</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white text-right">{getCategoryIcon(form.category)} {categories.find(c => c.value === form.category)?.label}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500">Priority</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{form.priority}</span>
                      </div>
                      {form.tags && (
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                          <span className="text-xs text-slate-500">Tags</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white text-right max-w-[60%]">{form.tags}</span>
                        </div>
                      )}
                      <div className="py-1.5">
                        <span className="text-xs text-slate-500 block mb-1">Description</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{form.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Location</h4>
                      <button type="button" onClick={() => setStep(2)} className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
                        <PencilIconInline /> Edit
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500">Address</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white text-right max-w-[60%]">{form.address}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500">City / State</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{form.city}, {form.state}</span>
                      </div>
                      {form.ward && (
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                          <span className="text-xs text-slate-500">Ward</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{form.ward}</span>
                        </div>
                      )}
                      {form.pincode && (
                        <div className="flex justify-between py-1.5">
                          <span className="text-xs text-slate-500">Pincode</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{form.pincode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media Section */}
                  <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Media</h4>
                      <button type="button" onClick={() => setStep(3)} className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
                        <PencilIconInline /> Edit
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <PhotoIcon className="w-5 h-5 text-slate-400" />
                      <span>{files.length} file(s) attached</span>
                    </div>
                    {verification && (
                      <div className={`flex items-center gap-2 text-xs font-medium ${verification.passed ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        <SparklesIcon className="w-3.5 h-3.5" />
                        AI Verification: {verification.passed ? 'Passed' : 'Needs Review'}
                      </div>
                    )}
                  </div>

                  {/* AI Info */}
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

      {/* Loading Overlay */}
      <AnimatePresence>
        {submitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card-strong p-8 flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-3 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Submitting your report...</p>
              <p className="text-xs text-slate-500">Our AI is analyzing your submission</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
            onClick={() => setShowErrorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card-strong p-8 text-center max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <ExclamationTriangleIcon className="w-9 h-9 text-red-500" />
              </div>
              <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-3">Missing Information</h2>
              <div className="space-y-1.5 mb-6">
                {validationErrors.map((err, i) => (
                  <p key={i} className="text-sm font-semibold text-red-600 dark:text-red-400">{err}</p>
                ))}
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:shadow-lg transition-all"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card-strong p-10 text-center max-w-md w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-11 h-11 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2">Issue Reported!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-2">Your report has been submitted successfully.</p>
              {submittedIssueId && (
                <p className="text-sm font-mono text-slate-400 dark:text-slate-500 mb-1">Issue ID: <span className="font-bold text-slate-600 dark:text-slate-300">{submittedIssueId}</span></p>
              )}
              <p className="text-xs text-slate-400 mb-8">Our AI is analyzing it now.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all"
                >
                  Report Another
                </button>
                <button
                  onClick={() => router.push('/map')}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <MapPinIcon className="w-4 h-4" />
                  View on Map
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PencilIconInline() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}
