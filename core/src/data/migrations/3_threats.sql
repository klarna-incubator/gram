create extension if not exists "uuid-ossp";
create table if not exists threats (
  id uuid default uuid_generate_v4(),
  title varchar not null,
  description varchar,
  model_id uuid not null,
  foreign key (model_id) references models (id) ON DELETE CASCADE,
  component_id uuid not null,
  created_by varchar not null default 'root',
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,
  deleted_at timestamp with time zone default null,

  primary key (id)
);
create index if not exists idx_model_component on threats (model_id, component_id);
