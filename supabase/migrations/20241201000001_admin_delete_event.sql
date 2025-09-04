-- Fonction RPC pour supprimer un event (sécurisée)
create or replace function public.admin_delete_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Supprimer l'event (les FK en cascade s'occuperont des données dépendantes)
  delete from public.events where id = p_event_id;
end;
$$;

-- Accorder les permissions d'exécution
grant execute on function public.admin_delete_event(uuid) to anon, authenticated;
