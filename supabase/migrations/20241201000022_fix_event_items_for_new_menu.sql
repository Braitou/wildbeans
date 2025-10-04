-- Migration pour adapter event_items à la nouvelle structure de menu (items au lieu de menu_items)

-- 1. Sauvegarder les données existantes
CREATE TEMP TABLE temp_event_items AS 
SELECT * FROM public.event_items;

-- 2. Supprimer l'ancienne table event_items
DROP TABLE IF EXISTS public.event_items CASCADE;

-- 3. Recréer la table avec la nouvelle structure
CREATE TABLE public.event_items (
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.items(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (event_id, menu_item_id)
);

-- 4. Activer RLS
ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;

-- 5. Créer la policy pour SELECT public
CREATE POLICY "event_items_select_public"
ON public.event_items
FOR SELECT
TO public
USING (true);

-- 6. Autorisations
GRANT ALL ON public.event_items TO anon, authenticated;

-- 7. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_event_items_event_id ON public.event_items(event_id);
CREATE INDEX IF NOT EXISTS idx_event_items_menu_item_id ON public.event_items(menu_item_id);

-- Note: On ne restaure pas les anciennes données car elles référencent les anciennes tables menu_items
-- Les nouvelles données seront créées au fur et à mesure que les admins configurent les événements

