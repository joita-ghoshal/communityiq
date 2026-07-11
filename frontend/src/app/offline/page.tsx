'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2">You&apos;re Offline</h1>
        <p className="text-slate-500 mb-6">Please check your internet connection and try again.</p>
        <button onClick={() => window.location.reload()} className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all">
          Retry
        </button>
      </div>
    </div>
  );
}
