-- RPC pour vérifier si RLS est activé sur une table
create or replace function public.check_rls_enabled(table_name text)
returns boolean
language plpgsql
security definer
as $$
declare
  rls_enabled boolean;
begin
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = table_name;
  
  return rls_enabled;
exception
  when others then
    return false;
end;
$$;

grant execute on function public.check_rls_enabled(text) to anon, authenticated;
notify pgrst, 'reload schema';
