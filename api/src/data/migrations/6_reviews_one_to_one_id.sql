DO
$do$
BEGIN
    IF (SELECT COUNT(*) < 20 FROM reviews) THEN
        TRUNCATE reviews;
    END IF;
END
$do$;

ALTER TABLE reviews
drop constraint reviews_pkey,
drop constraint reviews_model_id_fkey,
ADD PRIMARY KEY (model_id),
ADD CONSTRAINT reviews_model_id_fkey FOREIGN KEY (model_id) REFERENCES models (id),
DROP COLUMN IF EXISTS id;

