-- Migration pour utiliser les codes fournis par le frontend
-- Simplifie la fonction admin_upsert_event pour utiliser les codes tels quels

-- Modifier la fonction admin_upsert_event pour utiliser les codes fournis
create or replace function public.admin_upsert_event(
  id uuid,
  name text,
  slug text,
  join_code text,
  kitchen_code text,
  starts_at timestamptz,
  ends_at timestamptz
) returns public.events
language plpgsql
security definer
as $$
declare
  v_row public.events;
begin
  if id is null then
    -- Création d'un nouvel événement avec les codes fournis
    insert into public.events (name, slug, join_code, kitchen_code, starts_at, ends_at, is_closed)
    values (name, slug, join_code, kitchen_code, starts_at, ends_at, false)
    returning * into v_row;
  else
    -- Mise à jour d'un événement existant
    update public.events
    set
      name = name,
      slug = slug,
      join_code = join_code,
      kitchen_code = kitchen_code,
      starts_at = starts_at,
      ends_at = ends_at
    where id = id
    returning * into v_row;
  end if;

  return v_row;
exception
  when unique_violation then
    raise exception 'SLUG_TAKEN' using errcode = 'P0001';
end;
$$;

-- Permissions
grant execute on function public.admin_upsert_event(uuid, text, text, text, text, timestamptz, timestamptz) to anon, authenticated;

-- Recharger le schéma PostgREST
notify pgrst, 'reload schema';
