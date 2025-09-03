# Implémentation de la fonctionnalité de création/mise à jour d'événements

## Objectif
Quand je clique "Enregistrer" sur la page Admin → Event (nouveau / édition), l'event doit être créé/maj correctement.

Si id === "new" → création.
Sinon → mise à jour.

Gestion slug unique avec message d'erreur propre.
Raccourcis UX : slugify le nom automatiquement, proposer des codes par défaut (join_code, kitchen_code) si vides.

## Étapes d'installation

### 1. Appliquer les migrations SQL

Démarrez Docker Desktop et Supabase localement :

```bash
# Démarrer Supabase
supabase start

# Appliquer les migrations
supabase db push
```

Les migrations créent :
- Contrainte d'unicité sur le slug des événements
- Fonction RPC `admin_upsert_event` pour créer/mettre à jour les événements
- Fonction RPC `admin_close_event` pour clôturer les événements
- Politique de sélection pour les événements

### 2. Fonctionnalités implémentées

#### Frontend (src/app/admin/events/[id]/page.tsx)
- ✅ Création d'événements (id === "new")
- ✅ Mise à jour d'événements existants
- ✅ Auto-génération du slug à partir du nom
- ✅ Codes par défaut : WB1 pour join_code, KITCHEN1 pour kitchen_code
- ✅ Gestion des erreurs de slug dupliqué avec message "Ce slug est déjà utilisé, choisis-en un autre."
- ✅ Redirection vers la page de l'événement après création
- ✅ Validation des champs requis (nom et slug)
- ✅ Interface utilisateur améliorée avec placeholders et descriptions

#### Backend (SQL)
- ✅ Contrainte d'unicité sur le slug
- ✅ Fonction RPC `admin_upsert_event` avec gestion des erreurs
- ✅ Fonction RPC `admin_close_event` pour clôturer les événements
- ✅ Sécurité avec `security definer` pour contourner RLS

## Tests d'acceptation

- [ ] Je peux créer un event avec name/slug/join/kitchen et ça sauvegarde
- [ ] En cas de slug déjà pris, message "Ce slug est déjà utilisé…"
- [ ] En édition, je peux mettre à jour et clôturer
- [ ] Pour "new", après save → redirection vers /admin/events/{id}

## Notes techniques

- La fonction `slugify` normalise les caractères accentués et remplace les espaces par des tirets
- Les codes par défaut sont appliqués automatiquement pour les nouveaux événements
- La gestion d'erreur distingue les erreurs de slug dupliqué des autres erreurs
- L'interface utilise des champs datetime-local pour les dates de début/fin
