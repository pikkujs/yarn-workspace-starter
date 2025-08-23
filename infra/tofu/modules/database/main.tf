resource "random_password" "master_password" {
  length            = 40
  special           = true
  min_special       = 5
  override_special  = "!#$%^&*()-_=+[]{}<>:?"
  keepers           = {
    pass_version  = 1
  }
}

resource "aws_secretsmanager_secret" "postgres_credentials" {
  name                    = "POSTGRES_CREDENTIALS"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id     = aws_secretsmanager_secret.postgres_credentials.id
  secret_string = <<EOF
{
  "user": "${module.database.db_instance_username}",
  "password": "${random_password.master_password.result}",
  "engine": "postgres",
  "database": "${module.database.db_instance_name}",
  "host": "${module.database.db_instance_address}",
  "port": ${module.database.db_instance_port}
}
EOF
}

module "database" {
  source = "terraform-aws-modules/rds/aws"

  identifier                     = "${var.db_name}-default"

  create_db_option_group    = false
  create_db_parameter_group = false
  create_monitoring_role = false

  # All available versions: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html#PostgreSQL.Concepts
  engine               = "postgres"
  engine_version       = "17"
  family               = "postgres17" # DB parameter group
  major_engine_version = "17"         # DB option group
  instance_class       = "db.t3.micro"

  allocated_storage = 20

  # NOTE: Do NOT use 'user' as the value for 'username' as it throws:
  # "Error creating DB Instance: InvalidParameterValue: MasterUsername
  # user cannot be used as it is a reserved word used by the engine"
  db_name  = var.db_name
  username = "postgres"
  manage_master_user_password = false
  password = random_password.master_password.result
  port     = 5432

  db_subnet_group_name   = var.database_subnet_group
  vpc_security_group_ids = [module.security_group.security_group_id]

  maintenance_window      = "Mon:00:00-Mon:03:00"
  backup_window           = "03:00-06:00"
  backup_retention_period = 0
}

module "security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "Postgres ${var.name} Security Group"
  description = "Complete PostgreSQL security group"
  vpc_id      = var.vpc_id

  # ingress
  ingress_with_cidr_blocks = [
    {
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      description = "PostgreSQL access from within VPC"
      cidr_blocks = var.vpc_cidr_block
    },
  ]
}