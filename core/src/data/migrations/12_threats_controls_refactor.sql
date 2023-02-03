CREATE TABLE IF NOT EXISTS mitigations (
  threat_id uuid NOT NULL,
  FOREIGN KEY (threat_id) REFERENCES threats (id) ON DELETE CASCADE,
  control_id uuid NOT NULL,
  FOREIGN KEY (control_id) REFERENCES controls (id) ON DELETE CASCADE,
  created_by VARCHAR NOT NULL DEFAULT 'root',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  PRIMARY KEY (threat_id, control_id)
);

INSERT INTO mitigations (threat_id, control_id) SELECT threat_id, id FROM controls;

ALTER TABLE controls
ADD COLUMN IF NOT EXISTS suggestion_id VARCHAR(256),
ADD COLUMN IF NOT EXISTS description VARCHAR,
DROP COLUMN threat_id;


ALTER TABLE controls
RENAME COLUMN name TO title;

ALTER TABLE threats
ADD COLUMN IF NOT EXISTS suggestion_id VARCHAR(256);

ALTER TABLE models
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
