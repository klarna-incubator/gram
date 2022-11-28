create table if not exists github_users (
  login varchar(256),
  email varchar not null,  
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,
  primary key (login)
);
