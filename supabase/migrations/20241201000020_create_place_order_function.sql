-- Créer la fonction place_order manquante
-- Cette fonction permet de passer des commandes avec des options

create or replace function public.place_order(
  p_event_slug text,
  p_join_code text,
  p_customer_name text,
  p_note text,
  p_items jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_order_id uuid;
  v_pickup_code text;
  v_item jsonb;
  v_option_id text;
  v_order_item_id uuid;
  v_option_name text;
begin
  -- 1. Vérifier l'événement et le code de participation
  select id into v_event_id
  from events
  where slug = p_event_slug
    and join_code = p_join_code
    and not is_closed;
  
  if v_event_id is null then
    raise exception 'Événement non trouvé ou fermé';
  end if;

  -- 2. Générer un code de récupération unique
  loop
    v_pickup_code := upper(substring(md5(random()::text) from 1 for 4));
    exit when not exists (
      select 1 from orders 
      where pickup_code = v_pickup_code 
        and event_id = v_event_id
    );
  end loop;

  -- 3. Créer la commande
  insert into orders (
    event_id,
    customer_name,
    pickup_code,
    note,
    status,
    total_cents
  ) values (
    v_event_id,
    coalesce(p_customer_name, 'Client'),
    v_pickup_code,
    p_note,
    'new',
    0 -- sera calculé plus tard si nécessaire
  ) returning id into v_order_id;

  -- 4. Ajouter les items et leurs options
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    -- Insérer l'item de commande
    insert into order_items (
      order_id,
      item_name,
      qty,
      price
    ) values (
      v_order_id,
      (v_item->>'item_name'),
      coalesce((v_item->>'qty')::integer, 1),
      0 -- prix sera calculé plus tard si nécessaire
    ) returning id into v_order_item_id;

    -- Ajouter les options si présentes
    if v_item ? 'options' and jsonb_typeof(v_item->'options') = 'array' then
      for v_option_id in select jsonb_array_elements_text(v_item->'options')
      loop
        -- Récupérer le nom de l'option depuis modifier_options
        select name into v_option_name
        from modifier_options
        where id::text = v_option_id;
        
        if v_option_name is not null then
          insert into order_item_options (
            order_item_id,
            option_name,
            price_delta_cents
          ) values (
            v_order_item_id,
            v_option_name,
            0 -- delta de prix sera géré plus tard si nécessaire
          );
        end if;
      end loop;
    end if;
  end loop;

  -- 5. Retourner les informations de la commande
  return json_build_object(
    'order_id', v_order_id,
    'pickup_code', v_pickup_code,
    'event_id', v_event_id
  );
end;
$$;

-- Autorisation
grant execute on function public.place_order(text, text, text, text, jsonb) to anon, authenticated;

-- Recharger le cache PostgREST
notify pgrst, 'reload schema';
