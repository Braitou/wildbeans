-- Migration pour ajouter Hojicha, Golden latte et UBE à la catégorie Non-coffee
-- Cette migration ajoute ces nouvelles boissons avec leurs options

-- 1. Ajouter Hojicha à la catégorie Non-coffee
insert into public.items (name, description, category_id, sort_order)
select 'Hojicha', 'Thé vert japonais torréfié aux saveurs douces', id, 4 from public.categories where name = 'Non-coffee'
on conflict do nothing;

-- 2. Ajouter Golden latte à la catégorie Non-coffee
insert into public.items (name, description, category_id, sort_order)
select 'Golden latte', 'Latte doré aux épices et au curcuma', id, 5 from public.categories where name = 'Non-coffee'
on conflict do nothing;

-- 3. Ajouter UBE à la catégorie Non-coffee
insert into public.items (name, description, category_id, sort_order)
select 'UBE', 'Boisson violette à la patate douce violette', id, 6 from public.categories where name = 'Non-coffee'
on conflict do nothing;

-- 4. Associer les modifiers de base à ces nouvelles boissons
-- Tous les items ont les mêmes modifiers de base (Taille, Type de lait, Sucre, Extras)
insert into public.item_modifiers (item_id, modifier_id)
select i.id, m.id 
from public.items i, public.modifiers m
where i.name IN ('Hojicha', 'Golden latte', 'UBE')
on conflict do nothing;

-- 5. Vérification des données ajoutées
-- Cette section peut être commentée en production
/*
-- Vérifier que les nouvelles boissons ont été ajoutées
SELECT 'Nouvelles boissons ajoutées:' as test, i.name, i.description, c.name as category_name
FROM items i
JOIN categories c ON i.category_id = c.id
WHERE i.name IN ('Hojicha', 'Golden latte', 'UBE')
ORDER BY i.sort_order;

-- Vérifier que UBE a les mêmes modifiers que Golden latte
SELECT 'Modifiers pour UBE:' as test, m.name as modifier_name, m.type, m.required
FROM items i
JOIN item_modifiers im ON i.id = im.item_id
JOIN modifiers m ON im.modifier_id = m.id
WHERE i.name = 'UBE'
ORDER BY m.name;

-- Vérifier que Golden latte a les mêmes modifiers que UBE
SELECT 'Modifiers pour Golden latte:' as test, m.name as modifier_name, m.type, m.required
FROM items i
JOIN item_modifiers im ON i.id = im.item_id
JOIN modifiers m ON im.modifier_id = m.id
WHERE i.name = 'Golden latte'
ORDER BY m.name;
*/
