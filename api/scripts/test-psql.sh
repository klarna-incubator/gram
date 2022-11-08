#! /bin/bash
# helper script to connect to your local test database

RDSHOST=gram-test-postgres
USERNAME=gram-test
DBNAME=gram-test
PGPASSWORD="somethingsecretfortesting"

docker run --network gram-development -it --rm postgres psql "host=$RDSHOST dbname=$DBNAME user=$USERNAME password=$PGPASSWORD"