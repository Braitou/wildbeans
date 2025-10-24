import AdminGate from '@/components/auth/AdminGate';
import BaristaOrderClient from '@/components/order/BaristaOrderClient';
import { createClient } from '@/lib/supabase/server';

export default async function BaristaOrderPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const supabase = await createClient();

  // Charger les catégories et items depuis Supabase
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, sort_order')
    .order('sort_order');

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, name, category_id, is_active')
    .eq('is_active', true)
    .order('sort_order');

  // Charger les modifiers et leurs options
  const { data: modifiers, error: modifiersError } = await supabase
    .from('modifiers')
    .select(`
      id,
      name,
      type,
      required
    `)
    .order('id');

  const { data: modifierOptions, error: optionsError } = await supabase
    .from('modifier_options')
    .select('id, name, modifier_id, sort_order')
    .order('sort_order');

  if (categoriesError || itemsError || modifiersError || optionsError) {
    console.error('Erreur lors du chargement:', { categoriesError, itemsError, modifiersError, optionsError });
    return (
      <AdminGate>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-500 font-bold mb-2">Erreur lors du chargement du menu</p>
            <p className="text-sm text-gray-600">Veuillez réessayer plus tard</p>
          </div>
        </div>
      </AdminGate>
    );
  }

  // Transformer les données pour le format attendu
  const menuCategories = (categories || []).map(cat => {
    const categoryItems = (items || [])
      .filter(item => item.category_id === cat.id)
      .map(item => ({
        id: item.id,
        name: item.name,
        category: cat.name.toLowerCase().includes('café') || cat.name.toLowerCase().includes('coffee') 
          ? 'coffee' 
          : 'non-coffee'
      }));

    return {
      id: cat.id,
      name: cat.name,
      items: categoryItems
    };
  });

  const menuModifiers = (modifiers || []).map(mod => ({
    id: mod.id,
    name: mod.name,
    type: mod.type as 'single' | 'multi',
    required: mod.required,
    options: (modifierOptions || [])
      .filter(opt => opt.modifier_id === mod.id)
      .map(opt => ({
        id: opt.id,
        name: opt.name
      }))
  }));

  return (
    <AdminGate>
      <BaristaOrderClient
        eventId={eventId}
        categories={menuCategories}
        modifiers={menuModifiers}
      />
    </AdminGate>
  );
}

