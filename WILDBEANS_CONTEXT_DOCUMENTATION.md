# Wild Beans - Documentation Technique Complète

## Vue d'ensemble de l'application

Wild Beans est une application de commande de café/boissons en ligne développée avec Next.js 15 et Supabase. Elle permet la gestion d'événements avec système de commandes personnalisées, interface d'administration et tableau de bord cuisine en temps réel.

## Architecture générale

### Stack technique
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Base de données**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI, Lucide React, shadcn/ui
- **Animations**: Framer Motion
- **Charts**: Recharts
- **QR Codes**: qrcode.react
- **Real-time**: Supabase Realtime

### Structure du projet
```
wildbeans/
├── src/
│   ├── app/                    # Routes Next.js (App Router)
│   │   ├── admin/             # Interface d'administration
│   │   ├── e/[slug]/          # Pages événement (commandes clients)
│   │   ├── kitchen/           # Interface cuisine/barista
│   │   └── order/[id]/        # Suivi de commande
│   ├── components/            # Composants React
│   │   ├── admin/             # Composants administration
│   │   ├── auth/              # Authentification
│   │   ├── order/             # Processus de commande
│   │   └── ui/                # Composants UI génériques
│   ├── lib/                   # Utilitaires et configuration
│   └── types/                 # Définitions TypeScript
├── supabase/
│   └── migrations/            # Migrations base de données
└── public/                    # Assets statiques
```

## Fonctionnalités principales

### 1. Gestion des événements
- **Création d'événements** : Interface admin pour créer des événements avec slug, codes d'accès
- **Codes d'accès** : 
  - `join_code` : Pour les clients (ex: WB1, WB2...)
  - `kitchen_code` : Pour les baristas (ex: KITCHEN1, KITCHEN2...)
- **QR Codes** : Génération automatique pour accès direct aux événements
- **Dates** : Gestion optionnelle des dates de début/fin

### 2. Système de commandes
- **Interface client** : Sélection de boissons avec options personnalisables
- **Processus multi-étapes** :
  1. Sélection des boissons (avec compteurs)
  2. Configuration des options pour chaque boisson
  3. Révision et informations client (nom requis)
- **Validation** : Vérification des options obligatoires
- **Confirmation** : Animation de tasse qui se remplit

### 3. Menu dynamique
- **Catégories** : Organisation des boissons (Cafés, Non-coffee, etc.)
- **Items** : Boissons avec descriptions
- **Modifiers** : Options personnalisables (Taille, Type de lait, Sucre, Extras)
- **Types de modifiers** :
  - `single` : Choix unique (ex: taille)
  - `multi` : Choix multiples (ex: extras)
- **Options obligatoires/optionnelles**

### 4. Interface cuisine (Kitchen)
- **Tableau de bord temps réel** : Affichage des commandes par statut
- **Colonnes de workflow** :
  - NEW : Nouvelles commandes
  - PREPARING : En préparation
  - READY : Prêtes
- **Actions** : TAKE, READY, SERVED, CANCEL
- **Indicateurs visuels** : Pastilles colorées selon l'ancienneté
- **Mode plein écran** : Optimisé pour écrans cuisine

### 5. Interface d'administration
- **Gestion des événements** : CRUD complet
- **Statistiques** : Visualisation des données de commandes
- **Authentification** : Protection par mot de passe (`NEXT_PUBLIC_ADMIN_SECRET`)

## Base de données (Supabase)

### Schéma principal

#### Tables événements
```sql
events (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  join_code text NOT NULL,
  kitchen_code text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  is_closed boolean DEFAULT false,
  display_name text,
  logo_url text
)
```

#### Tables menu
```sql
categories (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  sort_order integer DEFAULT 0
)

items (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0
)

modifiers (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  type text CHECK (type IN ('single', 'multi')),
  required boolean DEFAULT false
)

modifier_options (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  modifier_id uuid REFERENCES modifiers(id),
  sort_order integer DEFAULT 0
)

item_modifiers (
  item_id uuid REFERENCES items(id),
  modifier_id uuid REFERENCES modifiers(id),
  PRIMARY KEY (item_id, modifier_id)
)
```

#### Tables commandes
```sql
orders (
  id uuid PRIMARY KEY,
  event_id uuid REFERENCES events(id),
  customer_name text,
  pickup_code text NOT NULL,
  note text,
  status text DEFAULT 'new',
  total_cents integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
)

order_items (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES orders(id),
  item_name text NOT NULL,
  qty integer DEFAULT 1,
  price integer DEFAULT 0
)

order_item_options (
  id uuid PRIMARY KEY,
  order_item_id uuid REFERENCES order_items(id),
  option_name text NOT NULL,
  price_delta_cents integer DEFAULT 0
)
```

### Fonctions RPC importantes

#### `place_order`
```sql
place_order(
  p_event_slug text,
  p_join_code text,
  p_customer_name text,
  p_note text,
  p_items jsonb
) RETURNS json
```
Fonction principale pour passer une commande. Valide l'événement, génère un code de retrait, et insère la commande avec ses items et options.

#### `admin_upsert_event`
```sql
admin_upsert_event(
  p_id uuid,
  p_name text,
  p_slug text,
  p_join_code text,
  p_kitchen_code text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_display_name text,
  p_logo_url text
) RETURNS json
```
Création/modification d'événements avec génération automatique des codes.

#### `admin_list_events`
```sql
admin_list_events() RETURNS TABLE(...)
```
Liste tous les événements pour l'interface d'administration.

