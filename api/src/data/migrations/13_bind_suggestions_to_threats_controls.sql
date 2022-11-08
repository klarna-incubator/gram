ALTER TABLE threats
ALTER COLUMN suggestion_id DROP NOT NULL;

ALTER TABLE controls
ALTER COLUMN suggestion_id DROP NOT NULL;

ALTER TABLE controls
  ADD CONSTRAINT fk_controls_suggestions 
  FOREIGN KEY (suggestion_id) REFERENCES suggested_controls (id) 
  ON DELETE SET NULL; -- If a suggestion is deleted, we still want the control saved,
                      -- but also not bound to an invalid id.

ALTER TABLE threats
  ADD CONSTRAINT fk_threats_suggestions 
  FOREIGN KEY (suggestion_id) REFERENCES suggested_threats (id) 
  ON DELETE SET NULL;

