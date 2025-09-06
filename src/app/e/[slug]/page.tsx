import { supabase } from '@/lib/supabase';
import Builder from './Builder';
import type { Item, Modifier, ModifierOption } from '@/types/menu';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { join?: string };
}) {
  const { slug } = params;
  const joinCode = searchParams?.join ?? 'WB1';

  // 0) Event
  const { data: event } = await supabase
    .from('events')
    .select('id, name, slug, display_name, logo_url, join_code, kitchen_code')
    .eq('slug', slug)
    .single();

  // 1) Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order', { ascending: true });

  // 2) Items
  const { data: items } = await supabase
    .from('items')
    .select('id, name, description, category_id, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // 3) Links item -> modifiers
  const { data: itemMods } = await supabase
    .from('item_modifiers')
    .select('item_id, modifier_id');

  // 4) Modifiers + options
  const { data: modifiers } = await supabase
    .from('modifiers')
    .select('id, name, type, required');

  const { data: options } = await supabase
    .from('modifier_options')
    .select('id, name, modifier_id, sort_order')
    .order('sort_order', { ascending: true });

  // Build Modifier map with options
  const modById = new Map(
    (modifiers ?? []).map((m) => [m.id, { ...m, options: [] as ModifierOption[] }])
  );
  for (const opt of options ?? []) {
    const m = modById.get(opt.modifier_id);
    if (m) m.options.push({ id: opt.id, name: opt.name });
  }

  // Group items by category
  const itemsByCat = new Map<string, Item[]>();
  for (const it of items ?? []) {
    const mods = (itemMods ?? [])
      .filter((im) => im.item_id === it.id)
      .map((im) => modById.get(im.modifier_id))
      .filter(Boolean) as Modifier[];

    const itemFull: Item = {
      id: it.id,
      name: it.name,
      description: it.description ?? null,
      modifiers: mods,
    };

    if (!itemsByCat.has(it.category_id)) itemsByCat.set(it.category_id, []);
    itemsByCat.get(it.category_id)!.push(itemFull);
  }

  const cats = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    items: itemsByCat.get(c.id) ?? [],
  }));

  return (
    <main className="font-sans">
      <h1 className="mt-8 mb-6 text-center text-sm font-semibold tracking-[0.22em] uppercase">
        BE WILD… ORDER SOMETHING !
      </h1>

      {/* Event banner */}
      {event && (
        <div className="mt-4 flex items-center gap-4 px-4">
          <div className="relative w-20 h-20 shrink-0 border border-black rounded-none overflow-hidden">
            {event.logo_url ? (
              <img
                src={event.logo_url}
                alt={event.display_name || event.name || 'Event logo'}
                className="block w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs uppercase">
                No logo
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold leading-6 uppercase truncate">
              {event.display_name || event.name}
            </div>
          </div>
        </div>
      )}

      <Builder slug={slug} joinCode={joinCode} categories={cats} event={event} />
    </main>
  );
}
