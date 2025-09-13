-- Script de test pour vérifier que Hojicha, Golden latte et UBE ont été ajoutés correctement
-- Ce script peut être exécuté après la migration pour vérifier les données

-- 1. Vérifier que les nouvelles boissons ont été ajoutées dans la catégorie Non-coffee
SELECT 'Nouvelles boissons ajoutées:' as test, i.name, i.description, c.name as category_name, i.sort_order
FROM items i
JOIN categories c ON i.category_id = c.id
WHERE i.name IN ('Hojicha', 'Golden latte', 'UBE')
ORDER BY i.sort_order;

-- 2. Vérifier que UBE a les mêmes modifiers que Golden latte
SELECT 'Modifiers pour UBE:' as test, m.name as modifier_name, m.type, m.required
FROM items i
JOIN item_modifiers im ON i.id = im.item_id
JOIN modifiers m ON im.modifier_id = m.id
WHERE i.name = 'UBE'
ORDER BY m.name;

-- 3. Vérifier que Golden latte a les mêmes modifiers que UBE
SELECT 'Modifiers pour Golden latte:' as test, m.name as modifier_name, m.type, m.required
FROM items i
JOIN item_modifiers im ON i.id = im.item_id
JOIN modifiers m ON im.modifier_id = m.id
WHERE i.name = 'Golden latte'
ORDER BY m.name;

-- 4. Comparer les modifiers entre UBE et Golden latte pour s'assurer qu'ils sont identiques
SELECT 'Comparaison UBE vs Golden latte:' as test, 
       i.name as item_name, 
       m.name as modifier_name, 
       COUNT(mo.id) as option_count
FROM items i
JOIN item_modifiers im ON i.id = im.item_id
JOIN modifiers m ON im.modifier_id = m.id
JOIN modifier_options mo ON m.id = mo.modifier_id
WHERE i.name IN ('UBE', 'Golden latte')
GROUP BY i.name, m.name
ORDER BY i.name, m.name;

-- 5. Vérifier que toutes les nouvelles boissons ont les 4 modifiers de base
SELECT 'Vérification des modifiers de base:' as test, 
       i.name as item_name, 
       COUNT(DISTINCT m.name) as modifier_count,
       STRING_AGG(m.name, ', ' ORDER BY m.name) as modifier_names
FROM items i
JOIN item_modifiers im ON i.id = im.item_id
JOIN modifiers m ON im.modifier_id = m.id
WHERE i.name IN ('Hojicha', 'Golden latte', 'UBE')
GROUP BY i.name
ORDER BY i.name;

-- 6. Vérifier que toutes les options sont disponibles pour chaque modifier
SELECT 'Options disponibles pour chaque modifier:' as test, 
       m.name as modifier_name,
       COUNT(mo.id) as option_count,
       STRING_AGG(mo.name, ', ' ORDER BY mo.sort_order) as option_names
FROM modifiers m
JOIN modifier_options mo ON m.id = mo.modifier_id
GROUP BY m.name
ORDER BY m.name;
