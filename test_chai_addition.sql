-- Script de test pour vérifier que CHAI a été ajouté correctement
-- Ce script peut être exécuté après la migration pour vérifier les données

-- 1. Vérifier que la catégorie "Non-coffee" existe
SELECT 'Catégorie Non-coffee:' as test, name, sort_order 
FROM categories 
WHERE name = 'Non-coffee';

-- 2. Vérifier que CHAI a été ajouté dans la catégorie Non-coffee
SELECT 'CHAI dans Non-coffee:' as test, i.name, i.description, c.name as category_name
FROM items i
JOIN categories c ON i.category_id = c.id
WHERE i.name = 'Chai' AND c.name = 'Non-coffee';

-- 3. Vérifier que CHAI a les mêmes modifiers que les autres boissons non-coffee
SELECT 'Modifiers pour CHAI:' as test, m.name as modifier_name, m.type, m.required
FROM items i
JOIN categories c ON i.category_id = c.id
JOIN item_modifiers im ON i.id = im.item_id
JOIN modifiers m ON im.modifier_id = m.id
WHERE i.name = 'Chai' AND c.name = 'Non-coffee'
ORDER BY m.name;

-- 4. Vérifier que CHAI a toutes les options disponibles
SELECT 'Options pour CHAI:' as test, m.name as modifier_name, mo.name as option_name, mo.sort_order
FROM items i
JOIN categories c ON i.category_id = c.id
JOIN item_modifiers im ON i.id = im.item_id
JOIN modifiers m ON im.modifier_id = m.id
JOIN modifier_options mo ON m.id = mo.modifier_id
WHERE i.name = 'Chai' AND c.name = 'Non-coffee'
ORDER BY m.name, mo.sort_order;

-- 5. Comparer avec une autre boisson non-coffee (Thé) pour s'assurer qu'elles ont les mêmes options
SELECT 'Comparaison Thé vs CHAI:' as test, 
       i.name as item_name, 
       m.name as modifier_name, 
       COUNT(mo.id) as option_count
FROM items i
JOIN categories c ON i.category_id = c.id
JOIN item_modifiers im ON i.id = im.item_id
JOIN modifiers m ON im.modifier_id = m.id
JOIN modifier_options mo ON m.id = mo.modifier_id
WHERE c.name = 'Non-coffee' AND i.name IN ('Thé', 'Chai')
GROUP BY i.name, m.name
ORDER BY i.name, m.name;


