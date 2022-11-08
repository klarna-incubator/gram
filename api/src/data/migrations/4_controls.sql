create extension if not exists "uuid-ossp";
create table if not exists controls (
  id uuid default uuid_generate_v4(),
  model_id uuid not null,
  foreign key (model_id) references models (id) ON DELETE CASCADE,
  threat_id uuid not null,
  foreign key (threat_id) references threats (id) ON DELETE CASCADE,
  component_id uuid not null,
  name varchar not null,
  in_place boolean not null,
  created_by varchar not null default 'root',
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,
  deleted_at timestamp with time zone default null,
  primary key (id)
);
