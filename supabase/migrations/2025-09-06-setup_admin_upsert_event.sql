-- Fonction d'upsert admin (security definer pour bypass RLS)
create or replace function public.admin_upsert_event(
  p_id uuid,
  p_name text,
  p_slug text,
  p_display_name text,
  p_logo_url text,
  p_join_code text default null,
  p_kitchen_code text default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null
)
returns public.events
language plpgsql
security definer
as $$
declare
  v_row public.events;
begin
  insert into public.events as e (
    id, name, slug, display_name, logo_url,
    join_code, kitchen_code, starts_at, ends_at
  )
  values (
    p_id, p_name, p_slug, nullif(p_display_name, ''),
    nullif(p_logo_url, ''), nullif(p_join_code, ''),
    nullif(p_kitchen_code, ''), p_starts_at, p_ends_at
  )
  on conflict (id) do update
  set name         = excluded.name,
      slug         = excluded.slug,
      display_name = excluded.display_name,
      logo_url     = excluded.logo_url,
      join_code    = coalesce(excluded.join_code, e.join_code),
      kitchen_code = coalesce(excluded.kitchen_code, e.kitchen_code),
      starts_at    = excluded.starts_at,
      ends_at      = excluded.ends_at
  returning * into v_row;

  return v_row;
end;
$$;

-- Autoriser l'appel via PostgREST
revoke all on function public.admin_upsert_event(
  uuid, text, text, text, text, text, text, timestamptz, timestamptz
) from public;

grant execute on function public.admin_upsert_event(
  uuid, text, text, text, text, text, text, timestamptz, timestamptz
) to anon, authenticated;

-- Recharger le cache PostgREST
notify pgrst, 'reload schema';
