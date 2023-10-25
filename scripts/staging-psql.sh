#! /bin/bash
# helper script to connect to Amazon RDS PostgreSQL with IAM credentials
# https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html

eval $(aws-login-tool login -d 14400 -r iam-sync/gram/gram.IdP_admin -a 422554941857 -o)

REGION=eu-west-1
AWS_ACCOUNT_ID=422554941857
ROLE=gram.IdP_admin
DURATION=900

#RDSHOST=gram-staging-database.ctfvbr0ed3wr.eu-west-1.rds.amazonaws.com
RDSHOST=gram-staging-database-cluster.cluster-ctfvbr0ed3wr.eu-west-1.rds.amazonaws.com
USERNAME=gram.IdP_admin
DBNAME=gram

curl https://s3.amazonaws.com/rds-downloads/rds-ca-2019-root.pem --output rds-ca-2019-root.pem

# connect to PostgreSQL via IAM DB auth
PGPASSWORD="$( aws rds generate-db-auth-token  \
  --hostname $RDSHOST \
  --port 5432 \
  --username $USERNAME \
  --region $REGION)"

docker run -v "$(pwd)/rds-ca-2019-root.pem:/rds-ca-2019-root.pem" -it --rm postgres psql "sslmode=verify-full sslrootcert=/rds-ca-2019-root.pem host=$RDSHOST dbname=$DBNAME user=$USERNAME password=$PGPASSWORD"
rm rds-ca-2019-root.pem
