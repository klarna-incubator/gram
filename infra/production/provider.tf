terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region              = "eu-west-1"
  profile             = "iam-sync/gram/gram.IdP_admin@715798949107"
  allowed_account_ids = ["715798949107"]

  default_tags {
    tags = {
      SystemID = "gram"
      Team     = "Secure Development"
      OhPoliceNamespace = "gram"
    }
  }
}
