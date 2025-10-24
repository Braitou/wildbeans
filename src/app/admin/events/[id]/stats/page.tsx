'use client';

import { use } from 'react';
import AdminGate from '@/components/auth/AdminGate';
import { StatsClient } from '@/components/admin/StatsClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventStatsPage({ params }: PageProps) {
  const { id: eventId } = use(params);

  return (
    <AdminGate>
      <main className="min-h-screen bg-[#f5f5f0] px-4 py-8">
        <StatsClient eventId={eventId} />
      </main>
    </AdminGate>
  );
}
