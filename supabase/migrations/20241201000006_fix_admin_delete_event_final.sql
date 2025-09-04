-- Migration finale pour corriger admin_delete_event
-- Supprime toutes les variantes existantes pour repartir propre
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'admin_delete_event'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s;', r.sig);
  END LOOP;
END$$;

-- Recrée la fonction avec L'ARGUMENT EXACT: event_id
create or replace function public.admin_delete_event(event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si vous n'avez pas de cascades en base et qu'il y a des FK, décommentez et adaptez :
  -- delete from order_item_options using order_items oi
  --   where order_item_options.order_item_id = oi.id
  --   and oi.order_id in (select id from orders where event_id = admin_delete_event.event_id);
  -- delete from order_items where order_id in (select id from orders where event_id = admin_delete_event.event_id);
  -- delete from orders where event_id = admin_delete_event.event_id;

  delete from public.events where id = admin_delete_event.event_id;
end;
$$;

-- Autorisations + reload du cache
grant execute on function public.admin_delete_event(uuid) to anon, authenticated;
notify pgrst, 'reload schema';

