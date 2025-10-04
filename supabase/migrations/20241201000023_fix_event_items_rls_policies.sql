-- Migration pour ajouter les policies RLS manquantes sur event_items
-- Permet aux utilisateurs anon et authenticated de modifier les event_items

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "event_items_select_public" ON public.event_items;
DROP POLICY IF EXISTS "event_items_insert_public" ON public.event_items;
DROP POLICY IF EXISTS "event_items_update_public" ON public.event_items;
DROP POLICY IF EXISTS "event_items_delete_public" ON public.event_items;

-- Policy pour SELECT (lecture publique)
CREATE POLICY "event_items_select_public"
ON public.event_items
FOR SELECT
TO public
USING (true);

-- Policy pour INSERT (insertion publique)
CREATE POLICY "event_items_insert_public"
ON public.event_items
FOR INSERT
TO public
WITH CHECK (true);

-- Policy pour UPDATE (mise à jour publique)
CREATE POLICY "event_items_update_public"
ON public.event_items
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy pour DELETE (suppression publique)
CREATE POLICY "event_items_delete_public"
ON public.event_items
FOR DELETE
TO public
USING (true);

-- Vérifier que RLS est bien activé
ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;

-- Vérifier les permissions de la table
GRANT ALL ON public.event_items TO anon, authenticated;

