INSERT INTO suggested_threats
(id, model_id, status, component_id, title, description, reason, source, created_at, updated_at)
SELECT 
    CONCAT(component_id,'/stride/threat/',REPLACE(LOWER(title), ' ', '-')) as id,
    model_id,
    'accepted' as status,
    component_id,
    title,
    description,
    '' as reason,
    'stride' as source,
    created_at,
    updated_at
FROM threats
WHERE title in ('Spoofing','Tampering', 'Repudiation','Information Disclosure','Denial of Service','Elevation of Privilege')
ON CONFLICT DO NOTHING;


UPDATE threats SET suggestion_id=CONCAT(component_id,'/stride/threat/',REPLACE(LOWER(title), ' ', '-')) 
WHERE title in ('Spoofing','Tampering', 'Repudiation','Information Disclosure','Denial of Service','Elevation of Privilege');