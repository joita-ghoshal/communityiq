'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30 p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">404</div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2">Page Not Found</h1>
        <p className="text-slate-500 mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-lg transition-all">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
