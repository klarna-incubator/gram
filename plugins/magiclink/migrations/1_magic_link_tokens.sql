create table if not exists magic_link_tokens (
  sub varchar(256),
  token varchar(256),  
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,
  primary key (token)
);
