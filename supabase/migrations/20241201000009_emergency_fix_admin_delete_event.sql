-- Migration d'urgence pour corriger admin_delete_event
-- Force la suppression et recréation de la fonction

-- 1. Supprimer TOUTES les variantes existantes
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
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE;', r.sig);
    RAISE NOTICE 'Dropped function: %', r.sig;
  END LOOP;
END$$;

-- 2. Recréer la fonction avec le paramètre EXACT
CREATE OR REPLACE FUNCTION public.admin_delete_event(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.events WHERE id = admin_delete_event.event_id;
END;
$$;

-- 3. Permissions
GRANT EXECUTE ON FUNCTION public.admin_delete_event(uuid) TO anon, authenticated;

-- 4. Forcer le rechargement du cache PostgREST
NOTIFY pgrst, 'reload schema';

-- 5. Attendre un peu pour que le cache se recharge
SELECT pg_sleep(2);

-- 6. Vérification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'admin_delete_event' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND pg_get_function_identity_arguments(oid) = 'event_id uuid'
  ) THEN
    RAISE NOTICE 'Function admin_delete_event(event_id uuid) created successfully';
  ELSE
    RAISE EXCEPTION 'Function admin_delete_event(event_id uuid) was not created properly';
  END IF;
END$$;
