terraform {
  required_version = ">= 1.9.8"
  required_providers {
    aws = {
      source  = "hashicorp/aws"      
    }
  }
}

provider "aws" {
  region              = "eu-west-1"
  profile             = "iam-sync/gram/gram.IdP_admin@422554941857"
  allowed_account_ids = ["422554941857"]

  default_tags {
    tags = {
      SystemID = "gram"
      Team     = "Secure Development"
      OhPoliceNamespace = "gram"
    }
  }
}
