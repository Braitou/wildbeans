import AdminGate from '@/components/auth/AdminGate';
import BaristaOrderClient from '@/components/order/BaristaOrderClient';
import { createClient } from '@/lib/supabase/server';

export default async function BaristaOrderPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const supabase = await createClient();

  // Charger les catégories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, sort_order')
    .order('sort_order');

  // Charger les items
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, name, category_id, is_active')
    .eq('is_active', true)
    .order('sort_order');

  // Charger les liaisons item -> modifiers
  const { data: itemModifiers, error: itemModsError } = await supabase
    .from('item_modifiers')
    .select('item_id, modifier_id');

  // Charger les modifiers
  const { data: modifiers, error: modifiersError } = await supabase
    .from('modifiers')
    .select('id, name, type, required');

  // Charger les options des modifiers
  const { data: modifierOptions, error: optionsError } = await supabase
    .from('modifier_options')
    .select('id, name, modifier_id, sort_order')
    .order('sort_order');

  if (categoriesError || itemsError || itemModsError || modifiersError || optionsError) {
    console.error('Erreur lors du chargement:', { 
      categoriesError, itemsError, itemModsError, modifiersError, optionsError 
    });
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

  // Construire un Map des modifiers avec leurs options
  const modById = new Map(
    (modifiers || []).map(m => [
      m.id, 
      { 
        id: m.id,
        name: m.name,
        type: m.type as 'single' | 'multi',
        required: m.required,
        options: [] as { id: string; name: string }[]
      }
    ])
  );

  // Ajouter les options à leurs modifiers
  for (const opt of modifierOptions || []) {
    const mod = modById.get(opt.modifier_id);
    if (mod) {
      mod.options.push({ id: opt.id, name: opt.name });
    }
  }

  // Construire les items avec leurs modifiers
  const itemsByCat = new Map<string, any[]>();
  
  for (const item of items || []) {
    // Récupérer les modifiers associés à cet item
    const itemMods = (itemModifiers || [])
      .filter(im => im.item_id === item.id)
      .map(im => modById.get(im.modifier_id))
      .filter(Boolean);

    const category = categories?.find(cat => cat.id === item.category_id);
    const categoryName = category?.name.toLowerCase() || '';
    const isCoffee = categoryName.includes('café') || 
                     categoryName.includes('cafe') || 
                     categoryName.includes('coffee');
    
    const itemFull = {
      id: item.id,
      name: item.name,
      category: isCoffee ? 'coffee' : 'non-coffee',
      modifiers: itemMods
    };

    if (!itemsByCat.has(item.category_id)) {
      itemsByCat.set(item.category_id, []);
    }
    itemsByCat.get(item.category_id)!.push(itemFull);
  }

  // Transformer pour le format final
  const menuCategories = (categories || []).map(cat => ({
    id: cat.id,
    name: cat.name,
    items: itemsByCat.get(cat.id) || []
  }));

  return (
    <AdminGate>
      <BaristaOrderClient
        eventId={eventId}
        categories={menuCategories}
      />
    </AdminGate>
  );
}

