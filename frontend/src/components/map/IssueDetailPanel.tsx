'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon, MapPinIcon, ArrowRightIcon, ShareIcon, SparklesIcon,
  CheckBadgeIcon, ExclamationTriangleIcon, BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { MapIssue } from './MapView';
import api from '@/lib/api';
import {
  categoryLabel, categoryEmoji, categoryColor, statusLabel, priorityLabel,
  formatDistance, formatRelativeTime,
} from '@/lib/map-data';

interface IssueDetailPanelProps {
  issue: MapIssue;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] text-slate-400 shrink-0">{label}</span>
      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 text-right">{children}</span>
    </div>
  );
}

export default function IssueDetailPanel({ issue, onClose }: IssueDetailPanelProps) {
  const [similar, setSimilar] = useState<{ id: string; title: string; distanceMeters: number }[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/gis/nearby-similar', { params: { issueId: issue.id, radiusKm: 2 } })
      .then(({ data }) => {
        if (!cancelled) {
          const list = data?.data?.similar || data?.similar || [];
          setSimilar(list.filter((s: any) => s.id !== issue.id).slice(0, 5));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [issue.id]);

  const openDirections = () => {
    const q = `${issue.lat},${issue.lng}`;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
  };

  const shareIssue = async () => {
    const url = `${window.location.origin}/issues/${issue.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: issue.title, text: issue.description, url });
        return;
      }
    } catch { /* dismissed */ }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no clipboard */ }
  };

  const prioColor =
    issue.priority === 'emergency' || issue.priority === 'critical'
      ? 'bg-red-600 text-white'
      : issue.priority === 'high'
        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
        : issue.priority === 'medium'
          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';

  const aiVerified = issue.verification?.aiVerified;
  const aiConfidence = issue.verification?.aiConfidence;

  return (
    <motion.div
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 24, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className="absolute top-2 right-2 bottom-2 z-[1150] w-[340px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: `${categoryColor(issue.category)}22` }}
              >
                {categoryEmoji(issue.category)}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">{issue.title}</h3>
            </div>
            {issue.address && (
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 truncate">
                <MapPinIcon className="w-3 h-3 flex-shrink-0" /> {issue.address}
                {issue.ward && <span className="text-slate-400">· {issue.ward}</span>}
              </p>
            )}
          </div>
          <button onClick={onClose} className="ml-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {categoryLabel(issue.category)}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${prioColor} uppercase`}>
            {priorityLabel(issue.priority)}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {statusLabel(issue.status)}
          </span>
          {issue.isUrgent && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse">
              URGENT
            </span>
          )}
        </div>

        {/* AI verification */}
        {aiVerified != null && (
          <div className={`rounded-lg p-3 border ${aiVerified ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
            <div className="flex items-center gap-2">
              {aiVerified ? (
                <CheckBadgeIcon className="w-4 h-4 text-emerald-500" />
              ) : (
                <SparklesIcon className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Verification</span>
            </div>
            <p className={`text-xs font-semibold mt-1 ${aiVerified ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {aiVerified ? 'Confirmed by AI analysis' : 'Not yet AI-verified'}
            </p>
            {aiConfidence != null && (
              <p className="text-[10px] text-slate-500 mt-0.5">Confidence: {Math.round(aiConfidence * 100)}%</p>
            )}
            {issue.aiAnalysis?.duplicateProbability != null && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Duplicate probability: {Math.round(issue.aiAnalysis.duplicateProbability * 100)}%
              </p>
            )}
            {issue.aiAnalysis?.severity && (
              <p className="text-[10px] text-slate-500 mt-0.5">AI severity: {issue.aiAnalysis.severity}</p>
            )}
            {issue.aiAnalysis?.summary && (
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{issue.aiAnalysis.summary}</p>
            )}
          </div>
        )}

        {/* Description */}
        {issue.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{issue.description}</p>
        )}

        {/* Risk score */}
        {(issue.riskScore ?? 0) > 0 && (
          <div className={`rounded-lg p-3 ${(issue.riskScore ?? 0) > 70 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Risk Score</span>
            </div>
            <p className={`text-lg font-bold mt-1 ${(issue.riskScore ?? 0) > 70 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
              {issue.riskScore}
              <span className="text-[10px] font-normal text-slate-400 ml-1">/ 100</span>
            </p>
            {(issue.riskScore ?? 0) > 70 && (
              <p className="text-[10px] text-red-500 mt-0.5">High risk — requires immediate attention</p>
            )}
          </div>
        )}

        {/* Progress */}
        {(issue.completionPercentage ?? 0) > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Progress</span>
              <span className="text-[10px] font-semibold text-emerald-600">{issue.completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, issue.completionPercentage ?? 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2">
          <Row label="Department">
            <span className="inline-flex items-center gap-1">
              <BuildingOfficeIcon className="w-3 h-3" />
              {issue.department?.name || 'Unassigned'}
            </span>
          </Row>
          <Row label="Reported by">{issue.reporter?.name || 'Anonymous'}</Row>
          <Row label="Created">{formatRelativeTime(issue.createdAt)}</Row>
          <Row label="Distance">{formatDistance(issue.distanceKm)}</Row>
          <Row label="Coordinates">
            {issue.lat != null && issue.lng != null
              ? `${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)}`
              : '—'}
          </Row>
          {issue.pincode && <Row label="PIN code">{issue.pincode}</Row>}
          {issue.verification?.citizenConfirmed != null && (
            <Row label="Citizen confirmed">{issue.verification.citizenConfirmed ? 'Yes ✓' : 'No'}</Row>
          )}
          <Row label="Community">
            <span className="inline-flex items-center gap-1">
              <span>👍 {issue.upvotes}</span>
              <span>👎 {issue.downvotes}</span>
              {issue.communityScore != null && <span>· {issue.communityScore}/100</span>}
            </span>
          </Row>
        </div>

        {/* Similar issues */}
        {similar && similar.length > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1.5 flex items-center gap-1">
              <ExclamationTriangleIcon className="w-3 h-3" /> Similar issues nearby
            </p>
            {similar.map((s) => (
              <div key={s.id} className="text-[10px] text-slate-600 dark:text-slate-300 py-0.5 truncate">
                {s.title} · {s.distanceMeters}m
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2">
        <button
          onClick={openDirections}
          className="flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30 transition"
        >
          <ArrowRightIcon className="w-4 h-4" />
          Directions
        </button>
        <button
          onClick={shareIssue}
          className="flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700 transition"
        >
          <ShareIcon className="w-4 h-4" />
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button
          onClick={() => { window.location.href = `/issues/${issue.id}`; }}
          className="flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
        >
          <span className="text-sm leading-none">↗</span>
          Full page
        </button>
      </div>
    </motion.div>
  );
}
