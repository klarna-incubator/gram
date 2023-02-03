create table if not exists banners (  
  id SERIAL,
  text varchar not null,
  active boolean DEFAULT false,
  type varchar(20),
  created_at timestamp with time zone default current_timestamp,
  primary key (id)
);

