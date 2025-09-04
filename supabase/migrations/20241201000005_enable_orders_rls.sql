-- Migration pour activer RLS sur orders et appliquer les politiques
-- Cette migration doit être exécutée manuellement en production

-- 1. Activer RLS sur la table orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS orders_select_policy ON public.orders;
DROP POLICY IF EXISTS orders_update_policy ON public.orders;
DROP POLICY IF EXISTS orders_insert_policy ON public.orders;

-- 3. Créer les nouvelles politiques
CREATE POLICY orders_select_policy
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY orders_update_policy
  ON public.orders
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY orders_insert_policy
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'orders' AND schemaname = 'public';

-- 5. Recharger le schéma PostgREST
SELECT pg_notify('pgrst', 'reload schema');
