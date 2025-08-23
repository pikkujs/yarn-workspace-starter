################################################################################
# Service
################################################################################

module "service_dbmigrate" {
  source = "terraform-aws-modules/ecs/aws//modules/service"

  # Service
  name        = "dbmigrate"
  cluster_arn = module.ecs_cluster.cluster_arn
  
  # Task Definition
  requires_compatibilities = ["EC2"]
  
  memory = 200
  cpu = 500

  enable_autoscaling = false
  autoscaling_max_capacity = 0

  network_mode = "awsvpc"
  
  capacity_provider_strategy = {
    # On-demand instances
    api = {
      capacity_provider = module.ecs_cluster.autoscaling_capacity_providers["micro"].name
      weight            = 1
      base              = 1
    }
  }

  # Container definition(s)
  container_definitions = {
    "dbmigrate" = {
      image = "${aws_ecr_repository.repos["dbmigrate"].repository_url}:latest"
      readonly_root_filesystem = false
    }
  }

  subnet_ids = var.vpc_private_subnets
  security_group_rules = {
    nat_http_ingress = {
      type                     = "ingress"
      from_port                = 80
      to_port                  = 80
      protocol                 = "tcp"
      description              = "Nat security group"
      source_security_group_id = var.nat_security_group_id
    }
    egress = {
      type                     = "egress"
      from_port                = 0
      to_port                  = 65535
      protocol                 = "tcp"
      description              = "Outgoing traffic"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  task_exec_secret_arns = [
    data.aws_secretsmanager_secret.tf_postgres_credentials.arn,
  ]

  tags = local.tags
}
