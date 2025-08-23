locals {
  app_name = "pikku-workspace"
  domain = "pikku-workspace.app"
  name = "pikku"
  region = "us-east-1"
}

provider "aws" {
  region  = "us-east-1"
  max_retries = 0
}

terraform {
  backend "s3" {
    bucket  = "pikku-workspace-terraform-state"
    key     = "pikku-workspace-prod.tfstate"
    region = "us-east-1"
  }
}

module "dns" {
  source = "../../modules/dns/prod"
  domain = local.domain
}

# Everything under here is the same as qa

module "secrets" {
  source = "../../modules/secrets"
}

resource "aws_acm_certificate" "cert" {
  domain_name       = local.dotusemain
  validation_method = "DNS"
  subject_alternative_names = ["*.${local.domain}"]
  lifecycle {
    create_before_destroy = true
  }
}

module "content" {
  source = "../../modules/content"
  domain = local.domain
  name = local.name
  cert_arn = aws_acm_certificate.cert.arn
}

module "app" {
  source = "../../modules/app"
  domain = local.domain
  cert_arn = aws_acm_certificate.cert.arn
}

# VPC SPECIFIC

module "vpc" {
  source = "../../modules/vpc"
}

module "database" {
  source = "../../modules/database"
  name = local.name
  db_name = local.name
  vpc_id = module.vpc.vpc_id
  vpc_cidr_block = module.vpc.vpc_cidr_block
  database_subnet_group = module.vpc.database_subnet_group
}

module "api" {
  source = "../../modules/api"
  depends_on = [module.database]

  domain = local.domain
  name = local.name

  vpc_id = module.vpc.vpc_id
  vpc_public_subnets = module.vpc.public_subnets
  vpc_private_subnets = module.vpc.private_subnets
  vpc_private_subnets_cidr_blocks = module.vpc.private_subnets_cidr_blocks

  cert_arn = aws_acm_certificate.cert.arn
  nat_security_group_id = module.vpc.nat_security_group_id
}
