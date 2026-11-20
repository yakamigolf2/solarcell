'use client';
import { useEffect } from 'react';
import { reportError } from '@/lib/report-error';

/** Mounted once in the root layout: forwards uncaught errors and promise rejections to the error log. */
export default function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError(e.error || e.message, 'window');
    const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason, 'promise');
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection); };
  }, []);
  return null;
}
