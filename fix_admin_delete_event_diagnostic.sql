-- Script de diagnostic et correction pour admin_delete_event
-- À exécuter dans Supabase Studio SQL Editor

-- 1. Vérifier les fonctions existantes
SELECT '=== FONCTIONS EXISTANTES ===' as info;
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname LIKE '%admin_delete%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Supprimer toutes les variantes de admin_delete_event
SELECT '=== SUPPRESSION DES ANCIENNES FONCTIONS ===' as info;
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

-- 3. Recréer la fonction avec le bon paramètre
SELECT '=== CRÉATION DE LA NOUVELLE FONCTION ===' as info;
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

-- 4. Accorder les permissions
SELECT '=== ACCORD DES PERMISSIONS ===' as info;
GRANT EXECUTE ON FUNCTION public.admin_delete_event(uuid) TO anon, authenticated;

-- 5. Forcer le rechargement du cache PostgREST
SELECT '=== RECHARGEMENT DU CACHE ===' as info;
NOTIFY pgrst, 'reload schema';

-- 6. Vérifier que la fonction existe maintenant
SELECT '=== VÉRIFICATION FINALE ===' as info;
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'admin_delete_event' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. Test de la fonction
SELECT '=== TEST DE LA FONCTION ===' as info;
-- Créer un événement de test
INSERT INTO public.events (name, slug, join_code, kitchen_code, starts_at, ends_at)
VALUES ('Test Delete', 'test-delete', 'TEST1', 'KITCHEN1', '2024-12-01 10:00:00', '2024-12-01 18:00:00')
RETURNING id;

-- Récupérer l'ID et tester la suppression
DO $$
DECLARE
  test_event_id uuid;
BEGIN
  SELECT id INTO test_event_id FROM public.events WHERE slug = 'test-delete' LIMIT 1;
  IF test_event_id IS NOT NULL THEN
    PERFORM public.admin_delete_event(test_event_id);
    RAISE NOTICE 'Test successful: Event % deleted', test_event_id;
  ELSE
    RAISE NOTICE 'No test event found';
  END IF;
END$$;
