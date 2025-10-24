# 📊 PLAN : Refonte Complète des Statistiques WildBeans

## 🎯 Objectifs

1. **Créer une page Stats Globales** : Vue d'ensemble de tous les événements
2. **Refondre la page Stats par Événement** : Plus visuelle, plus complète, plus exportable
3. **Ajouter des KPIs pertinents** : Taux de personnalisation, ratio barista/client, etc.
4. **Améliorer l'export Excel** : Inclure toutes les données importantes
5. **Design moderne** : Utiliser Fragment Mono, graphiques interactifs

---

## 📦 Structure des Fichiers

### Nouveaux fichiers à créer

#### 1. Page Stats Globales
- `src/app/admin/stats/page.tsx` - Page principale stats globales
- `src/components/admin/GlobalStatsClient.tsx` - Composant client pour les stats globales

#### 2. Composants Stats Réutilisables
- `src/components/stats/KPICard.tsx` - Carte KPI réutilisable
- `src/components/stats/TopDrinksChart.tsx` - Graphique top boissons
- `src/components/stats/CategoryDistribution.tsx` - Distribution coffee/non-coffee
- `src/components/stats/TimelineChart.tsx` - Graphique timeline
- `src/components/stats/OptionsChart.tsx` - Graphique options populaires
- `src/components/stats/HeatmapChart.tsx` - Heatmap horaire
- `src/components/stats/StatsTable.tsx` - Tableau de stats avec recherche

#### 3. Migrations SQL
- `supabase/migrations/20241201000025_create_global_stats_functions.sql` - Fonctions RPC pour stats globales
- `supabase/migrations/20241201000026_enhance_event_stats_functions.sql` - Améliorer les fonctions existantes

### Fichiers à modifier

- `src/app/admin/events/page.tsx` - Ajouter bouton "Stats Globales"
- `src/app/admin/events/[id]/stats/page.tsx` - Refonte complète
- `src/components/admin/StatsClient.tsx` - Refonte avec nouveaux composants

---

## 🗄️ Fonctions RPC à Créer

### Pour Stats Globales

```sql
-- 1. admin_global_totals() : KPIs globaux
-- Retourne : total_orders, total_drinks, unique_customers, events_count, avg_per_order, avg_options_per_drink

-- 2. admin_global_drinks_breakdown() : Top boissons tous événements
-- Retourne : item_name, category, total_qty, percentage

-- 3. admin_global_options_breakdown() : Top options tous événements
-- Retourne : option_name, total_qty, percentage

-- 4. admin_global_events_summary() : Résumé par événement
-- Retourne : event_id, event_name, orders_count, drinks_count, customers_count, top_drink, event_date, status

-- 5. admin_global_timeline() : Timeline mensuelle
-- Retourne : month, year, orders_count, drinks_count

-- 6. admin_global_category_distribution() : Coffee vs Non-Coffee
-- Retourne : category, total_qty, percentage

-- 7. admin_global_hourly_distribution() : Distribution par heure
-- Retourne : hour, total_orders

-- 8. admin_customization_rate() : Taux de personnalisation
-- Retourne : total_drinks, customized_drinks, rate

-- 9. admin_barista_vs_client_ratio() : Ratio sources
-- Retourne : barista_count, client_count, barista_percentage
```

### Pour Stats Événement (améliorer existantes)

```sql
-- 1. Améliorer admin_event_totals() : Ajouter customization_rate, barista_ratio, peak_hour

-- 2. admin_event_customization_details() : Détails personnalisation
-- Retourne : drink_name, total, with_options, customization_rate

-- 3. admin_event_peak_analysis() : Analyse heures de pointe
-- Retourne : peak_hour, peak_count, avg_time_between_orders

-- 4. admin_event_drink_options_correlation() : Options par boisson
-- Retourne : drink_name, option_name, count
```

---

## 📊 KPIs à Calculer

### Stats Globales
1. ✅ Total Commandes
2. ✅ Total Boissons
3. ✅ Clients Uniques
4. ✅ Événements Total
5. ✅ Boisson Moy/Commande
6. ✅ Options Moy/Boisson
7. ✅ Taux Personnalisation (% boissons avec options)
8. ✅ Ratio Barista/Client (% commandes par source)
9. ✅ Croissance Mensuelle

### Stats Événement
1. ✅ Commandes
2. ✅ Boissons
3. ✅ Clients Uniques
4. ✅ Moy/Commande
5. ✅ Options/Boisson
6. ✅ Taux Personnalisation
7. ✅ Heure de Pointe
8. ✅ Vitesse Moyenne (temps entre commandes)
9. ✅ Ratio Barista/Client

---

## 🎨 Composants UI

### KPICard
```tsx
interface KPICardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon?: React.ReactNode;
}
```

### TopDrinksChart
- Type: Bar chart horizontal
- Données: Top 10 boissons avec quantités
- Couleurs: #706D54 pour coffee, #A08963 pour non-coffee

### CategoryDistribution
- Type: Donut chart
- Données: Coffee vs Non-Coffee
- Couleurs: #706D54 et #A08963

### TimelineChart
- Type: Line chart
- Données: Commandes par période (mois/heure)
- Couleur: #2ecc71

### HeatmapChart
- Type: Grid avec intensité colorée
- Données: Commandes par heure et période
- Couleurs: low (grey), medium (orange), high (green)

### StatsTable
- Features: Recherche, tri, pagination
- Données: Liste complète des boissons/événements

---

## 📥 Export Excel Amélioré

