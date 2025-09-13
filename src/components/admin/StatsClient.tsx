'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StatsRealtime from './StatsRealtime';
import * as XLSX from 'xlsx';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Legend
} from 'recharts';

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

interface StatsClientProps {
  eventId: string;
  initialTotals: Totals | null;
  initialItems: ItemRow[];
  initialCats: CatRow[];
  initialOpts: OptRow[];
  initialTs: Point[];
}

export function StatsClient({
  eventId,
  initialTotals,
  initialItems,
  initialCats,
  initialOpts,
  initialTs,
}: StatsClientProps) {
  const router = useRouter();
  const [totals, setTotals] = useState<Totals | null>(initialTotals);
  const [items, setItems] = useState<ItemRow[]>(initialItems);
  const [cats, setCats] = useState<CatRow[]>(initialCats);
  const [opts, setOpts] = useState<OptRow[]>(initialOpts);
  const [ts, setTs] = useState<Point[]>(initialTs);
  const [closing, setClosing] = useState(false);
  const [filter, setFilter] = useState('');

  const filteredItems = useMemo(
    () => items.filter((it) =>
      it.item_name.toLowerCase().includes(filter.toLowerCase())
    ),
    [items, filter]
  );

  // Fonction pour formater l'heure
  function formatHour(isoString: string): string {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('fr-FR');
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} : ${timeStr}`;
  }

  // Fonction pour formater la période
  function formatPeriod(isoString: string): string {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('fr-FR');
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  }

  // Données formatées pour les graphiques
  const chartItems = useMemo(() => 
    [...items].sort((a, b) => a.qty - b.qty), // Ordre croissant
    [items]
  );

  const chartOptions = useMemo(() => 
    [...opts].sort((a, b) => b.qty - a.qty), // Ordre décroissant (plus commandé en premier)
    [opts]
  );

  const chartTimeSeries = useMemo(() => 
    ts.map(point => ({
      ...point,
      formattedTime: formatHour(point.ts)
    })),
    [ts]
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

  function exportExcel() {
    // Créer un nouveau workbook
    const wb = XLSX.utils.book_new();
    
    // Feuille 1: Résumé
    const summaryData = [
      ['Métrique', 'Valeur'],
      ['Nombre de commandes', totals?.orders ?? 0],
      ['Nombre de boissons', totals?.drinks ?? 0],
      ['Clients uniques', totals?.unique_customers ?? 0],
      ['Période début', totals?.period?.from ? new Date(totals.period.from).toLocaleString('fr-FR') : 'N/A'],
      ['Période fin', totals?.period?.to ? new Date(totals.period.to).toLocaleString('fr-FR') : 'N/A']
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Résumé');

    // Feuille 2: Boissons par quantité
    const itemsData = [
      ['Boisson', 'Quantité'],
      ...items.map(item => [item.item_name, item.qty])
    ];
    const itemsWs = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, itemsWs, 'Boissons');

    // Feuille 3: Options
    if (opts.length > 0) {
      const optionsData = [
        ['Option', 'Quantité'],
        ...opts.map(opt => [opt.option_name, opt.qty])
      ];
      const optionsWs = XLSX.utils.aoa_to_sheet(optionsData);
      XLSX.utils.book_append_sheet(wb, optionsWs, 'Options');
    }

    // Feuille 4: Boissons par heure
    if (ts.length > 0) {
      const timeSeriesData = [
        ['Heure', 'Boissons'],
        ...ts.map(point => [formatHour(point.ts), point.drinks])
      ];
      const timeSeriesWs = XLSX.utils.aoa_to_sheet(timeSeriesData);
      XLSX.utils.book_append_sheet(wb, timeSeriesWs, 'Boissons par heure');
    }

    // Télécharger le fichier
    const eventName = `wildbeans-rapport-${eventId}-${new Date().toISOString().split('T')[0]}`;
    XLSX.writeFile(wb, `${eventName}.xlsx`);
  }

  async function refreshData() {
    try {
      const [t, i, c, o, s] = await Promise.all([
        supabase.rpc('admin_event_totals', { event_id: eventId }),
        supabase.rpc('admin_event_items_breakdown', { event_id: eventId }),
        supabase.rpc('admin_event_categories_breakdown', { event_id: eventId }),
        supabase.rpc('admin_event_options_breakdown', { event_id: eventId }),
        supabase.rpc('admin_event_timeseries', { event_id: eventId }),
      ]);

      // Debug: log les données des options
      console.log('Options RPC result:', o);
      console.log('Options data:', o.data);
      console.log('Options error:', o.error);

      // Debug: requête directe pour voir les données brutes
      const { data: rawOptions, error: rawError } = await supabase
        .from('order_item_options')
        .select(`
          option_name,
          order_item_id,
          order_items (
            order_id,
            orders (
              event_id
            )
          )
        `)
        .eq('order_items.orders.event_id', eventId);
      
      console.log('Raw options data:', rawOptions);
      console.log('Raw options error:', rawError);

      setTotals((t.data as Totals) ?? null);
      setItems((i.data as ItemRow[]) ?? []);
      setCats((c.data as CatRow[]) ?? []);
      setOpts(((o.data as OptRow[]) ?? []).slice(0, 5));
      setTs((s.data as Point[]) ?? []);
    } catch (error) {
      console.error('ERROR LOADING DATA:', error);
      toast.error('ERROR LOADING DATA');
    }
  }

  async function closeEvent() {
    setClosing(true);
    try {
      const { error } = await supabase.rpc('admin_close_event', { event_id: eventId });
      if (error) {
        toast.error('ERROR: ' + error.message);
        return;
      }
      toast.success('EVENT CLOSED ✅');
      refreshData();
    } catch (error) {
      console.error('ERROR DURING CLOSURE:', error);
      toast.error('ERROR DURING CLOSURE');
    } finally {
      setClosing(false);
    }
  }

  return (
    <>
      <StatsRealtime eventId={eventId} onTick={refreshData} />
      
      {/* Bouton Back to events */}
      <button
        onClick={() => router.push('/admin/events')}
        className="mb-4 inline-flex items-center gap-2 h-10 px-3 border rounded-none hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" />
        BACK TO EVENTS
      </button>
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/events/${eventId}`)}
            className="h-10 px-3 border rounded-none hover:bg-gray-50"
          >
            EVENT
          </button>
          <button
            onClick={() => router.push(`/admin/events/${eventId}/menu`)}
            className="h-10 px-3 border rounded-none hover:bg-gray-50"
          >
            MENU
          </button>
          <button
            className="h-10 px-3 border rounded-none bg-black text-white"
          >
            WILD STATS
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportExcel} 
            className="inline-flex items-center gap-2 h-10 px-3 border rounded-none hover:bg-gray-50 bg-green-50 border-green-200"
          >
            <Download className="h-4 w-4" />
            EXPORT RAPPORT COMPLET
          </button>
          <button
            onClick={closeEvent}
            disabled={closing}
            className="h-10 px-3 border rounded-none hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {closing ? 'CLOSING…' : "CLOSE EVENT"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="border rounded-none p-4 shadow-sm">
          <div className="text-xs text-neutral-500">ORDERS</div>
          <div className="text-2xl font-semibold">{totals?.orders ?? 0}</div>
        </div>
        <div className="border rounded-none p-4 shadow-sm">
          <div className="text-xs text-neutral-500">DRINKS</div>
          <div className="text-2xl font-semibold">{totals?.drinks ?? 0}</div>
        </div>
        <div className="border rounded-none p-4 shadow-sm">
          <div className="text-xs text-neutral-500">UNIQUE CUSTOMERS</div>
          <div className="text-2xl font-semibold">{totals?.unique_customers ?? 0}</div>
        </div>
        <div className="border rounded-none p-4 shadow-sm">
          <div className="text-xs text-neutral-500">PERIOD</div>
          <div className="text-sm">
            {totals?.period?.from ? formatPeriod(totals.period.from) : 'N/A'}
            {totals?.period?.to && ` → ${formatPeriod(totals.period.to)}`}
          </div>
        </div>
      </div>

      {/* Graphique principal des boissons (toutes les boissons, ordre croissant) */}
      <div className="border rounded-none p-4 shadow-sm mt-6">
        <div className="text-sm font-semibold mb-2">TOUTES LES BOISSONS COMMANDÉES</div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartItems} margin={{ bottom: 60, left: 20, right: 20 }}>
            <XAxis 
              dataKey="item_name" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="qty" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border rounded-none p-4 shadow-sm mt-6">
        <div className="text-sm font-semibold mb-2">OPTIONS LES PLUS COMMANDÉES</div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartOptions} margin={{ bottom: 60, left: 20, right: 20 }}>
            <XAxis 
              dataKey="option_name" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="qty" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border rounded-none p-4 shadow-sm mt-6">
        <div className="text-sm font-semibold mb-2">BOISSONS PAR HEURE</div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartTimeSeries} margin={{ bottom: 100, left: 20, right: 20, top: 20 }}>
            <XAxis 
              dataKey="formattedTime" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              fontSize={12}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => `Heure: ${value}`}
              formatter={(value) => [`${value} boissons`, 'Boissons']}
            />
            <Line type="monotone" dataKey="drinks" strokeWidth={2} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 border rounded-none p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">TABLEAU DES BOISSONS (QUANTITÉS)</div>
          <div className="flex gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="FILTRER PAR NOM…"
              className="h-10 px-3 border border-gray-300 rounded-none"
            />
            <button onClick={exportCSV} className="h-10 px-3 border rounded-none hover:bg-gray-50">
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
    </>
  );
}
