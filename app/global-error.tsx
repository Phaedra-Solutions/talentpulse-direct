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
