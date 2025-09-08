# Remplacement des animations par des GIFs

## Structure mise en place

Le composant `WaitingClient.tsx` a été modifié pour utiliser des GIFs au lieu des animations SVG selon le statut de la commande :

- **NEW** → `/gifs/sent.gif` (commande envoyée à la kitchen)
- **PREPARING** → `/gifs/preparing.gif` (commande en préparation)
- **READY/SERVED** → `/gifs/ready.gif` (commande prête)

## Fichiers à remplacer

Les fichiers suivants dans `public/gifs/` sont actuellement des placeholders et doivent être remplacés par les vrais GIFs :

- `sent.gif` - Animation pour "Sent"
- `preparing.gif` - Animation pour "Preparing" 
- `ready.gif` - Animation pour "Ready"

## Dimensions recommandées

Les GIFs sont affichés avec les dimensions `200px × 150px` et utilisent `object-contain` pour maintenir les proportions.

## Test

Pour tester l'implémentation :
1. Remplacer les fichiers placeholder par les vrais GIFs
2. Naviguer vers une page de commande (`/order/[id]`)
3. Vérifier que les GIFs s'affichent correctement selon le statut de la commande
