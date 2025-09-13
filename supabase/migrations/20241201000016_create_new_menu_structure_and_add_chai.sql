-- Migration pour créer la nouvelle structure de menu et ajouter CHAI
-- Cette migration crée les nouvelles tables et migre les données existantes

-- 1. Créer les nouvelles tables
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete cascade,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.modifiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('single', 'multi')),
  required boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  modifier_id uuid references public.modifiers(id) on delete cascade,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.item_modifiers (
  item_id uuid references public.items(id) on delete cascade,
  modifier_id uuid references public.modifiers(id) on delete cascade,
  primary key (item_id, modifier_id)
);

-- 2. Insérer les catégories de base
insert into public.categories (name, sort_order) values 
  ('Cafés', 1),
  ('Non-coffee', 2)
on conflict do nothing;

-- 3. Insérer les modifiers de base (options communes)
insert into public.modifiers (name, type, required) values 
  ('Taille', 'single', true),
  ('Type de lait', 'single', false),
  ('Sucre', 'single', false),
  ('Extras', 'multi', false)
on conflict do nothing;

-- 4. Insérer les options pour chaque modifier
-- Options de taille
insert into public.modifier_options (name, modifier_id, sort_order)
select 'Petit', id, 1 from public.modifiers where name = 'Taille'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Moyen', id, 2 from public.modifiers where name = 'Taille'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Grand', id, 3 from public.modifiers where name = 'Taille'
on conflict do nothing;

-- Options de type de lait
insert into public.modifier_options (name, modifier_id, sort_order)
select 'Lait entier', id, 1 from public.modifiers where name = 'Type de lait'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Lait écrémé', id, 2 from public.modifiers where name = 'Type de lait'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Lait d''amande', id, 3 from public.modifiers where name = 'Type de lait'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Lait d''avoine', id, 4 from public.modifiers where name = 'Type de lait'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Lait de coco', id, 5 from public.modifiers where name = 'Type de lait'
on conflict do nothing;

-- Options de sucre
insert into public.modifier_options (name, modifier_id, sort_order)
select 'Sans sucre', id, 1 from public.modifiers where name = 'Sucre'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select '1 sucre', id, 2 from public.modifiers where name = 'Sucre'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select '2 sucres', id, 3 from public.modifiers where name = 'Sucre'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Édulcorant', id, 4 from public.modifiers where name = 'Sucre'
on conflict do nothing;

-- Options d'extras
insert into public.modifier_options (name, modifier_id, sort_order)
select 'Chantilly', id, 1 from public.modifiers where name = 'Extras'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Cannelle', id, 2 from public.modifiers where name = 'Extras'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Chocolat', id, 3 from public.modifiers where name = 'Extras'
on conflict do nothing;

insert into public.modifier_options (name, modifier_id, sort_order)
select 'Caramel', id, 4 from public.modifiers where name = 'Extras'
on conflict do nothing;

-- 5. Insérer les boissons de base
-- Cafés
insert into public.items (name, description, category_id, sort_order)
select 'Espresso', 'Café court et intense', id, 1 from public.categories where name = 'Cafés'
on conflict do nothing;

insert into public.items (name, description, category_id, sort_order)
select 'Americano', 'Espresso allongé avec de l''eau chaude', id, 2 from public.categories where name = 'Cafés'
on conflict do nothing;

insert into public.items (name, description, category_id, sort_order)
select 'Cappuccino', 'Espresso avec lait moussé', id, 3 from public.categories where name = 'Cafés'
on conflict do nothing;

insert into public.items (name, description, category_id, sort_order)
select 'Latte', 'Espresso avec beaucoup de lait chaud', id, 4 from public.categories where name = 'Cafés'
on conflict do nothing;

-- Non-coffee
insert into public.items (name, description, category_id, sort_order)
select 'Thé', 'Thé noir, vert ou aux fruits', id, 1 from public.categories where name = 'Non-coffee'
on conflict do nothing;

insert into public.items (name, description, category_id, sort_order)
select 'Chocolat chaud', 'Chocolat chaud crémeux', id, 2 from public.categories where name = 'Non-coffee'
on conflict do nothing;

insert into public.items (name, description, category_id, sort_order)
select 'Chai', 'Thé épicé aux saveurs indiennes', id, 3 from public.categories where name = 'Non-coffee'
on conflict do nothing;

-- 6. Associer les modifiers aux items
-- Tous les items ont les mêmes modifiers de base
insert into public.item_modifiers (item_id, modifier_id)
select i.id, m.id 
from public.items i, public.modifiers m
on conflict do nothing;

-- 7. Autorisations
grant all on public.categories to anon, authenticated;
grant all on public.items to anon, authenticated;
grant all on public.modifiers to anon, authenticated;
grant all on public.modifier_options to anon, authenticated;
grant all on public.item_modifiers to anon, authenticated;
