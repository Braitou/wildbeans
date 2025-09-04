-- Migration pour corriger admin_close_event et harmoniser les paramètres
-- Supprime toutes les variantes existantes pour repartir propre
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'admin_close_event'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s;', r.sig);
  END LOOP;
END$$;

-- Recrée la fonction avec L'ARGUMENT EXACT: event_id
create or replace function public.admin_close_event(event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.events
  set is_closed = true
  where id = admin_close_event.event_id;
end;
$$;

-- Autorisations + reload du cache
grant execute on function public.admin_close_event(uuid) to anon, authenticated;
notify pgrst, 'reload schema';

