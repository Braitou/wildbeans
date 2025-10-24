'use client';

import AdminGate from '@/components/auth/AdminGate';
import GlobalStatsClient from '@/components/admin/GlobalStatsClient';

export default function GlobalStatsPage() {
  return (
    <AdminGate>
      <GlobalStatsClient />
    </AdminGate>
  );
}

