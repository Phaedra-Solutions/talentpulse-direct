'use client';

import React, { useEffect } from 'react';
import './globals.css';
import { ServerErrorView } from '@/components/ServerErrorView';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk');

    if (isChunkError && typeof window !== 'undefined') {
      const lastRetry = sessionStorage.getItem('tp_chunk_retry');
      const now = Date.now();
      if (!lastRetry || now - Number(lastRetry) > 8000) {
        sessionStorage.setItem('tp_chunk_retry', String(now));
        window.location.reload();
        return;
      }
    }

    console.error('Global Error Caught at Root Layout:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans" suppressHydrationWarning>
        <ServerErrorView error={error} reset={reset} showNavbar={false} />
      </body>
    </html>
  );
}