## Types TypeScript

### Types menu
```typescript
type ModifierType = 'single' | 'multi';

type ModifierOption = {
  id: string;
  name: string;
};

type Modifier = {
  id: string;
  name: string;
  type: ModifierType;
  required: boolean;
  options: ModifierOption[];
};

type Item = {
  id: string;
  name: string;
  description?: string | null;
  modifiers: Modifier[];
};

type Category = {
  id: string;
  name: string;
  items: Item[];
};
```

### Types commandes
```typescript
type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';

type PendingItem = {
  tempId: string;
  item: Item;
  single: Record<string, string | null>;  // Pour options single
  multi: Record<string, string[]>;        // Pour options multi
};
```

## Composants clés

### `Builder.tsx` (Processus de commande)
- **Gestion d'état complexe** : Panier multi-boissons avec options
- **Navigation multi-étapes** : choose → options → review
- **Validation** : Options obligatoires, nom client
- **Soumission** : Appel `place_order` avec payload JSONB

### `KitchenBoard.tsx` (Interface cuisine)
- **Real-time** : Écoute des changements via Supabase Realtime
- **Mise à jour optimiste** : UI réactive avec fallback
- **Colonnes workflow** : Organisation par statut
- **Polling fallback** : Si real-time ne fonctionne pas

### `AdminGate.tsx` (Authentification)
- **Protection simple** : Mot de passe stocké en localStorage
- **Variable d'environnement** : `NEXT_PUBLIC_ADMIN_SECRET`

### `WaitingClient.tsx` (Suivi commande)
- **Animations** : Framer Motion pour transitions fluides
- **GIFs** : Affichage contextuel selon le statut
- **Barre de progression** : Indicateur visuel

## Configuration environnement

### Variables requises
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_ADMIN_SECRET=wildbeans-secret
```

### Configuration Supabase
- **RLS (Row Level Security)** : Activé sur certaines tables
- **Real-time** : Activé pour orders, order_items
- **Autorisations** : `anon` et `authenticated` pour la plupart des tables

## Fonctionnalités temps réel

### Notifications Supabase
- **Kitchen Board** : Écoute INSERT/UPDATE sur orders
- **Suivi commande** : Écoute changements de statut
- **Stats admin** : Rafraîchissement automatique

### Fallbacks
- **Polling** : Si real-time ne fonctionne pas
- **localStorage** : Synchronisation entre onglets
- **Mise à jour optimiste** : UI réactive

## Workflow utilisateur

### Client (Commande)
1. **Accès** : URL avec slug événement + code join
2. **Sélection** : Choix boissons avec compteurs
3. **Options** : Configuration détaillée par boisson
4. **Révision** : Vérification + informations client
5. **Confirmation** : Animation + redirection suivi
6. **Suivi** : Page temps réel avec GIFs de statut

### Barista (Cuisine)
1. **Accès** : URL kitchen avec code cuisine
2. **Visualisation** : Tableau 3 colonnes (NEW/PREPARING/READY)
3. **Actions** : TAKE → READY → SERVED
4. **Temps réel** : Nouvelles commandes automatiques

### Admin
1. **Authentification** : Mot de passe secret
2. **Gestion événements** : CRUD avec QR codes
3. **Statistiques** : Visualisation données
4. **Kitchen link** : Génération liens barista

## Particularités techniques

### Gestion des erreurs
- **Validation frontend** : Options obligatoires, noms requis
- **Erreurs Supabase** : Messages d'erreur traduits
- **Toasts** : Notifications utilisateur (Sonner)

### Performance
- **Optimisations Next.js** : App Router, force-dynamic
- **Mise en cache** : Stratégies adaptées par route
- **Real-time optimisé** : Channels ciblés par événement

### Accessibilité
- **ARIA** : Labels et rôles appropriés
- **Animations** : Respect `prefers-reduced-motion`
- **Contraste** : Couleurs conformes WCAG

### Responsive
- **Mobile-first** : Design adaptatif
- **Grilles CSS** : Layout flexible
- **Breakpoints** : sm, md, lg, xl

## Menu par défaut

### Catégories
- **Cafés** : Espresso, Americano, Cappuccino, Latte
- **Non-coffee** : Thé, Chocolat chaud, Chai, Hojicha, Golden Latte, Ube

### Modifiers communs
- **Taille** (obligatoire) : Petit, Moyen, Grand
- **Type de lait** (optionnel) : Entier, Écrémé, Amande, Avoine, Coco
- **Sucre** (optionnel) : Sans, 1 sucre, 2 sucres, Édulcorant
- **Extras** (optionnel, multi) : Chantilly, Cannelle, Chocolat, Caramel

## Sécurité

### Authentification
- **Admin simple** : Mot de passe partagé en variable d'environnement
- **Pas d'utilisateurs** : Accès libre aux événements avec codes

### Autorisation
- **RLS activé** : Protection des données sensibles
- **Codes d'accès** : Validation côté serveur
- **CORS** : Configuration Supabase appropriée

## Déploiement

### Prérequis
- **Node.js 18+**
- **Projet Supabase** configuré
- **Variables d'environnement** définies

### Build
```bash
npm install
npm run build
npm start
```

### Migrations
- **Séquentielles** : Numérotées par date
- **Idempotentes** : Sûres à rejouer
- **RPC** : Fonctions PostgreSQL pour logique métier

Cette documentation couvre l'ensemble de l'architecture et du fonctionnement de Wild Beans. Elle peut servir de référence complète pour comprendre et développer l'application.

