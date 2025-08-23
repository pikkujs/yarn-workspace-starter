################################################################################
# Service
################################################################################

module "service_api" {
  source = "terraform-aws-modules/ecs/aws//modules/service"

  # Service
  name        = "api"
  cluster_arn = module.ecs_cluster.cluster_arn

  # Task Definition
  requires_compatibilities = ["EC2"]
  
  memory = 500
  cpu = 1000

  enable_autoscaling = false
  autoscaling_max_capacity = 1

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
    "api" = {
      image = "${aws_ecr_repository.repos["api"].repository_url}:latest"

      port_mappings = [
        {
          name          = "api"
          containerPort = local.api_container_port
          protocol      = "tcp"
        }
      ]

      readonly_root_filesystem = false
    }
  }

  load_balancer = {
    service = {
      target_group_arn = module.alb.target_groups["api"].arn
      container_name   = "api"
      container_port   = local.api_container_port
    }
  }
  
  subnet_ids = var.vpc_private_subnets
  security_group_rules = {
    alb_http_ingress = {
      type                     = "ingress"
      from_port                = local.api_container_port
      to_port                  = local.api_container_port
      protocol                 = "tcp"
      description              = "Service port"
      source_security_group_id = module.alb.security_group_id
    }
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
    data.aws_secretsmanager_secret.tf_cloudfront_sign_content.arn,
    # data.aws_secretsmanager_secret.tf_sendgrid_apikey.arn,
    data.aws_secretsmanager_secret.tf_google_auth.arn,
    data.aws_secretsmanager_secret.tf_openai_apikey.arn,
    data.aws_secretsmanager_secret.tf_google_sheets_service_account.arn,
  ]

  tags = local.tags
}
