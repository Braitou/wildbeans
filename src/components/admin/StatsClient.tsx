'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Download, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StatsRealtime from './StatsRealtime';
import * as XLSX from 'xlsx';
import KPICard from '@/components/stats/KPICard';
import TopDrinksChart from '@/components/stats/TopDrinksChart';
import CategoryDistribution from '@/components/stats/CategoryDistribution';
import OptionsChart from '@/components/stats/OptionsChart';
import HeatmapChart from '@/components/stats/HeatmapChart';
import StatsTable from '@/components/stats/StatsTable';
import EventTabs from './EventTabs';

interface EventTotals {
  orders: number;
  drinks: number;
  unique_customers: number;
  avg_per_order: number;
  avg_options_per_drink: number;
  customization_rate: number;
  barista_percentage: number;
  client_percentage: number;
  avg_time_between_orders_minutes: number;
  period: {
    from: string | null;
    to: string | null;
  };
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

interface CategoryBreakdown {
  category_name: string;
  total_qty: number;
  percentage: number;
}

interface HourlyData {
  hour: number;
  orders_count: number;
  drinks_count: number;
}

interface PeakAnalysis {
  peak_hour: number;
  peak_count: number;
  avg_time_between_orders_minutes: number;
}

interface CustomizationDetail {
  drink_name: string;
  total_count: number;
  with_options: number;
  customization_rate: number;
}

interface StatsClientProps {
  eventId: string;
}

export function StatsClient({ eventId }: StatsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const [totals, setTotals] = useState<EventTotals | null>(null);
  const [drinks, setDrinks] = useState<DrinkBreakdown[]>([]);
  const [options, setOptions] = useState<OptionBreakdown[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [hourly, setHourly] = useState<HourlyData[]>([]);
  const [peakAnalysis, setPeakAnalysis] = useState<PeakAnalysis | null>(null);
  const [customizationDetails, setCustomizationDetails] = useState<CustomizationDetail[]>([]);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    
    try {
      // 1. Totaux améliorés
      const { data: totalsData } = await supabase.rpc('admin_event_totals', { event_id: eventId });
      setTotals(totalsData);

      // 2. Breakdown boissons
      const { data: drinksData } = await supabase.rpc('admin_event_items_breakdown', { event_id: eventId });
      setDrinks(drinksData || []);

      // 3. Breakdown options
      const { data: optionsData } = await supabase.rpc('admin_event_options_breakdown', { event_id: eventId });
      setOptions(optionsData || []);

      // 4. Breakdown catégories
      const { data: categoriesData } = await supabase.rpc('admin_event_categories_breakdown', { event_id: eventId });
      setCategories(categoriesData || []);

      // 5. Heatmap horaire
      const { data: hourlyData } = await supabase.rpc('admin_event_hourly_heatmap', { event_id: eventId });
      setHourly(hourlyData || []);

      // 6. Analyse des pics
      const { data: peakData } = await supabase.rpc('admin_event_peak_analysis', { event_id: eventId });
      setPeakAnalysis(peakData);

      // 7. Détails personnalisation
      const { data: customizationData } = await supabase.rpc('admin_event_customization_details', { event_id: eventId });
      setCustomizationDetails(customizationData || []);
    } catch (error) {
      console.error('Error loading event stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Totaux
    if (totals) {
      const totalsSheet = XLSX.utils.json_to_sheet([
        { Métrique: 'Commandes', Valeur: totals.orders },
        { Métrique: 'Boissons', Valeur: totals.drinks },
        { Métrique: 'Clients Uniques', Valeur: totals.unique_customers },
        { Métrique: 'Moyenne/Commande', Valeur: totals.avg_per_order },
        { Métrique: 'Moyenne Options/Boisson', Valeur: totals.avg_options_per_drink },
        { Métrique: 'Taux Personnalisation (%)', Valeur: totals.customization_rate },
        { Métrique: 'Ratio Barista (%)', Valeur: totals.barista_percentage },
        { Métrique: 'Ratio Client (%)', Valeur: totals.client_percentage },
        { Métrique: 'Temps Moyen Entre Commandes (min)', Valeur: totals.avg_time_between_orders_minutes },
        { Métrique: 'Période Début', Valeur: totals.period?.from ? new Date(totals.period.from).toLocaleString('fr-FR') : '' },
        { Métrique: 'Période Fin', Valeur: totals.period?.to ? new Date(totals.period.to).toLocaleString('fr-FR') : '' },
      ]);
      XLSX.utils.book_append_sheet(wb, totalsSheet, 'Résumé');
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

    // Sheet 4: Personnalisation par boisson
    if (customizationDetails.length > 0) {
      const customSheet = XLSX.utils.json_to_sheet(
        customizationDetails.map(c => ({
          Boisson: c.drink_name,
          'Total Commandé': c.total_count,
          'Avec Options': c.with_options,
          'Taux Personnalisation (%)': c.customization_rate
        }))
      );
      XLSX.utils.book_append_sheet(wb, customSheet, 'Personnalisation');
    }

    // Sheet 5: Distribution horaire
    if (hourly.length > 0) {
      const hourlySheet = XLSX.utils.json_to_sheet(
        hourly.map(h => ({
          Heure: `${h.hour}h`,
          Commandes: h.orders_count,
          Boissons: h.drinks_count
        }))
      );
      XLSX.utils.book_append_sheet(wb, hourlySheet, 'Horaire');
    }

    const eventName = `wildbeans-event-${eventId}-${new Date().toISOString().split('T')[0]}`;
    XLSX.writeFile(wb, `${eventName}.xlsx`);
  };

  async function closeEvent() {
    setClosing(true);
    try {
      const { error } = await supabase.rpc('admin_close_event', { event_id: eventId });
      if (error) {
        toast.error('Erreur: ' + error.message);
        return;
      }
      toast.success('Événement fermé ✅');
      loadAllStats();
    } catch (error) {
      console.error('Error closing event:', error);
      toast.error('Erreur lors de la fermeture');
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  const heatmapData = hourly.map(h => ({
    hour: h.hour,
    count: h.orders_count
  }));

  return (
    <>
      <StatsRealtime eventId={eventId} onTick={loadAllStats} />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6 px-8 -mt-8 -mx-4 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
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
                  <h1 className="text-3xl font-bold text-black">WILD STATS</h1>
                  <p className="text-sm text-gray-600 mt-1">Statistiques de l'événement</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-black text-white px-6 py-3 font-bold hover:bg-gray-800 transition-colors"
              >
                <Download className="h-5 w-5" />
                EXPORT EXCEL
              </button>
              <button
                onClick={closeEvent}
                disabled={closing}
                className="bg-gray-200 text-black px-6 py-3 font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {closing ? 'FERMETURE...' : 'FERMER EVENT'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto -mt-4 mb-6">
        <EventTabs eventId={eventId} />
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Quick Stats (KPIs Row 1) */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            label="Commandes"
            value={totals?.orders || 0}
          />
          <KPICard
            label="Boissons"
            value={totals?.drinks || 0}
          />
          <KPICard
            label="Clients Uniques"
            value={totals?.unique_customers || 0}
          />
          <KPICard
            label="Moyenne/Cmd"
            value={totals?.avg_per_order || 0}
          />
        </div>

        {/* KPIs Row 2 */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            label="Personnalisées"
            value={`${totals?.customization_rate || 0}%`}
            trend="des boissons"
          />
          <KPICard
            label="Heure de Pointe"
            value={peakAnalysis?.peak_hour ? `${peakAnalysis.peak_hour}h` : '-'}
            trend={peakAnalysis?.peak_count ? `${peakAnalysis.peak_count} cmds` : ''}
          />
          <KPICard
            label="Vitesse Moy"
            value={`${totals?.avg_time_between_orders_minutes.toFixed(1) || 0}min`}
            trend="entre commandes"
          />
          <KPICard
            label="Barista/Client"
            value={`${totals?.barista_percentage || 0}/${totals?.client_percentage || 0}`}
            trend={`${totals?.barista_percentage}% barista`}
          />
        </div>

        {/* Charts Row 1 */}
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

        {/* Heatmap */}
        {heatmapData.length > 0 && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <HeatmapChart
              data={heatmapData}
              title="Heatmap Horaire"
            />
          </div>
        )}

        {/* Customization Details Table */}
        {customizationDetails.length > 0 && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <StatsTable
              data={customizationDetails}
              title="Détails Personnalisation par Boisson"
              searchPlaceholder="Rechercher une boisson..."
              columns={[
                { key: 'drink_name', label: 'Boisson' },
                { key: 'total_count', label: 'Total Commandé' },
                { key: 'with_options', label: 'Avec Options' },
                { 
                  key: 'customization_rate', 
                  label: 'Taux (%)',
                  render: (val) => `${val}%`
                }
              ]}
            />
          </div>
        )}

        {/* All Drinks Table */}
        {drinks.length > 0 && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm">
            <StatsTable
              data={drinks}
              title="Toutes les Boissons"
              searchPlaceholder="Rechercher une boisson..."
              columns={[
                { key: 'item_name', label: 'Boisson' },
                { key: 'category_name', label: 'Catégorie' },
                { key: 'total_qty', label: 'Quantité' },
                { 
                  key: 'percentage', 
                  label: 'Part (%)',
                  render: (val) => `${val}%`
                }
              ]}
            />
          </div>
        )}
      </div>
    </>
  );
}
