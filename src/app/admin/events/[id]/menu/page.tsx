'use client';

import { useCallback, useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import EventTabs from '@/components/admin/EventTabs';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  category_name: string;
  is_active: boolean;
  enabled_for_event: boolean;
};

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventMenuPage({ params }: PageProps) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les items du menu avec leurs catégories (NOUVELLES TABLES)
      const { data: menuItems, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          name,
          description,
          category_id,
          is_active,
          category:categories(id, name)
        `)
        .eq('is_active', true)
        .order('name');

      if (itemsError) {
        console.error('Erreur lors du chargement des items:', itemsError);
        toast.error('Erreur lors du chargement des boissons');
        return;
      }

      // Récupérer les items activés pour cet événement
      const { data: eventItems, error: eventItemsError } = await supabase
        .from('event_items')
        .select('menu_item_id, enabled')
        .eq('event_id', eventId);

      if (eventItemsError) {
        console.error('Erreur lors du chargement des event_items:', eventItemsError);
        // Continuer quand même, on supposera que tous les items sont activés par défaut
      }

      // Créer un map des items activés pour cet événement
      const eventItemsMap = new Map(
        (eventItems || []).map(ei => [ei.menu_item_id, ei.enabled])
      );

      // Transformer les données
      const itemsWithCategory = (menuItems || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category_id: item.category.id,
        category_name: item.category.name,
        is_active: item.is_active,
        enabled_for_event: eventItemsMap.get(item.id) ?? true, // Par défaut activé
      }));

      // Grouper par catégorie
      const grouped = itemsWithCategory.reduce((acc: Category[], item) => {
        const existingCategory = acc.find(cat => cat.id === item.category_id);
        if (existingCategory) {
          existingCategory.items.push(item);
        } else {
          acc.push({
            id: item.category_id,
            name: item.category_name,
            items: [item]
          });
        }
        return acc;
      }, []);

      setCategories(grouped);
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  async function toggleItem(itemId: string, enabled: boolean) {
    setUpdating(itemId);
    try {
      // Insérer ou mettre à jour dans event_items
      const { error } = await supabase
        .from('event_items')
        .upsert({
          event_id: eventId,
          menu_item_id: itemId,
          enabled: enabled
        }, {
          onConflict: 'event_id,menu_item_id'
        });
      
      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        toast.error('Erreur lors de la mise à jour');
        return;
      }

      // Mettre à jour l'état local
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, enabled_for_event: enabled } : item
        )
      })));
      
      toast.success(enabled ? '✅ Activé' : '✅ Désactivé');
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(null);
    }
  }

  async function toggleCategory(categoryId: string, enabled: boolean) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    setUpdating(categoryId);
    try {
      // Mettre à jour tous les items de la catégorie
      const promises = category.items.map(item => 
        supabase
          .from('event_items')
          .upsert({
            event_id: eventId,
            menu_item_id: item.id,
            enabled: enabled
          }, {
            onConflict: 'event_id,menu_item_id'
          })
      );

      const results = await Promise.all(promises);
      const hasError = results.some(r => r.error);

      if (hasError) {
        toast.error('Erreur lors de la mise à jour de certains items');
        return;
      }

      // Mettre à jour l'état local
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, items: cat.items.map(item => ({ ...item, enabled_for_event: enabled })) }
          : cat
      ));
      
      toast.success(enabled ? '✅ Catégorie activée' : '✅ Catégorie désactivée');
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <AdminGate>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        </main>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminHeader title="GESTION DU MENU" />
        
        {/* Bouton retour */}
        <button
          onClick={() => router.push('/admin/events')}
          className="mb-4 inline-flex items-center gap-2 h-10 px-4 border border-gray-300 rounded-none hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          RETOUR AUX ÉVÉNEMENTS
        </button>
        
        <EventTabs id={eventId} />
        
        <div className="mt-6 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-none">
          <p className="text-sm text-blue-900">
            💡 <strong>Activez ou désactivez</strong> les boissons qui seront disponibles pour cet événement. 
            Les boissons désactivées n'apparaîtront pas dans le formulaire de commande des clients.
          </p>
        </div>

        <div className="space-y-6">
          {categories.length === 0 ? (
            <div className="text-center py-12 border border-gray-200 rounded-none bg-gray-50">
              <p className="text-neutral-500 text-lg">AUCUNE BOISSON TROUVÉE</p>
              <p className="text-neutral-400 text-sm mt-2">
                Vérifiez que des items ont été créés dans la base de données.
              </p>
            </div>
          ) : (
            categories.map(category => {
              const allEnabled = category.items.every(item => item.enabled_for_event);
              const allDisabled = category.items.every(item => !item.enabled_for_event);
              
              return (
                <div key={category.id} className="border border-gray-200 rounded-none overflow-hidden">
                  {/* Header de la catégorie */}
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold uppercase tracking-wide">
                          {category.name}
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1">
                          {category.items.filter(i => i.enabled_for_event).length} / {category.items.length} boissons activées
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCategory(category.id, true)}
                          disabled={updating === category.id || allEnabled}
                          className="h-9 px-4 text-sm font-medium border border-green-600 text-green-700 bg-white hover:bg-green-50 rounded-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ✓ TOUT ACTIVER
                        </button>
                        <button
                          onClick={() => toggleCategory(category.id, false)}
                          disabled={updating === category.id || allDisabled}
                          className="h-9 px-4 text-sm font-medium border border-red-600 text-red-700 bg-white hover:bg-red-50 rounded-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ✕ TOUT DÉSACTIVER
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Liste des items */}
                  <div className="divide-y divide-gray-200">
                    {category.items.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                          !item.enabled_for_event ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-base uppercase">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-sm text-neutral-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        
                        {/* Toggle switch */}
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input
                            type="checkbox"
                            checked={item.enabled_for_event}
                            onChange={(e) => toggleItem(item.id, e.target.checked)}
                            disabled={updating === item.id}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/10 rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-6 after:w-6 after:transition-all peer-checked:bg-black peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                          {updating === item.id && (
                            <Loader2 className="h-4 w-4 animate-spin ml-2 text-neutral-400" />
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </AdminGate>
  );
}
