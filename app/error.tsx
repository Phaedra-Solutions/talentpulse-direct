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
    // Log unexpected runtime error to console for monitoring
    console.error('App Router Caught 500 Runtime Error:', error);
  }, [error]);

  return <ServerErrorView error={error} reset={reset} />;
}
