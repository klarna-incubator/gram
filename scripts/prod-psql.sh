#! /bin/bash
# Helper script to connect to Amazon RDS PostgreSQL with IAM credentials
#
# Uses bastion, you will need to be a member of access.bastion.production.api-user
# and have the aws-login-tool installed
# https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html

eval $(aws-login-tool login -d 14400 -r iam-sync/gram/gram.IdP_admin -a 715798949107 -o)

REGION=eu-west-1

RDSHOST=gram-production-database-cluster.cluster-cludl8iseytr.eu-west-1.rds.amazonaws.com
USERNAME=gram.IdP_admin
DBNAME=gram

if [ ! -f aws-global-bundle.pem ]; then
  curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem --output aws-global-bundle.pem
fi


# connect to PostgreSQL via IAM DB auth
PGPASSWORD="$( aws rds generate-db-auth-token  \
  --hostname $RDSHOST \
  --port 5432 \
  --username $USERNAME \
  --region $REGION)"

echo $PGPASSWORD

PORT=5439

# docker run -v "$(pwd)/aws-global-bundle.pem:/aws-global-bundle.pem" --network host -it --rm postgres
psql "sslmode=verify-ca sslrootcert=./aws-global-bundle.pem host=127.0.0.1 port=$PORT dbname=$DBNAME user=$USERNAME password='$PGPASSWORD'"
# sslmode=verify-full does not work due to localhost being the proxy