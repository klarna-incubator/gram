create extension if not exists "uuid-ossp";
create table if not exists user_activity (
  id uuid default uuid_generate_v4(),
  user_id varchar not null,
  model_id uuid not null,
  action_type varchar not null,
  created_at timestamp with time zone default current_timestamp,
  primary key (id),
  unique (user_id, model_id, action_type)
);
