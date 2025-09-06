-- Migration pour ajouter display_name et logo_url à la table events
-- et configurer le bucket de stockage pour les assets d'événements

-- Ajouter les colonnes à la table events
alter table public.events
  add column if not exists display_name text,
  add column if not exists logo_url text;

-- Ajouter un index pour le display_name (optionnel mais recommandé)
create index if not exists idx_events_display_name on public.events(display_name);

-- Créer le bucket 'event-assets' s'il n'existe pas
insert into storage.buckets (id, name, public)
values ('event-assets', 'event-assets', true)
on conflict (id) do nothing;

-- Politiques de stockage pour le bucket event-assets
-- Lecture publique (anon et authenticated)
create policy if not exists "event-assets-read"
on storage.objects for select
to anon, authenticated
using ( bucket_id = 'event-assets' );

-- Écriture pour les utilisateurs authentifiés (insert)
create policy if not exists "event-assets-write"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'event-assets' );

-- Mise à jour pour les utilisateurs authentifiés (update)
create policy if not exists "event-assets-update"
on storage.objects for update
to authenticated
using ( bucket_id = 'event-assets' )
with check ( bucket_id = 'event-assets' );

-- Suppression pour les utilisateurs authentifiés (delete)
create policy if not exists "event-assets-delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'event-assets' );
