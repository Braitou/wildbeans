-- Mise à jour de la fonction admin_list_events pour inclure display_name et logo_url

-- Supprimer l'ancienne fonction
drop function if exists public.admin_list_events();

-- Recréer la fonction avec les nouveaux champs
create function public.admin_list_events()
returns table(
  id uuid,
  name text,
  slug text,
  join_code text,
  kitchen_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_closed boolean,
  display_name text,
  logo_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    e.id,
    e.name,
    e.slug,
    e.join_code,
    e.kitchen_code,
    e.starts_at,
    e.ends_at,
    e.is_closed,
    e.display_name,
    e.logo_url
  from events e
  order by e.created_at desc;
end;
$$;

-- Redonner les permissions
grant execute on function public.admin_list_events() to anon, authenticated;
