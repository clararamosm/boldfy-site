'use client';

import { DashboardError } from '@/components/dashboard/dashboard-error';

export default function ConversaoError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError scope="Conversão" {...props} />;
}
