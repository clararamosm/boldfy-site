'use client';

import { DashboardError } from '@/components/dashboard/dashboard-error';

export default function DashboardOverviewError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError scope="Visão Geral" {...props} />;
}
