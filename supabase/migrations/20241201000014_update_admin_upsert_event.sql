-- Mise à jour de la fonction admin_upsert_event pour inclure display_name et logo_url

create or replace function public.admin_upsert_event(
  id uuid,
  name text,
  slug text,
  join_code text,
  kitchen_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  display_name text default null,
  logo_url text default null
) returns public.events
language plpgsql
security definer
as $$
declare
  v_row public.events;
begin
  if id is null then
    insert into public.events (name, slug, join_code, kitchen_code, starts_at, ends_at, display_name, logo_url, is_closed)
    values (name, slug, join_code, kitchen_code, starts_at, ends_at, display_name, logo_url, false)
    returning * into v_row;
  else
    update public.events
    set
      name = name,
      slug = slug,
      join_code = join_code,
      kitchen_code = kitchen_code,
      starts_at = starts_at,
      ends_at = ends_at,
      display_name = display_name,
      logo_url = logo_url
    where id = id
    returning * into v_row;
  end if;

  return v_row;
exception
  when unique_violation then
    raise exception 'SLUG_TAKEN' using errcode = 'P0001';
end;
$$;
