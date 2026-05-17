'use client';

import { DashboardError } from '@/components/dashboard/dashboard-error';

export default function AquisicaoError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError scope="Aquisição" {...props} />;
}
