-- Test de la fonction admin_delete_event
-- Ce script teste que la fonction fonctionne correctement

-- 1. Créer un événement de test
INSERT INTO public.events (name, slug, join_code, kitchen_code, starts_at, ends_at)
VALUES ('Test Event', 'test-event', 'TEST1', 'KITCHEN1', '2024-12-01 10:00:00', '2024-12-01 18:00:00')
RETURNING id;

-- 2. Vérifier que l'événement existe
SELECT id, name, slug FROM public.events WHERE slug = 'test-event';

-- 3. Tester la fonction admin_delete_event
-- Remplacez l'UUID par celui retourné par l'insertion ci-dessus
-- SELECT public.admin_delete_event('UUID-DE-L-EVENT');

-- 4. Vérifier que l'événement a été supprimé
-- SELECT id, name, slug FROM public.events WHERE slug = 'test-event';
