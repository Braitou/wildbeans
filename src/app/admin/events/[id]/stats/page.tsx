import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import { StatsClient } from '@/components/admin/StatsClient';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Legend
} from 'recharts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Totals = {
  orders: number;
  drinks: number;
  unique_customers: number;
  period?: { from: string | null; to: string | null } | null;
};

type ItemRow = { item_id: string; item_name: string; qty: number };
type CatRow = { category_id: string; category_name: string; qty: number };
type OptRow = { option_name: string; qty: number };
type Point = { ts: string; drinks: number };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventStatsPage({ params }: PageProps) {
  noStore();
  const supabase = createClient();
  const { id: eventId } = await params;

  // Fetch data server-side
  const [totalsResult, itemsResult, catsResult, optsResult, tsResult] = await Promise.all([
    supabase.rpc('admin_event_totals', { event_id: eventId }),
    supabase.rpc('admin_event_items_breakdown', { event_id: eventId }),
    supabase.rpc('admin_event_categories_breakdown', { event_id: eventId }),
    supabase.rpc('admin_event_options_breakdown', { event_id: eventId }),
    supabase.rpc('admin_event_timeseries', { event_id: eventId }),
  ]);

  const totals = (totalsResult.data as Totals) ?? null;
  const items = (itemsResult.data as ItemRow[]) ?? [];
  const cats = (catsResult.data as CatRow[]) ?? [];
  const opts = ((optsResult.data as OptRow[]) ?? []).slice(0, 5);
  const ts = (tsResult.data as Point[]) ?? [];

  return (
    <AdminGate>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AdminHeader title="Wild Stats" />
        
        <StatsClient
          eventId={eventId}
          initialTotals={totals}
          initialItems={items}
          initialCats={cats}
          initialOpts={opts}
          initialTs={ts}
        />
      </main>
    </AdminGate>
  );
}
