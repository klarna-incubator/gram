data "aws_vpc" "klarna_vpc" {
  filter {
    name   = "tag:Name"
    values = ["oh-accounts-vpc-1"]
  }
}

data "aws_subnets" "private_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.klarna_vpc.id]
  }

  filter {
    name   = "tag:Name"
    values = ["Private subnet 1A", "Private subnet 2A", "Private subnet 3A"]
  }
}

resource "aws_security_group" "postgres_allow_gram_c2c" {
  name        = "postgres_allow_gram_c2c"
  description = "Allow connections from Gram C2C Production EU"
  vpc_id      = data.aws_vpc.klarna_vpc.id

  ingress {
    description = "Allow access from Gram C2C Production EU SG"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"

    # from grond service describe -n gram (eu-production)
    security_groups = ["110009069329/sg-059880d98749150d6"]
  }

  tags = local.tags
}

resource "aws_security_group" "allow_to_gram_postgres" {
  name        = "allow_to_gram_postgres"
  description = "Allow connections to the Gram Postgres RDS"
  vpc_id      = data.aws_vpc.klarna_vpc.id

  tags = local.tags
}

resource "aws_security_group" "postgres_allow_from_sg" {
  name        = "postgres_allow_from_sg"
  description = "Allow connections from resources with the allow_to_gram_postgres sg"
  vpc_id      = data.aws_vpc.klarna_vpc.id

  ingress {
    description = "Allow postgres access"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"

    security_groups = [aws_security_group.allow_to_gram_postgres.id]
  }

  tags = local.tags
}

data "aws_ec2_managed_prefix_list" "bastion_prefix_list" {
  name = "bastion-eu-production"
}

resource "aws_security_group" "allow_from_bastion" {
  name        = "allow_from_bastion"
  description = "Allow connections from bastion"
  vpc_id      = data.aws_vpc.klarna_vpc.id

  ingress {
    description     = "Allow postgres access"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.bastion_prefix_list.id]
  }

  tags = local.tags
}