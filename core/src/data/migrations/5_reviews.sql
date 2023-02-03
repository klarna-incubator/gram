create extension if not exists "uuid-ossp";
create table if not exists reviews (  
  model_id uuid not null,
  foreign key (model_id) references models (id) ON DELETE CASCADE,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,
  deleted_at timestamp with time zone default null,
  status varchar(20),
  note varchar,
  requested_by varchar,
  reviewed_by varchar,

  primary key (model_id)
);
