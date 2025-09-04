# Correction du problème de suppression d'événements ✅ RÉSOLU

## Problème identifié
L'erreur PGRST202 indiquait que PostgREST ne trouvait pas la fonction `admin_delete_event(event_id uuid)` dans son cache de schéma. Cela était dû à des incohérences dans les noms de paramètres entre les fonctions RPC et les appels côté frontend.

## Solution appliquée

### 1. Migrations créées et appliquées
- `20241130000000_create_base_tables.sql` : Création des tables de base
- `20241201000006_fix_admin_delete_event_final.sql` : Recrée la fonction `admin_delete_event` avec le bon paramètre `event_id`
- `20241201000007_fix_admin_close_event.sql` : Corrige la fonction `admin_close_event` pour utiliser `event_id`
- `20241201000008_harmonize_rpc_parameters.sql` : Harmonise tous les paramètres des fonctions RPC
- `20241201000009_emergency_fix_admin_delete_event.sql` : Migration d'urgence pour forcer la correction

### 2. Code frontend corrigé
- `src/app/admin/events/[id]/stats/page.tsx` : Remplace `p_event_id` par `event_id`
- `src/app/admin/events/[id]/menu/page.tsx` : Remplace `p_event_id` par `event_id`

### 3. Problèmes d'encodage corrigés
- `20241201000003_fix_orders_rls.sql` : Corrigé les caractères spéciaux mal encodés

## ✅ Statut : RÉSOLU

Toutes les migrations ont été appliquées avec succès sur Supabase local :
```bash
supabase db reset
```

Les fonctions RPC sont maintenant correctement configurées avec les bons paramètres.

## 🔧 Si le problème persiste

Si vous obtenez encore l'erreur "Could not find the function public.admin_delete_event(event_id) in the schema cache", suivez ces étapes :

### Option 1 : Script de diagnostic (recommandé)
1. Allez sur `http://127.0.0.1:54323` (Supabase Studio)
2. Connectez-vous avec les credentials par défaut
3. Allez dans l'onglet SQL Editor
4. Exécutez le script `fix_admin_delete_event_diagnostic.sql`

### Option 2 : Rechargement forcé du cache
1. Dans Supabase Studio SQL Editor, exécutez :
```sql
-- Forcer le rechargement du cache PostgREST
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(3);
```

### Option 3 : Redémarrage complet
```bash
supabase stop
supabase start
```

## Test de la correction

Pour tester que tout fonctionne :

1. **Via l'interface web** :
   - Allez sur `http://127.0.0.1:54323` (Supabase Studio)
   - Connectez-vous avec les credentials par défaut
   - Allez dans l'onglet SQL Editor
   - Exécutez le script `force_cache_reload.sql` pour tester la fonction

2. **Via l'application** :
   - Démarrez votre application Next.js
   - Allez sur `/admin/events`
   - Créez un événement de test
   - Cliquez sur l'icône poubelle pour le supprimer
   - L'événement devrait être supprimé sans erreur

## Vérification des fonctions

Pour vérifier que les fonctions existent et fonctionnent :

```sql
-- Vérifier que la fonction admin_delete_event existe
SELECT proname, pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'admin_delete_event' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Tester la fonction
SELECT public.admin_delete_event('some-uuid-here');
```

## Notes importantes

- ✅ Toutes les fonctions RPC utilisent maintenant `event_id` au lieu de `p_event_id`
- ✅ Le cache PostgREST est rechargé automatiquement via `notify pgrst, 'reload schema'`
- ✅ Les autorisations sont correctement configurées pour `anon` et `authenticated`
- ✅ La fonction utilise `security definer` pour contourner les politiques RLS
- ✅ Toutes les tables de base sont créées avec les bonnes relations
- ✅ Migration d'urgence appliquée pour forcer la correction

## Prochaines étapes

1. Testez la suppression d'événements dans votre application
2. Si vous utilisez Supabase en production, appliquez les mêmes migrations
3. Vérifiez que toutes les autres fonctionnalités (création, modification, clôture) fonctionnent correctement

## Fichiers de diagnostic créés

- `fix_admin_delete_event_diagnostic.sql` : Script complet de diagnostic et correction
- `force_cache_reload.sql` : Script pour forcer le rechargement du cache
- `test_all_functions.sql` : Script de test de toutes les fonctions

