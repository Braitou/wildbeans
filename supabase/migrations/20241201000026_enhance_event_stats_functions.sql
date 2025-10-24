-- Migration pour améliorer les fonctions de statistiques par événement
-- Ajoute des KPIs avancés : personnalisation, heures de pointe, vitesse, ratio barista/client

-- 1. Améliorer admin_event_totals avec les nouveaux KPIs
create or replace function public.admin_event_totals(event_id uuid)
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
  v_drinks_with_options bigint;
  v_barista_orders bigint;
  v_total_options bigint;
  v_min_time timestamptz;
  v_max_time timestamptz;
  v_avg_time_seconds numeric;
begin
  -- Compter les commandes
  select count(*) into v_total_orders
  from orders o
  where o.event_id = admin_event_totals.event_id;
  
  -- Compter les boissons
  select count(*) into v_total_drinks
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.event_id = admin_event_totals.event_id;
  
  -- Compter les clients uniques
  select count(distinct customer_name) into v_unique_customers
  from orders o
  where o.event_id = admin_event_totals.event_id
    and customer_name is not null
    and customer_name != '';
  
  -- Compter les boissons personnalisées
  select count(distinct oi.id) into v_drinks_with_options
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.event_id = admin_event_totals.event_id
    and exists (
      select 1 from order_item_options oio
      where oio.order_item_id = oi.id
    );
  
  -- Compter les commandes barista
  select count(*) into v_barista_orders
  from orders o
  where o.event_id = admin_event_totals.event_id
    and customer_name = 'Comptoir';
  
  -- Compter le total d'options
  select count(*) into v_total_options
  from order_item_options oio
  join order_items oi on oi.id = oio.order_item_id
  join orders o on o.id = oi.order_id
  where o.event_id = admin_event_totals.event_id;
  
  -- Calculer le temps moyen entre commandes
  select min(created_at), max(created_at) into v_min_time, v_max_time
  from orders o
  where o.event_id = admin_event_totals.event_id;
  
  if v_min_time is not null and v_max_time is not null and v_total_orders > 1 then
    v_avg_time_seconds := extract(epoch from (v_max_time - v_min_time)) / (v_total_orders - 1);
  else
    v_avg_time_seconds := 0;
  end if;
  
  -- Construire le résultat
  select json_build_object(
    'orders', v_total_orders,
    'drinks', v_total_drinks,
    'unique_customers', v_unique_customers,
    'avg_per_order', case when v_total_orders > 0
      then round(v_total_drinks::numeric / v_total_orders::numeric, 2)
      else 0 end,
    'avg_options_per_drink', case when v_total_drinks > 0
      then round(v_total_options::numeric / v_total_drinks::numeric, 2)
      else 0 end,
    'customization_rate', case when v_total_drinks > 0
      then round((v_drinks_with_options::numeric / v_total_drinks::numeric) * 100, 1)
      else 0 end,
    'barista_percentage', case when v_total_orders > 0
      then round((v_barista_orders::numeric / v_total_orders::numeric) * 100, 1)
      else 0 end,
    'client_percentage', case when v_total_orders > 0
      then round(((v_total_orders - v_barista_orders)::numeric / v_total_orders::numeric) * 100, 1)
      else 0 end,
    'avg_time_between_orders_minutes', round(v_avg_time_seconds / 60, 1),
    'period', json_build_object(
      'from', v_min_time,
      'to', v_max_time
    )
  ) into v_result;
  
  return v_result;
end;
$$;

-- 2. Détails de personnalisation par boisson
create or replace function public.admin_event_customization_details(event_id uuid)
returns table(
  drink_name text,
  total_count bigint,
  with_options bigint,
  customization_rate numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    oi.item_name as drink_name,
    count(*)::bigint as total_count,
    count(distinct case when exists (
      select 1 from order_item_options oio
      where oio.order_item_id = oi.id
    ) then oi.id end)::bigint as with_options,
    case when count(*) > 0
      then round((count(distinct case when exists (
        select 1 from order_item_options oio
        where oio.order_item_id = oi.id
      ) then oi.id end)::numeric / count(*)::numeric) * 100, 1)
      else 0 end as customization_rate
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.event_id = admin_event_customization_details.event_id
  group by oi.item_name
  order by total_count desc;
end;
$$;

-- 3. Analyse des heures de pointe
create or replace function public.admin_event_peak_analysis(event_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result json;
  v_peak_hour integer;
  v_peak_count bigint;
  v_avg_time_seconds numeric;
begin
  -- Trouver l'heure de pointe
  select 
    extract(hour from created_at)::integer,
    count(*)
  into v_peak_hour, v_peak_count
  from orders
  where event_id = admin_event_peak_analysis.event_id
  group by extract(hour from created_at)
  order by count(*) desc
  limit 1;
  
  -- Calculer le temps moyen entre commandes (en secondes)
  with time_diffs as (
    select 
      created_at - lag(created_at) over (order by created_at) as diff
    from orders
    where event_id = admin_event_peak_analysis.event_id
  )
  select avg(extract(epoch from diff))
  into v_avg_time_seconds
  from time_diffs
  where diff is not null;
  
  select json_build_object(
    'peak_hour', coalesce(v_peak_hour, 0),
    'peak_count', coalesce(v_peak_count, 0),
    'avg_time_between_orders_seconds', coalesce(v_avg_time_seconds, 0),
    'avg_time_between_orders_minutes', round(coalesce(v_avg_time_seconds, 0) / 60, 1)
  ) into v_result;
  
  return v_result;
end;
$$;

-- 4. Corrélation options par boisson (quelles options sont populaires pour quelle boisson)
create or replace function public.admin_event_drink_options_correlation(event_id uuid)
returns table(
  drink_name text,
  option_name text,
  count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    oi.item_name as drink_name,
    oio.option_name,
    count(*)::bigint as count
  from order_items oi
  join orders o on o.id = oi.order_id
  join order_item_options oio on oio.order_item_id = oi.id
  where o.event_id = admin_event_drink_options_correlation.event_id
    and oio.option_name is not null
    and oio.option_name != ''
  group by oi.item_name, oio.option_name
  order by oi.item_name, count desc;
end;
$$;

-- 5. Heatmap horaire (distribution des commandes par heure)
create or replace function public.admin_event_hourly_heatmap(event_id uuid)
returns table(
  hour integer,
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
    extract(hour from o.created_at)::integer as hour,
    count(distinct o.id)::bigint as orders_count,
    count(oi.id)::bigint as drinks_count
  from orders o
  left join order_items oi on oi.order_id = o.id
  where o.event_id = admin_event_hourly_heatmap.event_id
  group by extract(hour from o.created_at)
  order by hour;
end;
$$;

-- Autorisations
grant execute on function public.admin_event_totals(uuid) to authenticated;
grant execute on function public.admin_event_customization_details(uuid) to authenticated;
grant execute on function public.admin_event_peak_analysis(uuid) to authenticated;
grant execute on function public.admin_event_drink_options_correlation(uuid) to authenticated;
grant execute on function public.admin_event_hourly_heatmap(uuid) to authenticated;

-- Recharger le cache PostgREST
notify pgrst, 'reload schema';

