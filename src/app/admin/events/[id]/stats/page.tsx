'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import EventTabs from '@/components/admin/EventTabs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

export default function EventStatsPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const [totals, setTotals] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [opts, setOpts] = useState<any[]>([]);
  const [ts, setTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [filter, setFilter] = useState('');

  const filteredItems = (items || []).filter((it: any) =>
    it.item_name.toLowerCase().includes(filter.toLowerCase())
  );

  function exportCSV() {
    const rows = [['Item', 'Quantité'], ...filteredItems.map((r: any) => [r.item_name, String(r.qty)])];
    const csv = rows.map(r => r.map(v => `"${(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wildbeans-items-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function load() {
    setLoading(true);
    try {
      const t = await supabase.rpc('admin_event_totals', { p_event_id: eventId });
      const i = await supabase.rpc('admin_event_items_breakdown', { p_event_id: eventId });
      const c = await supabase.rpc('admin_event_categories_breakdown', { p_event_id: eventId });
      const o = await supabase.rpc('admin_event_options_breakdown', { p_event_id: eventId });
      const s = await supabase.rpc('admin_event_timeseries', { p_event_id: eventId });
      
      setTotals(t.data || null);
      setItems(i.data || []);
      setCats(c.data || []);
      setOpts((o.data || []).slice(0, 5));
      setTs(s.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    load(); 
  }, [eventId]);

  async function closeEvent() {
    setClosing(true);
    try {
      const { error } = await supabase.rpc('admin_close_event', { p_event_id: eventId });
      if (error) {
        toast.error('Erreur: ' + error.message);
        return;
      }
      toast.success('Évènement clôturé ✅');
      load();
    } catch (error) {
      console.error('Erreur lors de la clôture:', error);
      toast.error('Erreur lors de la clôture');
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <AdminGate>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Chargement des statistiques...</div>
        </main>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AdminHeader title="Wild Stats" />
        <div className="flex items-center justify-between mb-2">
          <EventTabs id={eventId} />
          <button 
            onClick={closeEvent} 
            disabled={closing} 
            className="h-10 px-3 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {closing ? 'Clôture…' : 'Clôturer l\'event'}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-xs text-neutral-500">Orders</div>
            <div className="text-2xl font-semibold">{totals?.orders ?? 0}</div>
          </div>
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-xs text-neutral-500">Drinks</div>
            <div className="text-2xl font-semibold">{totals?.drinks ?? 0}</div>
          </div>
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-xs text-neutral-500">Unique customers</div>
            <div className="text-2xl font-semibold">{totals?.unique_customers ?? 0}</div>
          </div>
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-xs text-neutral-500">Period</div>
            <div className="text-sm">
              {totals?.period?.from ? totals.period.from.slice(0, 16) : 'N/A'} 
              {totals?.period?.to && ` → ${totals.period.to.slice(0, 16)}`}
            </div>
          </div>
        </div>

        {/* Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Top Drinks</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={items.slice(0, 5)}>
                <XAxis dataKey="item_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Categories</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie 
                  dataKey="qty" 
                  nameKey="category_name" 
                  data={cats} 
                  outerRadius={80}
                  fill="#8884d8"
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Top Options</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={opts}>
                <XAxis dataKey="option_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeseries */}
        <div className="border rounded-lg p-4 shadow-sm mt-6">
          <div className="text-sm font-semibold mb-2">Drinks per hour</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ts}>
              <XAxis dataKey="ts" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="drinks" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tableau des boissons */}
        <div className="mt-6 border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Boissons (quantités)</div>
            <div className="flex gap-2">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrer par nom…"
                className="h-10 px-3 border border-gray-300 rounded-md"
              />
              <button onClick={exportCSV} className="h-10 px-3 border rounded-md hover:bg-gray-50">
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="py-2">Boisson</th>
                  <th className="py-2 w-24 text-right">Quantité</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((r: any) => (
                  <tr key={r.item_id}>
                    <td className="py-2">{r.item_name}</td>
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
