CREATE TABLE if not exists resource_matchings (
  model_id uuid NOT NULL,
  foreign key (model_id) references models (id) ON DELETE CASCADE,
  component_id uuid,
  resource_id uuid NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
  created_by varchar NOT NULL default 'manual',
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,  
  updated_by varchar NOT NULL default 'manual',

  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,

  PRIMARY KEY (resource_id)
);

CREATE UNIQUE INDEX idx_matchings_resource_id ON resource_matchings(model_id, resource_id);