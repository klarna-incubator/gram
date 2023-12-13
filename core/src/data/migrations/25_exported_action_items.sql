CREATE TABLE if not exists exported_action_items (  
  exporter_key varchar(255) NOT NULL,
  threat_id uuid REFERENCES threats(id) ON DELETE CASCADE,  
  url text NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,  
  PRIMARY KEY (exporter_key, threat_id)
);