import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import { StatsClient } from '@/components/admin/StatsClient';

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

  // A) Orders list (lightweight fields)
  const { data: orders, error: e1 } = await supabase
    .from('orders')
    .select('id, created_at, customer_name, pickup_code')
    .eq('event_id', eventId);
  if (e1) { console.error('orders error', e1); }

  // B) Drinks per hour (avoid BigInt: cast in SQL to integer)
  const { data: perHourRaw, error: e2 } = await supabase
    .from('orders')
    .select(`
      created_at,
      order_items ( qty )
    `)
    .eq('event_id', eventId);
  if (e2) { console.error('perHour error', e2); }
  
  // Aggregate in JS and ensure plain numbers:
  const perHourMap = new Map<string, number>();
  for (const o of perHourRaw ?? []) {
    const hour = new Date(o.created_at);
    hour.setMinutes(0,0,0);
    const key = hour.toISOString();
    const count = (o.order_items ?? []).reduce((a: number, it: { qty: number }) => a + Number(it?.qty ?? 0), 0);
    perHourMap.set(key, (perHourMap.get(key) ?? 0) + count);
  }
  const perHour = Array.from(perHourMap.entries())
    .map(([hourIso, drinks]) => ({ hour: hourIso, drinks: Number(drinks) }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  // C) Top drinks (cast to numeric via JS Numbers)
  const { data: topRows, error: e3 } = await supabase
    .from('order_items')
    .select('item_name, qty, order_id')
    .in('order_id',
      (orders ?? []).map(o => o.id)
    );
  if (e3) { console.error('topDrinks error', e3); }
  
  const topMap = new Map<string, number>();
  for (const r of topRows ?? []) {
    topMap.set(r.item_name, (topMap.get(r.item_name) ?? 0) + Number(r.qty ?? 0));
  }
  const topDrinks = Array.from(topMap.entries())
    .map(([item_name, qty]) => ({ item_name, qty: Number(qty) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // D) KPIs (orders_count, drinks_count, unique_customers, period)
  const ordersCount = (orders ?? []).length;
  const drinksCount = (topRows ?? []).reduce((a, r) => a + Number(r.qty ?? 0), 0);
  const uniqueCustomers = new Set(
    (orders ?? []).map(o => (o.customer_name ?? o.pickup_code ?? ''))
  ).size;
  const orderTimes = (orders ?? []).map(o => o.created_at).filter(Boolean);
  const periodStart = orderTimes.length > 0 
    ? new Date(Math.min(...orderTimes.map(time => new Date(time).getTime()))).toISOString()
    : null;
  const periodEnd = orderTimes.length > 0
    ? new Date(Math.max(...orderTimes.map(time => new Date(time).getTime()))).toISOString()
    : null;

  // Ensure everything is serializable (no BigInt/Map/Date objects):
  const stats = {
    kpis: {
      orders_count: ordersCount,
      drinks_count: drinksCount,
      unique_customers: uniqueCustomers,
      period_start: periodStart,
      period_end: periodEnd,
    },
    perHour,
    topDrinks,
  };

  // Convert to the expected format for existing components
  const totals: Totals = {
    orders: stats.kpis.orders_count,
    drinks: stats.kpis.drinks_count,
    unique_customers: stats.kpis.unique_customers,
    period: {
      from: stats.kpis.period_start,
      to: stats.kpis.period_end,
    }
  };

  const items: ItemRow[] = stats.topDrinks.map((item, index) => ({
    item_id: `item_${index}`,
    item_name: item.item_name,
    qty: item.qty,
  }));

  // E) Get categories and options data using RPC functions
  const { data: catsRaw, error: e4 } = await supabase.rpc('admin_event_categories_breakdown', { event_id: eventId });
  if (e4) { console.error('categories error', e4); }
  
  const { data: optsRaw, error: e5 } = await supabase.rpc('admin_event_options_breakdown', { event_id: eventId });
  if (e5) { console.error('options error', e5); }

  const cats: CatRow[] = (catsRaw ?? []).map((cat: any) => ({
    category_id: `cat_${cat.category_name}`,
    category_name: cat.category_name,
    qty: Number(cat.quantity ?? 0)
  }));
  
  const opts: OptRow[] = (optsRaw ?? []).map((opt: any) => ({
    option_name: opt.option_name,
    qty: Number(opt.quantity ?? 0)
  }));
  const ts: Point[] = stats.perHour.map(point => ({
    ts: point.hour,
    drinks: point.drinks,
  }));

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
