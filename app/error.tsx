'use client';

import React, { useEffect } from 'react';
import { ServerErrorView } from '@/components/ServerErrorView';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Automatically recover from stale webpack chunks if dependencies or build hashes changed
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

    // Log unexpected runtime error to console for monitoring
    console.error('App Router Caught 500 Runtime Error:', error);
  }, [error]);

  return <ServerErrorView error={error} reset={reset} />;
}
