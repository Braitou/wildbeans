-- Test complet des fonctions RPC
-- Ce script teste toutes les fonctions créées

-- 1. Créer des données de test
INSERT INTO public.events (name, slug, join_code, kitchen_code, starts_at, ends_at)
VALUES 
  ('Event Test 1', 'event-test-1', 'TEST1', 'KITCHEN1', '2024-12-01 10:00:00', '2024-12-01 18:00:00'),
  ('Event Test 2', 'event-test-2', 'TEST2', 'KITCHEN2', '2024-12-01 11:00:00', '2024-12-01 19:00:00')
RETURNING id, name, slug;

-- 2. Tester admin_list_events
SELECT 'Testing admin_list_events:' as test_name;
SELECT * FROM public.admin_list_events();

-- 3. Tester admin_delete_event
SELECT 'Testing admin_delete_event:' as test_name;
-- Récupérer l'ID du premier événement
DO $$
DECLARE
  event_id uuid;
BEGIN
  SELECT id INTO event_id FROM public.events WHERE slug = 'event-test-1' LIMIT 1;
  IF event_id IS NOT NULL THEN
    PERFORM public.admin_delete_event(event_id);
    RAISE NOTICE 'Event % deleted successfully', event_id;
  ELSE
    RAISE NOTICE 'No event found to delete';
  END IF;
END $$;

-- 4. Vérifier que l'événement a été supprimé
SELECT 'Verifying deletion:' as test_name;
SELECT id, name, slug FROM public.events WHERE slug = 'event-test-1';

-- 5. Tester admin_close_event
SELECT 'Testing admin_close_event:' as test_name;
DO $$
DECLARE
  event_id uuid;
BEGIN
  SELECT id INTO event_id FROM public.events WHERE slug = 'event-test-2' LIMIT 1;
  IF event_id IS NOT NULL THEN
    PERFORM public.admin_close_event(event_id);
    RAISE NOTICE 'Event % closed successfully', event_id;
  ELSE
    RAISE NOTICE 'No event found to close';
  END IF;
END $$;

-- 6. Vérifier que l'événement a été fermé
SELECT 'Verifying closure:' as test_name;
SELECT id, name, slug, is_closed FROM public.events WHERE slug = 'event-test-2';

-- 7. Nettoyer les données de test
DELETE FROM public.events WHERE slug IN ('event-test-1', 'event-test-2');
