'use client';

import { useCallback, useEffect, useMemo, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import EventTabs from '@/components/admin/EventTabs';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Legend
} from 'recharts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type Totals = {
  orders: number;
  drinks: number;
  unique_customers: number;
  period?: { from: string | null; to: string | null } | null;
};

type ItemRow = { item_id: string; item_name: string; qty: number };
type CatRow  = { category_id: string; category_name: string; qty: number };
type OptRow  = { option_name: string; qty: number };
type Point   = { ts: string; drinks: number };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventStatsPage({ params }: PageProps) {
  const { id: eventId } = use(params);
  const router = useRouter();

  const [totals, setTotals] = useState<Totals | null>(null);
  const [items, setItems]   = useState<ItemRow[]>([]);
  const [cats, setCats]     = useState<CatRow[]>([]);
  const [opts, setOpts]     = useState<OptRow[]>([]);
  const [ts, setTs]         = useState<Point[]>([]);
  const [loading, setLoading]   = useState(true);
  const [closing, setClosing]   = useState(false);
  const [filter, setFilter]     = useState('');

  const filteredItems = useMemo(
    () => items.filter((it) =>
      it.item_name.toLowerCase().includes(filter.toLowerCase())
    ),
    [items, filter]
  );

  function exportCSV() {
    const rows: (string | number)[][] = [
      ['Item', 'Quantity'],
      ...filteredItems.map((r) => [r.item_name, String(r.qty)]),
    ];
    const csv = rows
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wildbeans-items-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, i, c, o, s] = await Promise.all([
        supabase.rpc('admin_event_totals', { event_id: eventId }),
        supabase.rpc('admin_event_items_breakdown', { event_id: eventId }),
        supabase.rpc('admin_event_categories_breakdown', { event_id: eventId }),
        supabase.rpc('admin_event_options_breakdown', { event_id: eventId }),
        supabase.rpc('admin_event_timeseries', { event_id: eventId }),
      ]);

      setTotals((t.data as Totals) ?? null);
      setItems((i.data as ItemRow[]) ?? []);
      setCats((c.data as CatRow[]) ?? []);
      setOpts(((o.data as OptRow[]) ?? []).slice(0, 5));
      setTs((s.data as Point[]) ?? []);
    } catch (error) {
      console.error('ERROR LOADING DATA:', error);
      toast.error('ERROR LOADING DATA');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  async function closeEvent() {
    setClosing(true);
    try {
      const { error } = await supabase.rpc('admin_close_event', { event_id: eventId });
      if (error) {
        toast.error('ERROR: ' + error.message);
        return;
      }
      toast.success('EVENT CLOSED ✅');
      load();
    } catch (error) {
      console.error('ERROR DURING CLOSURE:', error);
      toast.error('ERROR DURING CLOSURE');
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <AdminGate>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">LOADING STATISTICS...</div>
        </main>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AdminHeader title="Wild Stats" />
        
        {/* Bouton Back to events */}
        <button
          onClick={() => router.push('/admin/events')}
          className="mb-4 inline-flex items-center gap-2 h-10 px-3 border rounded-md hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          BACK TO EVENTS
        </button>
        
        <div className="flex items-center justify-between mb-2">
          <EventTabs id={eventId} />
          <button
            onClick={closeEvent}
            disabled={closing}
            className="h-10 px-3 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {closing ? 'CLOSING…' : "CLOSE EVENT"}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-xs text-neutral-500">ORDERS</div>
            <div className="text-2xl font-semibold">{totals?.orders ?? 0}</div>
          </div>
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-xs text-neutral-500">DRINKS</div>
            <div className="text-2xl font-semibold">{totals?.drinks ?? 0}</div>
          </div>
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-xs text-neutral-500">UNIQUE CUSTOMERS</div>
            <div className="text-2xl font-semibold">{totals?.unique_customers ?? 0}</div>
          </div>
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-xs text-neutral-500">PERIOD</div>
            <div className="text-sm">
              {totals?.period?.from ? totals.period.from.slice(0, 16) : 'N/A'}
              {totals?.period?.to && ` → ${totals.period.to.slice(0, 16)}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">TOP DRINKS</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={items.slice(0, 5)}>
                <XAxis dataKey="item_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">CATEGORIES</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  dataKey="qty"
                  nameKey="category_name"
                  data={cats}
                  outerRadius={80}
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">TOP OPTIONS</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={opts}>
                <XAxis dataKey="option_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded-lg p-4 shadow-sm mt-6">
          <div className="text-sm font-semibold mb-2">DRINKS PER HOUR</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ts}>
              <XAxis dataKey="ts" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="drinks" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">DRINKS (QUANTITIES)</div>
            <div className="flex gap-2">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="FILTER BY NAME…"
                className="h-10 px-3 border border-gray-300 rounded-md"
              />
              <button onClick={exportCSV} className="h-10 px-3 border rounded-md hover:bg-gray-50">
                EXPORT CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="py-2">DRINK</th>
                  <th className="py-2 w-24 text-right">QUANTITY</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((r) => (
                  <tr key={r.item_id}>
                    <td className="py-2">{r.item_name.toUpperCase()}</td>
                    <td className="py-2 text-right font-medium">{r.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AdminGate>
  );
}
