terraform {
  backend "s3" {
    bucket         = "secdev-terraform-state-staging-393bab6d"
    key            = "gram"
    region         = "eu-west-1"
    dynamodb_table = "gram-terraform-state-lock"
    profile        = "iam-sync/gram/gram.IdP_admin@422554941857"
  }
}
