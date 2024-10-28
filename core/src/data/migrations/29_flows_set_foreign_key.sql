ALTER TABLE flows
ADD CONSTRAINT flows_model_id_fkey 
FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE;

CREATE INDEX idx_flows_model_id ON flows(model_id);
