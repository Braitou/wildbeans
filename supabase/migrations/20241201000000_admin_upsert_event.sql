-- Contrainte d'unicité sur le slug (si pas déjà en place)
do $$
begin
  if not exists (
    select 1 from pg_indexes where indexname = 'events_slug_key'
  ) then
    alter table public.events add constraint events_slug_key unique (slug);
  end if;
exception when duplicate_table then
  -- ignore
end$$;

-- RPC upsert (create/update) d'un évènement
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
    insert into public.events (name, slug, join_code, kitchen_code, starts_at, ends_at, is_closed)
    values (name, slug, join_code, kitchen_code, starts_at, ends_at, false)
    returning * into v_row;
  else
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

-- Politique de SELECT (si nécessaire pour que l'admin voie ses events)
drop policy if exists admin_events_select on public.events;
create policy admin_events_select
  on public.events
  for select
  to anon, authenticated
  using (true);

-- RPC pour clôturer un événement
create or replace function public.admin_close_event(
  p_event_id uuid
) returns void
language plpgsql
security definer
as $$
begin
  update public.events
  set is_closed = true
  where id = p_event_id;
end;
$$;
