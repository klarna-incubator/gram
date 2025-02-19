  ALTER TABLE resource_matchings 
  ALTER COLUMN resource_id TYPE varchar USING resource_id::varchar;
