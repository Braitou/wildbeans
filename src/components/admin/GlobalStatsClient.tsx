'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Download, 
  Coffee, 
  Users, 
  TrendingUp, 
  Percent,
  UserCheck,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';
import KPICard from '@/components/stats/KPICard';
import TopDrinksChart from '@/components/stats/TopDrinksChart';
import CategoryDistribution from '@/components/stats/CategoryDistribution';
import TimelineChart from '@/components/stats/TimelineChart';
import OptionsChart from '@/components/stats/OptionsChart';
import StatsTable from '@/components/stats/StatsTable';

interface GlobalTotals {
  total_orders: number;
  total_drinks: number;
  unique_customers: number;
  events_count: number;
  avg_per_order: number;
  customization_rate: number;
  barista_percentage: number;
  client_percentage: number;
}

interface DrinkBreakdown {
  item_name: string;
  category_name: string;
  total_qty: number;
  percentage: number;
}

interface OptionBreakdown {
  option_name: string;
  total_qty: number;
  percentage: number;
}

interface EventSummary {
  event_id: string;
  event_name: string;
  event_slug: string;
  orders_count: number;
  drinks_count: number;
  customers_count: number;
  top_drink: string;
  top_drink_count: number;
  event_date: string;
  is_closed: boolean;
}

interface TimelineData {
  month: number;
  year: number;
  month_label: string;
  orders_count: number;
  drinks_count: number;
}

interface CategoryData {
  category_name: string;
  total_qty: number;
  percentage: number;
}

