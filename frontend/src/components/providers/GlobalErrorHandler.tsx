'use client';
import { useEffect } from 'react';

export default function GlobalErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[GlobalError]', event.error?.message || event.message, event.filename, event.lineno);
      event.preventDefault();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('[UnhandledRejection]', event.reason?.message || event.reason);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
