create extension if not exists "uuid-ossp";
create table if not exists models (
  id uuid default uuid_generate_v4(),
  system_id varchar not null,
  version varchar not null,
  data jsonb not null default '{}'::jsonb,
  created_by varchar not null default 'root',
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,
  primary key (id)
);
