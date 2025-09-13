-- Migration pour connecter le système de cuisine au nouveau menu
-- Cette migration met à jour les tables de commandes pour utiliser la nouvelle structure

-- 1. Vérifier et ajuster la structure de order_items
-- Ajouter les colonnes nécessaires si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter item_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'item_name') THEN
        ALTER TABLE order_items ADD COLUMN item_name text;
    END IF;
    
    -- Ajouter qty si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'qty') THEN
        ALTER TABLE order_items ADD COLUMN qty integer DEFAULT 1;
    END IF;
END $$;

-- 2. Vérifier et ajuster la structure de order_item_options
-- Ajouter option_name si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_item_options' AND column_name = 'option_name') THEN
        ALTER TABLE order_item_options ADD COLUMN option_name text;
    END IF;
END $$;

-- 3. Supprimer les anciennes colonnes de référence si elles existent
-- (Ces colonnes peuvent ne pas exister selon votre configuration)
DO $$ 
BEGIN
    -- Supprimer menu_item_id si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' AND column_name = 'menu_item_id') THEN
        ALTER TABLE order_items DROP COLUMN menu_item_id;
    END IF;
    
    -- Supprimer menu_option_id si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_item_options' AND column_name = 'menu_option_id') THEN
        ALTER TABLE order_item_options DROP COLUMN menu_option_id;
    END IF;
END $$;

-- 4. Mettre à jour les données existantes si nécessaire
-- Copier les noms des items depuis les anciennes tables si elles existent
DO $$
BEGIN
    -- Si des données existent dans order_items sans item_name, essayer de les récupérer
    IF EXISTS (SELECT 1 FROM order_items WHERE item_name IS NULL LIMIT 1) THEN
        -- Cette partie dépend de votre structure actuelle
        -- Pour l'instant, on met des valeurs par défaut
        UPDATE order_items 
        SET item_name = 'Unknown Item' 
        WHERE item_name IS NULL;
    END IF;
    
    -- Si des données existent dans order_item_options sans option_name
    IF EXISTS (SELECT 1 FROM order_item_options WHERE option_name IS NULL LIMIT 1) THEN
        UPDATE order_item_options 
        SET option_name = 'Unknown Option' 
        WHERE option_name IS NULL;
    END IF;
END $$;

-- 5. Créer des fonctions helper pour la cuisine
-- Fonction pour récupérer les commandes avec les détails du menu
CREATE OR REPLACE FUNCTION public.get_kitchen_orders(event_id_param uuid DEFAULT NULL)
RETURNS TABLE(
  order_id uuid,
  customer_name text,
  pickup_code text,
  status text,
  created_at timestamptz,
  total_cents integer,
  items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.customer_name,
    o.pickup_code,
    o.status,
    o.created_at,
    o.total_cents,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'item_name', oi.item_name,
          'qty', oi.qty,
          'options', COALESCE(opt_options.options, '[]'::jsonb)
        )
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::jsonb
    ) as items
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'option_name', oio.option_name
      )
    ) as options
    FROM order_item_options oio
    WHERE oio.order_item_id = oi.id
  ) opt_options ON true
  WHERE (event_id_param IS NULL OR o.event_id = event_id_param)
  GROUP BY o.id, o.customer_name, o.pickup_code, o.status, o.created_at, o.total_cents
  ORDER BY o.created_at DESC;
END;
$$;

-- 6. Autorisations
GRANT EXECUTE ON FUNCTION public.get_kitchen_orders(uuid) TO anon, authenticated;


