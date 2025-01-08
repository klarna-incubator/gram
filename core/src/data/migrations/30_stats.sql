CREATE TABLE if not exists stats (  
  key varchar(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
  value decimal NOT NULL,
  interval varchar(255) NOT NULL,
  PRIMARY KEY (key, date, interval)
);

