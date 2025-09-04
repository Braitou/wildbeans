-- Migration pour corriger les politiques RLS sur orders et activer le Realtime

-- Vérifier si RLS est activé sur orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture des commandes (pour le statut client)
DROP POLICY IF EXISTS orders_select_policy ON public.orders;
CREATE POLICY orders_select_policy
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Politique pour permettre la mise à jour des statuts (pour la kitchen)
DROP POLICY IF EXISTS orders_update_policy ON public.orders;
CREATE POLICY orders_update_policy
  ON public.orders
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Politique pour permettre l'insertion de nouvelles commandes
DROP POLICY IF EXISTS orders_insert_policy ON public.orders;
CREATE POLICY orders_insert_policy
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- S'assurer que la table orders est publiée pour le Realtime
SELECT pg_notify('pgrst', 'reload schema');
