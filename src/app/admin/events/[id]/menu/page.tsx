'use client';

import { useCallback, useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import EventTabs from '@/components/admin/EventTabs';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type MenuItem = {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  enabled: boolean;
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
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadMenuItems = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_list_items_for_event', {
        event_id: id
      });
      
      if (error) {
        console.error('Erreur lors du chargement:', error);
        return;
      }

      // Grouper par catégorie
      const grouped = (data || []).reduce((acc: Category[], item: MenuItem) => {
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
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  async function toggleItem(itemId: string, enabled: boolean) {
    setUpdating(itemId);
    try {
      const { error } = await supabase.rpc('admin_set_item_enabled', {
        event_id: id,
        item_id: itemId,
        enabled: enabled
      });
      
      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        toast.error('Erreur ❌');
        return;
      }

      // Mettre à jour l'état local
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, enabled } : item
        )
      })));
      
      toast.success(enabled ? 'Activé ✅' : 'Désactivé ✅');
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur ❌');
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
        supabase.rpc('admin_set_item_enabled', {
          event_id: id,
          item_id: item.id,
          enabled: enabled
        })
      );

      await Promise.all(promises);

      // Mettre à jour l'état local
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, items: cat.items.map(item => ({ ...item, enabled })) }
          : cat
      ));
      
      toast.success(enabled ? 'Catégorie activée ✅' : 'Catégorie désactivée ✅');
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur ❌');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <AdminGate>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Chargement...</div>
        </main>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AdminHeader title="Menu" />
        
        {/* Bouton Back to events */}
        <button
          onClick={() => router.push('/admin/events')}
          className="mb-4 inline-flex items-center gap-2 h-10 px-3 border rounded-md hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </button>
        
        <EventTabs id={id} />
        
        <div className="mb-6 flex items-center justify-end">
          <Link 
            href={`/admin/events/${id}`}
            className="h-10 px-3 border rounded-md hover:bg-gray-50 flex items-center"
          >
            Retour à l&apos;événement
          </Link>
        </div>

        <div className="space-y-6">
          {categories.length === 0 ? (
            <div className="text-center text-neutral-500 py-8">
              Aucun item trouvé pour cet événement
            </div>
          ) : (
            categories.map(category => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">{category.name}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleCategory(category.id, true)}
                      disabled={updating === category.id}
                      className="h-8 px-3 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Activer tout
                    </button>
                    <button
                      onClick={() => toggleCategory(category.id, false)}
                      disabled={updating === category.id}
                      className="h-8 px-3 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Désactiver tout
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {category.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <span className="text-sm">{item.name}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => toggleItem(item.id, e.target.checked)}
                          disabled={updating === item.id}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </AdminGate>
  );
}
