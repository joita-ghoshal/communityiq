'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-950 dark:to-red-950/20 p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2">Something went wrong</h1>
        <p className="text-slate-500 mb-6 text-sm">{error.message || 'An unexpected error occurred'}</p>
        <button onClick={reset} className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all">
          Try Again
        </button>
      </div>
    </div>
  );
}