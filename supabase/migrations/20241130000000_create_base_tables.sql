-- Migration initiale pour créer les tables de base
-- Créer la table events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  join_code text not null,
  kitchen_code text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_closed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Créer la table orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  customer_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Créer la table menu_categories
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Créer la table menu_items
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.menu_categories(id) on delete cascade,
  price numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Créer la table menu_options
create table if not exists public.menu_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Créer la table order_items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete cascade,
  price numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Créer la table order_item_options
create table if not exists public.order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references public.order_items(id) on delete cascade,
  menu_option_id uuid references public.menu_options(id) on delete cascade,
  created_at timestamptz default now()
);

-- Créer la table event_items (pour activer/désactiver des items par event)
create table if not exists public.event_items (
  event_id uuid references public.events(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete cascade,
  enabled boolean default true,
  primary key (event_id, menu_item_id)
);

-- Insérer quelques données de test pour les catégories et items
insert into public.menu_categories (name) values 
  ('Cafés') on conflict do nothing;

insert into public.menu_items (name, category_id, price) 
select 'Espresso', id, 2.50 from public.menu_categories where name = 'Cafés'
on conflict do nothing;

-- Créer la fonction admin_list_events
create or replace function public.admin_list_events()
returns table(
  id uuid,
  name text,
  slug text,
  join_code text,
  kitchen_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_closed boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    e.id,
    e.name,
    e.slug,
    e.join_code,
    e.kitchen_code,
    e.starts_at,
    e.ends_at,
    e.is_closed
  from events e
  order by e.created_at desc;
end;
$$;

-- Autorisations
grant execute on function public.admin_list_events() to anon, authenticated;
grant all on public.events to anon, authenticated;
grant all on public.orders to anon, authenticated;
grant all on public.menu_categories to anon, authenticated;
grant all on public.menu_items to anon, authenticated;
grant all on public.menu_options to anon, authenticated;
grant all on public.order_items to anon, authenticated;
grant all on public.order_item_options to anon, authenticated;
grant all on public.event_items to anon, authenticated;
