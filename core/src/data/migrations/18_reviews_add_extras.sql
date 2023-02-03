ALTER TABLE reviews
ADD extras jsonb not null default '{}'::jsonb;

