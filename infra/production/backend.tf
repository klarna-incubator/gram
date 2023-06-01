terraform {
  backend "s3" {
    bucket         = "secdev-terraform-state-production-c02db7d7"
    key            = "gram/"
    region         = "eu-west-1"
    dynamodb_table = "gram-terraform-state-lock"
    profile        = "iam-sync/gram/gram.IdP_admin@715798949107"
  }
}
