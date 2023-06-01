data "aws_vpc" "klarna_vpc" {
  filter {
    name   = "tag:Name"
    values = ["oh-accounts-vpc-1"]
  }
}

data "aws_subnet_ids" "private_subnets" {
  vpc_id = data.aws_vpc.klarna_vpc.id
  filter {
    name   = "tag:Name"
    values = ["Private subnet 1A", "Private subnet 2A", "Private subnet 3A"]
  }
}

resource "aws_security_group" "postgres_allow_office" {
  name        = "postgres_allow_office"
  description = "Allow connections from offices and VPN"
  vpc_id      = data.aws_vpc.klarna_vpc.id

  tags = {
    SystemID = "gram"
    Team     = "Secure Development"
  }

  ingress {
    description = "ITOPS WiFi"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.3.210.0/24"]
  }
  ingress {
    description = "ITOPS VPN"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.4.128.0/24"]
  }
  ingress {
    description = "ITOPS Wired"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.3.10.0/24"]
  }
  ingress {
    description = "DevTech VPN"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.4.136.0/22"]
  }
  ingress {
    description = "GlobalProtect VPN"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.2.0.0/16"]
  }
}

resource "aws_security_group" "postgres_allow_gram_c2c" {
  name        = "postgres_allow_gram_c2c"
  description = "Allow connections from Gram C2C Staging EU"
  vpc_id      = data.aws_vpc.klarna_vpc.id

  ingress {
    description = "Allow access from Gram C2C Staging EU SG"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"

    # from grond service describe -n gram (eu-staging)
    security_groups = ["714393519345/sg-05d62166ca0a51064"]
  }

  tags = {
    SystemID          = "gram"
    Team              = "Secure Development"
    OhPoliceNamespace = "gram"
  }
}

resource "aws_security_group" "allow_to_gram_postgres" {
  name        = "allow_to_gram_postgres"
  description = "Allow connections to the Gram Postgres RDS"
  vpc_id      = data.aws_vpc.klarna_vpc.id

  tags = {
    SystemID          = "gram"
    Team              = "Secure Development"
    OhPoliceNamespace = "gram"
  }
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

  tags = {
    SystemID          = "gram"
    Team              = "Secure Development"
    OhPoliceNamespace = "gram"
  }
}