### Feuilles pour Stats Globales
1. **Résumé** : Tous les KPIs
2. **Top Boissons** : Classement complet
3. **Par Événement** : Stats détaillées par événement
4. **Timeline** : Données temporelles
5. **Options** : Classement des options

### Feuilles pour Stats Événement
1. **Résumé** : KPIs de l'événement
2. **Boissons** : Toutes les boissons avec détails
3. **Options** : Options commandées
4. **Timeline** : Données horaires
5. **Personnalisation** : Taux par boisson

---

## 🚀 Ordre d'Implémentation

### Phase 1 : Migrations SQL (Priorité haute)
1. ✅ Créer `20241201000025_create_global_stats_functions.sql`
   - admin_global_totals
   - admin_global_drinks_breakdown
   - admin_global_events_summary
   - admin_global_timeline
   - admin_global_category_distribution
   - admin_global_hourly_distribution
   - admin_customization_rate
   - admin_barista_vs_client_ratio

2. ✅ Créer `20241201000026_enhance_event_stats_functions.sql`
   - Améliorer admin_event_totals (ajouter nouveaux champs)
   - admin_event_customization_details
   - admin_event_peak_analysis
   - admin_event_drink_options_correlation

### Phase 2 : Composants Réutilisables (Priorité haute)
3. ✅ Créer `src/components/stats/KPICard.tsx`
4. ✅ Créer `src/components/stats/TopDrinksChart.tsx`
5. ✅ Créer `src/components/stats/CategoryDistribution.tsx`
6. ✅ Créer `src/components/stats/TimelineChart.tsx`
7. ✅ Créer `src/components/stats/OptionsChart.tsx`
8. ✅ Créer `src/components/stats/HeatmapChart.tsx`
9. ✅ Créer `src/components/stats/StatsTable.tsx`

### Phase 3 : Page Stats Globales (Priorité moyenne)
10. ✅ Créer `src/app/admin/stats/page.tsx`
11. ✅ Créer `src/components/admin/GlobalStatsClient.tsx`
12. ✅ Modifier `src/app/admin/events/page.tsx` (ajouter bouton Stats)

### Phase 4 : Refonte Stats Événement (Priorité moyenne)
13. ✅ Refondre `src/app/admin/events/[id]/stats/page.tsx`
14. ✅ Refondre `src/components/admin/StatsClient.tsx`

### Phase 5 : Export Excel Amélioré (Priorité basse)
15. ✅ Améliorer fonction d'export dans GlobalStatsClient
16. ✅ Améliorer fonction d'export dans StatsClient

### Phase 6 : Tests & Polish (Priorité basse)
17. ✅ Tester toutes les fonctions RPC
18. ✅ Vérifier responsive design
19. ✅ Optimiser performance des requêtes
20. ✅ Ajouter loading states

---

## 🔧 Détails Techniques

### Librairies utilisées
- **Charts** : `recharts` (déjà installé)
- **Export Excel** : `xlsx` (déjà installé)
- **Icons** : `lucide-react` (déjà installé)
- **Styling** : Tailwind CSS + Fragment Mono

### Format des données

```typescript
// KPIs Globaux
type GlobalTotals = {
  total_orders: number;
  total_drinks: number;
  unique_customers: number;
  events_count: number;
  avg_per_order: number;
  avg_options_per_drink: number;
  customization_rate: number;
  barista_percentage: number;
  client_percentage: number;
  growth_rate: number;
};

// KPIs Événement
type EventTotals = {
  orders: number;
  drinks: number;
  unique_customers: number;
  avg_per_order: number;
  avg_options_per_drink: number;
  customization_rate: number;
  peak_hour: string;
  avg_time_between_orders: number;
  barista_percentage: number;
  period: { from: string; to: string };
};
```

### Calculs

#### Taux de personnalisation
```sql
customization_rate = (drinks_with_options / total_drinks) * 100
```

#### Ratio Barista/Client
```sql
-- On détecte si c'est barista via customer_name = 'Comptoir'
barista_percentage = (barista_orders / total_orders) * 100
client_percentage = 100 - barista_percentage
```

#### Vitesse moyenne
```sql
avg_time_between_orders = 
  (max(created_at) - min(created_at)) / count(orders)
```

---

## ✅ Checklist Finale

### Fonctionnalités
- [ ] Page stats globales accessible depuis `/admin/stats`
- [ ] Bouton "Stats Globales" sur page événements
- [ ] Refonte visuelle page stats événement
- [ ] 9 KPIs sur page globale
- [ ] 9 KPIs sur page événement
- [ ] Top 10 boissons avec classement
- [ ] Distribution coffee/non-coffee
- [ ] Timeline interactive
- [ ] Heatmap horaire
- [ ] Tableau avec recherche
- [ ] Export Excel complet (2 formats)
- [ ] Temps réel (refresh automatique)
- [ ] Responsive design

### Qualité
- [ ] Aucune erreur TypeScript
- [ ] Aucune erreur de linter
- [ ] Toutes les fonctions RPC testées
- [ ] Export Excel testé
- [ ] Performance optimisée
- [ ] Design cohérent avec Fragment Mono
- [ ] Couleurs brand (#706D54, #A08963)

---

## 📝 Notes

- Les commandes barista sont identifiées par `customer_name = 'Comptoir'`
- Les commandes client sont toutes les autres
- La personnalisation = au moins 1 option dans `order_item_options`
- Les heures de pointe sont calculées sur les 24h de la journée
- La croissance est calculée sur le mois en cours vs mois précédent

---

**Date de création** : 24 octobre 2024
**Version** : 1.0
**Statut** : En attente de validation

