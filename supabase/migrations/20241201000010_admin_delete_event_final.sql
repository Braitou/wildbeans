-- Drop toutes les variantes existantes (si présentes) pour repartir propre
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

-- Recréation de la fonction DANS le schéma public
-- NOTE: nom de l'argument EXACT = event_id
create or replace function public.admin_delete_event(event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si vous n'avez pas de cascades et qu'il existe des FKs, supprimer d'abord les dépendances ici.
  -- Exemple (décommentez/ajustez selon votre schéma) :
  -- delete from order_item_options using order_items oi
  --   where order_item_options.order_item_id = oi.id
  --   and oi.order_id in (select id from orders where event_id = admin_delete_event.event_id);
  -- delete from order_items
  --   where order_id in (select id from orders where event_id = admin_delete_event.event_id);
  -- delete from orders
  --   where event_id = admin_delete_event.event_id;

  delete from public.events
  where id = admin_delete_event.event_id;
end;
$$;

-- Permissions exécution
grant execute on function public.admin_delete_event(uuid) to anon, authenticated;

-- Rechargement du cache PostgREST pour que la RPC soit visible
notify pgrst, 'reload schema';
