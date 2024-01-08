CREATE TABLE if not exists links (  
  id serial,
  object_id varchar(255) NOT NULL,
  object_type varchar(20) NOT NULL,    

  label varchar(255),
  icon varchar(255),
  url text NOT NULL,

  created_by varchar not null default 'root',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,  
  PRIMARY KEY (id, object_id, object_type)
);

