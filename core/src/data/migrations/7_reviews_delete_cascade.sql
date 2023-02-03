ALTER TABLE reviews
DROP CONSTRAINT reviews_model_id_fkey,
ADD CONSTRAINT reviews_model_id_fkey FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE;
