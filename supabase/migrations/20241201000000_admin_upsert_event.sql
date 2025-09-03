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
  p_id uuid,
  p_name text,
  p_slug text,
  p_join_code text,
  p_kitchen_code text,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns public.events
language plpgsql
security definer
as $$
declare
  v_row public.events;
begin
  if p_id is null then
    insert into public.events (name, slug, join_code, kitchen_code, starts_at, ends_at, is_closed)
    values (p_name, p_slug, p_join_code, p_kitchen_code, p_starts_at, p_ends_at, false)
    returning * into v_row;
  else
    update public.events
    set
      name = p_name,
      slug = p_slug,
      join_code = p_join_code,
      kitchen_code = p_kitchen_code,
      starts_at = p_starts_at,
      ends_at = p_ends_at
    where id = p_id
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
