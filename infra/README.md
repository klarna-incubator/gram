# README
This directory contains the cloud infrastructure used by Gram. Since the project is relatively small, deployment of AWS resources
is done manually.

The `staging` and `production` folders contain resources related to their respective environments.

## First time setup
Before you can start to make changes on an environment, you need to initialize terraform.

1. `cd staging` or `cd production`
1. Login to the target AWS account using `aws-login-tool`.
    * Staging: `aws-login-tool login -d 14400 -r iam-sync/gram/gram.IdP_admin -a 422554941857 -o`
    * Production: `aws-login-tool login -d 14400 -r iam-sync/gram/gram.IdP_admin -a 715798949107 -o`
2. Run `terraform init`. This will set up the providers/modules used by terraform.
3. Test that it works by running `terraform plan`

## Making changes

1. Login to the target AWS account using `aws-login-tool`
2. Write some terraform code!
2. Check your changes by running `terraform plan`
3. When you're happy with them, apply your changes by running `terraform apply`
4. Assuming everything went well, commit and push the changes.

