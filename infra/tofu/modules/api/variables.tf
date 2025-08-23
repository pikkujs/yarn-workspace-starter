locals {
  api_container_port = 4002
  api_container_name = "api"
  tags = {
    Repository = "https://github.com/terraform-aws-modules/terraform-aws-ecs"
  }
}

variable "domain" {
  type = string
}

variable "name" {
  type = string
}

variable "cert_arn" {
  
}

variable "vpc_id" {
  
}

variable "vpc_public_subnets" {
  
}

variable "vpc_private_subnets" {
  
}

variable "vpc_private_subnets_cidr_blocks" {
  
}

variable "nat_security_group_id" {
  
}