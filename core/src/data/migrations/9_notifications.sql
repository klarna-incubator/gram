CREATE TYPE notification_status AS ENUM ('new', 'pending', 'sent', 'failed');

create table if not exists notifications (  
  id SERIAL,
  type varchar(255),  
  template varchar(255),
  status notification_status,
  variables jsonb not null default '{}'::jsonb,

  sent_at timestamp with time zone default null,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,

  primary key (id)
);

CREATE INDEX ON notifications (status);
