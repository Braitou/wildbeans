-- Script pour forcer le rechargement du cache PostgREST
-- À exécuter dans Supabase Studio SQL Editor

-- 1. Vérifier que la fonction existe
SELECT '=== VÉRIFICATION DE LA FONCTION ===' as info;
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'admin_delete_event' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Forcer le rechargement du cache PostgREST
SELECT '=== RECHARGEMENT DU CACHE ===' as info;
NOTIFY pgrst, 'reload schema';

-- 3. Attendre que le cache se recharge
SELECT '=== ATTENTE DU RECHARGEMENT ===' as info;
SELECT pg_sleep(3);

-- 4. Test direct de la fonction
SELECT '=== TEST DIRECT ===' as info;
-- Créer un événement de test
INSERT INTO public.events (name, slug, join_code, kitchen_code, starts_at, ends_at)
VALUES ('Test Cache', 'test-cache', 'TEST1', 'KITCHEN1', '2024-12-01 10:00:00', '2024-12-01 18:00:00')
RETURNING id;

-- Tester la suppression
DO $$
DECLARE
  test_event_id uuid;
BEGIN
  SELECT id INTO test_event_id FROM public.events WHERE slug = 'test-cache' LIMIT 1;
  IF test_event_id IS NOT NULL THEN
    PERFORM public.admin_delete_event(test_event_id);
    RAISE NOTICE 'Direct test successful: Event % deleted', test_event_id;
  ELSE
    RAISE NOTICE 'No test event found';
  END IF;
END$$;

-- 5. Vérifier que l'événement a été supprimé
SELECT '=== VÉRIFICATION DE LA SUPPRESSION ===' as info;
SELECT id, name, slug FROM public.events WHERE slug = 'test-cache';