export default function GlobalStatsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [totals, setTotals] = useState<GlobalTotals | null>(null);
  const [drinks, setDrinks] = useState<DrinkBreakdown[]>([]);
  const [options, setOptions] = useState<OptionBreakdown[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    
    try {
      // 1. Totaux
      const { data: totalsData } = await supabase.rpc('admin_global_totals');
      setTotals(totalsData);

      // 2. Breakdown boissons
      const { data: drinksData } = await supabase.rpc('admin_global_drinks_breakdown');
      setDrinks(drinksData || []);

      // 3. Breakdown options
      const { data: optionsData } = await supabase.rpc('admin_global_options_breakdown');
      setOptions(optionsData || []);

      // 4. Résumé événements
      const { data: eventsData } = await supabase.rpc('admin_global_events_summary');
      setEvents(eventsData || []);

      // 5. Timeline
      const { data: timelineData } = await supabase.rpc('admin_global_timeline');
      setTimeline(timelineData || []);

      // 6. Catégories
      const { data: categoriesData } = await supabase.rpc('admin_global_category_distribution');
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error loading global stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Totaux
    if (totals) {
      const totalsSheet = XLSX.utils.json_to_sheet([
        { Métrique: 'Commandes Totales', Valeur: totals.total_orders },
        { Métrique: 'Boissons Totales', Valeur: totals.total_drinks },
        { Métrique: 'Clients Uniques', Valeur: totals.unique_customers },
        { Métrique: 'Événements', Valeur: totals.events_count },
        { Métrique: 'Moyenne/Commande', Valeur: totals.avg_per_order },
        { Métrique: 'Taux Personnalisation (%)', Valeur: totals.customization_rate },
        { Métrique: 'Ratio Barista (%)', Valeur: totals.barista_percentage },
        { Métrique: 'Ratio Client (%)', Valeur: totals.client_percentage },
      ]);
      XLSX.utils.book_append_sheet(wb, totalsSheet, 'Totaux');
    }

    // Sheet 2: Boissons
    if (drinks.length > 0) {
      const drinksSheet = XLSX.utils.json_to_sheet(
        drinks.map(d => ({
          Boisson: d.item_name,
          Catégorie: d.category_name,
          Quantité: d.total_qty,
          Pourcentage: `${d.percentage}%`
        }))
      );
      XLSX.utils.book_append_sheet(wb, drinksSheet, 'Boissons');
    }

    // Sheet 3: Options
    if (options.length > 0) {
      const optionsSheet = XLSX.utils.json_to_sheet(
        options.map(o => ({
          Option: o.option_name,
          Quantité: o.total_qty,
          Pourcentage: `${o.percentage}%`
        }))
      );
      XLSX.utils.book_append_sheet(wb, optionsSheet, 'Options');
    }

    // Sheet 4: Événements
    if (events.length > 0) {
      const eventsSheet = XLSX.utils.json_to_sheet(
        events.map(e => ({
          Événement: e.event_name,
          Slug: e.event_slug,
          Date: e.event_date ? new Date(e.event_date).toLocaleDateString() : '',
          Commandes: e.orders_count,
          Boissons: e.drinks_count,
          Clients: e.customers_count,
          'Top Boisson': e.top_drink,
          'Top Count': e.top_drink_count,
          Statut: e.is_closed ? 'Fermé' : 'Actif'
        }))
      );
      XLSX.utils.book_append_sheet(wb, eventsSheet, 'Événements');
    }

    // Sheet 5: Timeline
    if (timeline.length > 0) {
      const timelineSheet = XLSX.utils.json_to_sheet(
        timeline.map(t => ({
          Période: t.month_label,
          Commandes: t.orders_count,
          Boissons: t.drinks_count
        }))
      );
      XLSX.utils.book_append_sheet(wb, timelineSheet, 'Timeline');
    }

    XLSX.writeFile(wb, `wildbeans_stats_globales_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-gray-500">Chargement des statistiques...</div>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const topDrinksData = drinks.slice(0, 10).map(d => ({
    name: d.item_name,
    value: d.total_qty,
    category: d.category_name
  }));

  const topOptionsData = options.slice(0, 10).map(o => ({
    name: o.option_name,
    value: o.total_qty
  }));

  const categoryDistData = categories.map(c => ({
    name: c.category_name,
    value: c.total_qty
  }));

  const timelineChartData = timeline.map(t => ({
    label: t.month_label,
    value: t.drinks_count
  }));

  // Calculer croissance mensuelle (simple)
  const growthRate = timeline.length >= 2
    ? ((timeline[timeline.length - 1]?.drinks_count - timeline[timeline.length - 2]?.drinks_count) / 
       (timeline[timeline.length - 2]?.drinks_count || 1) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6 px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/events')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-black" />
            </button>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-black" />
              <div>
                <h1 className="text-3xl font-bold text-black">WILD STATS GLOBAL</h1>
                <p className="text-sm text-gray-600 mt-1">Statistiques cumulées de tous les événements</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 font-bold hover:bg-gray-800 transition-colors"
          >
            <Download className="h-5 w-5" />
            EXPORT EXCEL
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* KPIs Grid */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            label="Total Commandes"
            value={totals?.total_orders || 0}
            icon={Coffee}
          />
          <KPICard
            label="Total Boissons"
            value={totals?.total_drinks || 0}
            icon={TrendingUp}
          />
          <KPICard
            label="Clients Uniques"
            value={totals?.unique_customers || 0}
            icon={Users}
          />
          <KPICard
            label="Événements"
            value={totals?.events_count || 0}
            icon={Calendar}
          />
          <KPICard
            label="Moyenne/Commande"
            value={totals?.avg_per_order || 0}
            trend={`${totals?.total_drinks} boissons total`}
          />
          <KPICard
            label="Taux Personnalisation"
            value={`${totals?.customization_rate || 0}%`}
            icon={Percent}
          />
          <KPICard
            label="Ratio Barista/Client"
            value={`${totals?.barista_percentage || 0}/${totals?.client_percentage || 0}`}
            trend={`${totals?.barista_percentage}% barista`}
            icon={UserCheck}
          />
          <KPICard
            label="Croissance Mensuelle"
            value={`${Number(growthRate) >= 0 ? '+' : ''}${growthRate}%`}
            trend="vs mois dernier"
            icon={TrendingUp}
          />
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <TimelineChart
              data={timelineChartData}
              title="Évolution Mensuelle"
              color="#2ecc71"
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Drinks */}
          {topDrinksData.length > 0 && (
            <div className="bg-white p-6 border border-gray-200 shadow-sm">
              <TopDrinksChart
                data={topDrinksData}
                title="Top 10 Boissons"
              />
            </div>
          )}

          {/* Category Distribution */}
          {categoryDistData.length > 0 && (
            <div className="bg-white p-6 border border-gray-200 shadow-sm">
              <CategoryDistribution
                data={categoryDistData}
                title="Distribution par Catégorie"
              />
            </div>
          )}
        </div>

        {/* Options Chart */}
        {topOptionsData.length > 0 && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <OptionsChart
              data={topOptionsData}
              title="Top 10 Options"
            />
          </div>
        )}

        {/* Events Table */}
        {events.length > 0 && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <StatsTable
              data={events}
              title="Résumé par Événement"
              searchPlaceholder="Rechercher un événement..."
              columns={[
                { 
                  key: 'event_name', 
                  label: 'Événement',
                  render: (val, row) => (
                    <div>
                      <div className="font-semibold">{val}</div>
                      <div className="text-xs text-gray-500">{row.event_slug}</div>
                    </div>
                  )
                },
                { 
                  key: 'event_date', 
                  label: 'Date',
                  render: (val) => val ? new Date(val).toLocaleDateString('fr-FR') : '-'
                },
                { key: 'orders_count', label: 'Commandes' },
                { key: 'drinks_count', label: 'Boissons' },
                { key: 'customers_count', label: 'Clients' },
                { 
                  key: 'top_drink', 
                  label: 'Top Boisson',
                  render: (val, row) => val ? `${val} (${row.top_drink_count})` : '-'
                },
                {
                  key: 'is_closed',
                  label: 'Statut',
                  render: (val) => (
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      val ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {val ? 'FERMÉ' : 'ACTIF'}
                    </span>
                  )
                }
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

