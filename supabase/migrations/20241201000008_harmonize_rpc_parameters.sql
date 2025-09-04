-- Migration complète pour harmoniser tous les paramètres des fonctions RPC
-- Remplace p_event_id par event_id dans toutes les fonctions

-- 1. Corriger admin_event_totals
create or replace function public.admin_event_totals(event_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result json;
begin
  select json_build_object(
    'orders', count(distinct o.id),
    'drinks', count(oi.id),
    'unique_customers', count(distinct o.customer_name),
    'period', json_build_object(
      'from', min(o.created_at),
      'to', max(o.created_at)
    )
  ) into v_result
  from orders o
  left join order_items oi on oi.order_id = o.id
  where o.event_id = admin_event_totals.event_id;
  
  return v_result;
end;
$$;

-- 2. Corriger admin_event_items_breakdown
create or replace function public.admin_event_items_breakdown(event_id uuid)
returns table(
  item_name text,
  category_name text,
  quantity bigint,
  total_price numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    mi.name as item_name,
    mc.name as category_name,
    count(*) as quantity,
    sum(oi.price) as total_price
  from order_items oi
  join menu_items mi on mi.id = oi.menu_item_id
  join menu_categories mc on mc.id = mi.category_id
  join orders o on o.id = oi.order_id
  where o.event_id = admin_event_items_breakdown.event_id
  group by mi.name, mc.name
  order by quantity desc;
end;
$$;

-- 3. Corriger admin_event_categories_breakdown
create or replace function public.admin_event_categories_breakdown(event_id uuid)
returns table(
  category_name text,
  quantity bigint,
  total_price numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    mc.name as category_name,
    count(*) as quantity,
    sum(oi.price) as total_price
  from order_items oi
  join menu_items mi on mi.id = oi.menu_item_id
  join menu_categories mc on mc.id = mi.category_id
  join orders o on o.id = oi.order_id
  where o.event_id = admin_event_categories_breakdown.event_id
  group by mc.name
  order by quantity desc;
end;
$$;

-- 4. Corriger admin_event_options_breakdown
create or replace function public.admin_event_options_breakdown(event_id uuid)
returns table(
  option_name text,
  quantity bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    mo.name as option_name,
    count(*) as quantity
  from order_item_options oio
  join menu_options mo on mo.id = oio.menu_option_id
  join order_items oi on oi.id = oio.order_item_id
  join orders o on o.id = oi.order_id
  where o.event_id = admin_event_options_breakdown.event_id
  group by mo.name
  order by quantity desc;
end;
$$;

-- 5. Corriger admin_event_timeseries
create or replace function public.admin_event_timeseries(event_id uuid)
returns table(
  hour timestamp,
  orders bigint,
  drinks bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    date_trunc('hour', o.created_at) as hour,
    count(distinct o.id) as orders,
    count(oi.id) as drinks
  from orders o
  left join order_items oi on oi.order_id = o.id
  where o.event_id = admin_event_timeseries.event_id
  group by date_trunc('hour', o.created_at)
  order by hour;
end;
$$;

-- 6. Corriger admin_list_items_for_event
create or replace function public.admin_list_items_for_event(event_id uuid)
returns table(
  id uuid,
  name text,
  category_id uuid,
  category_name text,
  enabled boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    mi.id,
    mi.name,
    mi.category_id,
    mc.name as category_name,
    coalesce(ei.enabled, true) as enabled
  from menu_items mi
  join menu_categories mc on mc.id = mi.category_id
  left join event_items ei on ei.menu_item_id = mi.id and ei.event_id = admin_list_items_for_event.event_id
  order by mc.name, mi.name;
end;
$$;

-- 7. Corriger admin_set_item_enabled
create or replace function public.admin_set_item_enabled(
  event_id uuid,
  item_id uuid,
  enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into event_items (event_id, menu_item_id, enabled)
  values (admin_set_item_enabled.event_id, admin_set_item_enabled.item_id, admin_set_item_enabled.enabled)
  on conflict (event_id, menu_item_id)
  do update set enabled = admin_set_item_enabled.enabled;
end;
$$;

-- Autorisations pour toutes les fonctions
grant execute on function public.admin_event_totals(uuid) to anon, authenticated;
grant execute on function public.admin_event_items_breakdown(uuid) to anon, authenticated;
grant execute on function public.admin_event_categories_breakdown(uuid) to anon, authenticated;
grant execute on function public.admin_event_options_breakdown(uuid) to anon, authenticated;
grant execute on function public.admin_event_timeseries(uuid) to anon, authenticated;
grant execute on function public.admin_list_items_for_event(uuid) to anon, authenticated;
grant execute on function public.admin_set_item_enabled(uuid, uuid, boolean) to anon, authenticated;

-- Recharger le cache PostgREST
notify pgrst, 'reload schema';

