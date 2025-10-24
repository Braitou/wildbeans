-- Fix barista_place_order : retirer la colonne price qui n'existe pas dans order_items
-- La colonne price n'est pas dans la structure actuelle de order_items

create or replace function public.barista_place_order(
  p_event_id uuid,
  p_items jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_order_id uuid;
  v_pickup_code text;
  v_order_item_id uuid;
  v_item_name text;
  v_option_id text;
  v_option_name text;
  v_total_orders integer := 0;
begin
  -- Vérifier que l'événement existe et n'est pas fermé
  if not exists (
    select 1 from events
    where id = p_event_id
      and not is_closed
  ) then
    raise exception 'Événement non trouvé ou fermé';
  end if;

  -- Traiter chaque boisson de la commande
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    -- Générer un code de récupération unique
    loop
      v_pickup_code := upper(substring(md5(random()::text) from 1 for 4));
      exit when not exists (
        select 1 from orders 
        where pickup_code = v_pickup_code 
          and event_id = p_event_id
      );
    end loop;

    -- Récupérer le nom de l'item depuis l'ID
    select name into v_item_name
    from items
    where id = (v_item->>'item_id')::uuid;
    
    if v_item_name is null then
      raise exception 'Item non trouvé: %', v_item->>'item_id';
    end if;

    -- Créer la commande (directement en statut "served")
    insert into orders (
      event_id,
      customer_name,
      pickup_code,
      note,
      status,
      total_cents
    ) values (
      p_event_id,
      'Comptoir',
      v_pickup_code,
      'Commande barista',
      'served',
      0
    ) returning id into v_order_id;

    -- Insérer l'item de commande (SANS la colonne price)
    insert into order_items (
      order_id,
      item_name,
      qty
    ) values (
      v_order_id,
      v_item_name,
      1
    ) returning id into v_order_item_id;

    -- Ajouter les options si présentes
    if v_item ? 'options' and jsonb_typeof(v_item->'options') = 'object' then
      -- Parcourir chaque clé (modifier_id) dans les options
      for v_option_id in 
        select jsonb_object_keys(v_item->'options')
      loop
        -- Récupérer la valeur pour cette clé
        declare
          v_option_value jsonb;
          v_single_option text;
        begin
          v_option_value := v_item->'options'->v_option_id;
          
          -- Si c'est un tableau (multi-select)
          if jsonb_typeof(v_option_value) = 'array' then
            for v_single_option in 
              select jsonb_array_elements_text(v_option_value)
            loop
              -- Récupérer le nom de l'option
              select name into v_option_name
              from modifier_options
              where id::text = v_single_option;
              
              if v_option_name is not null then
                insert into order_item_options (
                  order_item_id,
                  option_name,
                  price_delta_cents
                ) values (
                  v_order_item_id,
                  v_option_name,
                  0
                );
              end if;
            end loop;
          -- Si c'est une string (single-select)
          elsif jsonb_typeof(v_option_value) = 'string' then
            v_single_option := v_option_value#>>'{}';
            
            if v_single_option != '' then
              -- Récupérer le nom de l'option
              select name into v_option_name
              from modifier_options
              where id::text = v_single_option;
              
              if v_option_name is not null then
                insert into order_item_options (
                  order_item_id,
                  option_name,
                  price_delta_cents
                ) values (
                  v_order_item_id,
                  v_option_name,
                  0
                );
              end if;
            end if;
          end if;
        end;
      end loop;
    end if;

    v_total_orders := v_total_orders + 1;
  end loop;

  -- Retourner le résultat
  return json_build_object(
    'success', true,
    'orders_created', v_total_orders,
    'event_id', p_event_id
  );
end;
$$;

-- Recharger le cache PostgREST
notify pgrst, 'reload schema';

