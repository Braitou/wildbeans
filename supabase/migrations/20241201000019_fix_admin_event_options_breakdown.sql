-- Migration pour corriger la fonction admin_event_options_breakdown
-- Utiliser la nouvelle structure avec option_name directement dans order_item_options

-- Corriger admin_event_options_breakdown pour utiliser la nouvelle structure
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
    oio.option_name,
    count(*) as quantity
  from order_item_options oio
  join order_items oi on oi.id = oio.order_item_id
  join orders o on o.id = oi.order_id
  where o.event_id = admin_event_options_breakdown.event_id
    and oio.option_name is not null
    and oio.option_name != ''
  group by oio.option_name
  order by quantity desc;
end;
$$;

-- Autorisation
grant execute on function public.admin_event_options_breakdown(uuid) to anon, authenticated;

-- Recharger le cache PostgREST
notify pgrst, 'reload schema';
