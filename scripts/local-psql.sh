#! /bin/bash
# helper script to connect to your local development database

RDSHOST=gram-postgres
USERNAME=gram
DBNAME=gram
PGPASSWORD="somethingsecret"

docker run --network gram-development -it --rm postgres psql "host=$RDSHOST dbname=$DBNAME user=$USERNAME password=$PGPASSWORD"