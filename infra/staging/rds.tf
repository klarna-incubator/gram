# resource "random_password" "initial_password" {
#   length           = 40
#   special          = true
#   min_special      = 5
#   override_special = "!#$%^&*()-_=+[]{}<>:?"
#   keepers = {
#     pass_version = 1
#   }
# }

resource "aws_db_subnet_group" "default" {
  name       = "main"
  subnet_ids = data.aws_subnets.private_subnets.ids

  tags = local.tags
}

resource "aws_rds_cluster" "encrypted_db_cluster" {
  cluster_identifier                  = "gram-staging-database-cluster"
  engine                              = "aurora-postgresql"
  engine_version                      = "16.1"
  
  availability_zones                  = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  database_name                       = "gram"
  backup_retention_period             = 30
  preferred_backup_window             = "05:01-05:31"
  vpc_security_group_ids              = [aws_security_group.postgres_allow_gram_c2c.id, aws_security_group.postgres_allow_from_sg.id, aws_security_group.allow_from_bastion.id]
  iam_database_authentication_enabled = true
  
  copy_tags_to_snapshot               = true
  skip_final_snapshot                 = false

  # db_cluster_parameter_group_name = "default.aurora-postgresql16"  
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.rds_parameter_group.name
  
  tags = merge(local.tags, {    
    "kep:kbsd:enableDisasterRecoveryBackup" = "false"
  })
  
  deletion_protection                 = true
  apply_immediately = false
  allow_major_version_upgrade = false
}

resource "aws_db_instance" "encrypted_db" {
  allocated_storage = 20
  storage_type      = "aurora"
  engine            = "aurora-postgresql"
  instance_class    = "db.t4g.medium"

  username          = "gram"
  # password                = random_password.initial_password.result
  parameter_group_name                = "default.aurora-postgresql16"
  db_subnet_group_name                = aws_db_subnet_group.default.id
  identifier                          = "gram-staging-database"
  
  iam_database_authentication_enabled = true  
  copy_tags_to_snapshot               = true
  storage_encrypted                   = true
  skip_final_snapshot                 = false
  deletion_protection = false

  tags = {    
    SystemID          = "gram"
    Team              = "Secure Development"
    OhPoliceNamespace = "gram"    
  }  
}

resource "aws_rds_cluster_parameter_group" "rds_parameter_group" {  
  name     = "gram-db-param-pg16-group"
  family   = "aurora-postgresql16"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  tags = local.tags 
}

# output "initial_password" {
#   value = random_password.initial_password.result
# }

output "db_endpoint" {
  value = aws_db_instance.encrypted_db.endpoint
}
