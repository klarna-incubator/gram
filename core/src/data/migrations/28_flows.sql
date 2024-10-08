CREATE TABLE if not exists flows (  
  id serial,
  data_flow_id uuid NOT NULL,
  model_id uuid NOT NULL,   
  origin_component_id uuid NOT NULL,
  
  summary varchar(255) NOT NULL,

  attributes jsonb not null default '{}'::jsonb,

  created_by varchar not null default 'root',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,  
  PRIMARY KEY (id, model_id, data_flow_id)
);

