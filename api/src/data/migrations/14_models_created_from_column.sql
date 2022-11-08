ALTER TABLE models
    ADD created_from uuid,
    ADD is_template boolean DEFAULT false;