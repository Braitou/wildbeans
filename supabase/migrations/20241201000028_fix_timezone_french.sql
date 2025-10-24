-- Fix timezone : toutes les heures doivent être en heure française (Europe/Paris)
-- Correction pour admin_event_hourly_heatmap, admin_event_peak_analysis, admin_global_hourly_distribution

-- 1. Corriger admin_event_hourly_heatmap (heatmap horaire événement)
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
    extract(hour from (o.created_at AT TIME ZONE 'Europe/Paris'))::integer as hour,
    count(distinct o.id)::bigint as orders_count,
    count(oi.id)::bigint as drinks_count
  from orders o
  left join order_items oi on oi.order_id = o.id
  where o.event_id = admin_event_hourly_heatmap.event_id
  group by extract(hour from (o.created_at AT TIME ZONE 'Europe/Paris'))
  order by hour;
end;
$$;

-- 2. Corriger admin_event_peak_analysis (heure de pointe événement)
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
  -- Trouver l'heure de pointe (en heure française)
  select 
    extract(hour from (created_at AT TIME ZONE 'Europe/Paris'))::integer,
    count(*)
  into v_peak_hour, v_peak_count
  from orders
  where event_id = admin_event_peak_analysis.event_id
  group by extract(hour from (created_at AT TIME ZONE 'Europe/Paris'))
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

-- 3. Corriger admin_global_hourly_distribution (distribution horaire globale)
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
    extract(hour from (o.created_at AT TIME ZONE 'Europe/Paris'))::integer as hour,
    count(*)::bigint as total_orders
  from orders o
  group by extract(hour from (o.created_at AT TIME ZONE 'Europe/Paris'))
  order by hour;
end;
$$;

-- Recharger le cache PostgREST
notify pgrst, 'reload schema';

