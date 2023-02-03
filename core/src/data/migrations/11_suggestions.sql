create table if not exists suggested_threats (  
  id varchar(256) not null,
  model_id uuid not null,

  status varchar(20),
  component_id uuid not null,
  title varchar not null,
  description varchar,
  reason varchar null,
  source varchar(128),
  
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,

  foreign key (model_id) references models (id) ON DELETE CASCADE,
  primary key (id)
);

CREATE INDEX idx_suggested_threats_source ON suggested_threats(source);

create table if not exists suggested_controls (
  id varchar(256) not null,
  model_id uuid not null,

  status varchar(20),
  component_id uuid not null,
  title varchar not null,
  description varchar,
  reason varchar null,
  mitigates jsonb not null default '{}'::jsonb,
  source varchar(128),

  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,

  foreign key (model_id) references models (id) ON DELETE CASCADE,
  primary key (id)
);

CREATE INDEX idx_suggested_controls_source ON suggested_controls(source);
