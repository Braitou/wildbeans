-- Migration pour activer RLS sur event_items avec accès SELECT public uniquement
-- Cette migration corrige l'avertissement Supabase concernant la table event_items

-- Activer RLS sur la table event_items
ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture publique (SELECT)
-- Le menu doit rester accessible aux clients pour l'affichage
CREATE POLICY "event_items_select_public"
ON public.event_items
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: Pas de politiques pour INSERT/UPDATE/DELETE
-- Avec RLS activé et aucune politique pour ces opérations, elles sont automatiquement refusées
-- pour les utilisateurs anon/authenticated, ce qui est le comportement souhaité

-- Vérifier que RLS est bien activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'event_items' AND schemaname = 'public';

-- Recharger le schéma PostgREST pour appliquer les changements
SELECT pg_notify('pgrst', 'reload schema');
