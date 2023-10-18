#! /bin/bash
# helper script to connect to your demo database

RDSHOST=gram-demo-postgres
USERNAME=gram
DBNAME=gram
PGPASSWORD="somethingsecret"

docker run --network gram-demo -it --rm postgres psql "host=$RDSHOST dbname=$DBNAME user=$USERNAME password=$PGPASSWORD"