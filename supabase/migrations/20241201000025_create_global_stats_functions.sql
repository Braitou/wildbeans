-- Migration pour créer les fonctions RPC des statistiques globales
-- Ces fonctions agrègent les données de TOUS les événements

-- 1. Totaux globaux avec KPIs avancés
create or replace function public.admin_global_totals()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result json;
  v_total_orders bigint;
  v_total_drinks bigint;
  v_unique_customers bigint;
  v_events_count bigint;
  v_drinks_with_options bigint;
  v_barista_orders bigint;
begin
  -- Compter les commandes totales
  select count(*) into v_total_orders from orders;
  
  -- Compter les boissons totales
  select count(*) into v_total_drinks from order_items;
  
  -- Compter les clients uniques (basé sur customer_name)
  select count(distinct customer_name) into v_unique_customers
  from orders
  where customer_name is not null and customer_name != '';
  
  -- Compter les événements
  select count(*) into v_events_count from events;
  
  -- Compter les boissons avec au moins 1 option (personnalisées)
  select count(distinct oi.id) into v_drinks_with_options
  from order_items oi
  where exists (
    select 1 from order_item_options oio
    where oio.order_item_id = oi.id
  );
  
  -- Compter les commandes barista (customer_name = 'Comptoir')
  select count(*) into v_barista_orders
  from orders
  where customer_name = 'Comptoir';
  
  -- Construire le résultat
  select json_build_object(
    'total_orders', v_total_orders,
    'total_drinks', v_total_drinks,
    'unique_customers', v_unique_customers,
    'events_count', v_events_count,
    'avg_per_order', case when v_total_orders > 0 
      then round(v_total_drinks::numeric / v_total_orders::numeric, 2)
      else 0 end,
    'customization_rate', case when v_total_drinks > 0
      then round((v_drinks_with_options::numeric / v_total_drinks::numeric) * 100, 1)
      else 0 end,
    'barista_percentage', case when v_total_orders > 0
      then round((v_barista_orders::numeric / v_total_orders::numeric) * 100, 1)
      else 0 end,
    'client_percentage', case when v_total_orders > 0
      then round(((v_total_orders - v_barista_orders)::numeric / v_total_orders::numeric) * 100, 1)
      else 0 end
  ) into v_result;
  
  return v_result;
end;
$$;

-- 2. Breakdown des boissons globales (top boissons tous événements)
create or replace function public.admin_global_drinks_breakdown()
returns table(
  item_name text,
  category_name text,
  total_qty bigint,
  percentage numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_drinks bigint;
begin
  -- Compter le total de boissons
  select count(*) into v_total_drinks from order_items;
  
  return query
  select 
    oi.item_name,
    coalesce(c.name, 'Autre') as category_name,
    count(*)::bigint as total_qty,
    case when v_total_drinks > 0
      then round((count(*)::numeric / v_total_drinks::numeric) * 100, 2)
      else 0 end as percentage
  from order_items oi
  left join items i on i.name = oi.item_name
  left join categories c on c.id = i.category_id
  group by oi.item_name, c.name
  order by total_qty desc;
end;
$$;

-- 3. Breakdown des options globales
create or replace function public.admin_global_options_breakdown()
returns table(
  option_name text,
  total_qty bigint,
  percentage numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_options bigint;
begin
  -- Compter le total d'options
  select count(*) into v_total_options from order_item_options;
  
  return query
  select 
    oio.option_name,
    count(*)::bigint as total_qty,
    case when v_total_options > 0
      then round((count(*)::numeric / v_total_options::numeric) * 100, 2)
      else 0 end as percentage
  from order_item_options oio
  where oio.option_name is not null and oio.option_name != ''
  group by oio.option_name
  order by total_qty desc;
end;
$$;

-- 4. Résumé par événement
create or replace function public.admin_global_events_summary()
returns table(
  event_id uuid,
  event_name text,
  event_slug text,
  orders_count bigint,
  drinks_count bigint,
  customers_count bigint,
  top_drink text,
  top_drink_count bigint,
  event_date timestamptz,
  is_closed boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with event_stats as (
    select 
      e.id as event_id,
      e.name as event_name,
      e.slug as event_slug,
      count(distinct o.id)::bigint as orders_count,
      count(oi.id)::bigint as drinks_count,
      count(distinct o.customer_name)::bigint as customers_count,
      e.starts_at as event_date,
      e.is_closed
    from events e
    left join orders o on o.event_id = e.id
    left join order_items oi on oi.order_id = o.id
    group by e.id, e.name, e.slug, e.starts_at, e.is_closed
  ),
  top_drinks as (
    select distinct on (e.id)
      e.id as event_id,
      oi.item_name,
      count(*) as drink_count
    from events e
    left join orders o on o.event_id = e.id
    left join order_items oi on oi.order_id = o.id
    where oi.item_name is not null
    group by e.id, oi.item_name
    order by e.id, count(*) desc
  )
  select 
    es.event_id,
    es.event_name,
    es.event_slug,
    es.orders_count,
    es.drinks_count,
    es.customers_count,
    td.item_name as top_drink,
    td.drink_count as top_drink_count,
    es.event_date,
    es.is_closed
  from event_stats es
  left join top_drinks td on td.event_id = es.event_id
  order by es.event_date desc nulls last;
end;
$$;

-- 5. Timeline mensuelle
create or replace function public.admin_global_timeline()
returns table(
  month integer,
  year integer,
  month_label text,
  orders_count bigint,
  drinks_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    extract(month from o.created_at)::integer as month,
    extract(year from o.created_at)::integer as year,
    to_char(o.created_at, 'Mon YYYY') as month_label,
    count(distinct o.id)::bigint as orders_count,
    count(oi.id)::bigint as drinks_count
  from orders o
  left join order_items oi on oi.order_id = o.id
  group by extract(month from o.created_at), extract(year from o.created_at), to_char(o.created_at, 'Mon YYYY')
  order by year, month;
end;
$$;

-- 6. Distribution par catégorie (Coffee vs Non-Coffee)
create or replace function public.admin_global_category_distribution()
returns table(
  category_name text,
  total_qty bigint,
  percentage numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_drinks bigint;
begin
  select count(*) into v_total_drinks from order_items;
  
  return query
  select 
    coalesce(c.name, 'Autre') as category_name,
    count(*)::bigint as total_qty,
    case when v_total_drinks > 0
      then round((count(*)::numeric / v_total_drinks::numeric) * 100, 2)
      else 0 end as percentage
  from order_items oi
  left join items i on i.name = oi.item_name
  left join categories c on c.id = i.category_id
  group by c.name
  order by total_qty desc;
end;
$$;

-- 7. Distribution horaire globale (heures de pointe)
create or replace function public.admin_global_hourly_distribution()
returns table(
  hour integer,
  total_orders bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    extract(hour from o.created_at)::integer as hour,
    count(*)::bigint as total_orders
  from orders o
  group by extract(hour from o.created_at)
  order by hour;
end;
$$;

-- Autorisations
grant execute on function public.admin_global_totals() to authenticated;
grant execute on function public.admin_global_drinks_breakdown() to authenticated;
grant execute on function public.admin_global_options_breakdown() to authenticated;
grant execute on function public.admin_global_events_summary() to authenticated;
grant execute on function public.admin_global_timeline() to authenticated;
grant execute on function public.admin_global_category_distribution() to authenticated;
grant execute on function public.admin_global_hourly_distribution() to authenticated;

-- Recharger le cache PostgREST
notify pgrst, 'reload schema';

