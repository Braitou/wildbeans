import { supabase } from '@/lib/supabase';
import Builder from './Builder';
import type { Item, Modifier, ModifierOption } from '@/types/menu';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
  searchParams,
}: { params: { slug: string }, searchParams: { join?: string } }) {
  const slug = params.slug;
  const joinCode = searchParams.join ?? 'WB1';

  // 1) Catégories
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

  // 3) Liaisons item -> modifiers
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

  // 5) Construction Category[] -> Item[] -> Modifier[] -> Option[]
  const modById = new Map(modifiers?.map(m => [m.id, { ...m, options: [] as ModifierOption[] }]) ?? []);
  for (const opt of options ?? []) {
    const m = modById.get(opt.modifier_id);
    if (m) m.options.push({ id: opt.id, name: opt.name });
  }

  const itemsByCat = new Map<string, Item[]>();
  for (const it of items ?? []) {
    const mods = (itemMods ?? [])
      .filter(im => im.item_id === it.id)
      .map(im => modById.get(im.modifier_id))
      .filter(Boolean) as Modifier[];

    const itemFull: Item = {
      id: it.id, name: it.name, description: it.description ?? null,
      modifiers: mods,
    };

    if (!itemsByCat.has(it.category_id)) itemsByCat.set(it.category_id, []);
    itemsByCat.get(it.category_id)!.push(itemFull);
  }

  const cats = (categories ?? []).map(c => ({
    id: c.id,
    name: c.name,
    items: (itemsByCat.get(c.id) ?? []),
  }));

  return (
    <main className="font-sans">
      <h1 className="mt-8 mb-6 text-center text-sm font-semibold tracking-[0.22em] uppercase">
        BE WILD… ORDER SOMETHING !
      </h1>
      <Builder slug={slug} joinCode={joinCode} categories={cats} />
    </main>
  );
}
