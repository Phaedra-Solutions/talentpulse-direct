'use client';

import React from 'react';
import { ServerErrorView } from '@/components/ServerErrorView';

export default function Error500PreviewPage() {
  const simulatedError = new Error(
    'Database connection pool exhausted: Failed to query candidates table due to upstream PostgreSQL gateway latency.'
  );
  simulatedError.name = 'PostgresConnectionTimeout';
  (simulatedError as unknown as { digest: string }).digest = 'ERR_TALENTPULSE_500_RUNTIME';

  return <ServerErrorView error={simulatedError} />;
}
