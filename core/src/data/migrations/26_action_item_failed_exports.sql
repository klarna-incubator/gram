CREATE TABLE if not exists action_item_failed_exports (  
  id serial,
  model_id uuid NOT NULL,
  threat_id uuid NOT NULL,    
  exporter varchar(255) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,  
  PRIMARY KEY (id, model_id, threat_id, exporter)
);

