# Define repositories as a map
locals {
  repositories = {
    "api"         = {}
    "dbmigrate"  = {}
  }
}

# Create ECR repositories
resource "aws_ecr_repository" "repos" {
  for_each             = local.repositories
  name                 = each.key
  image_tag_mutability = "MUTABLE"
}

# Create ECR lifecycle policies for each repository
resource "aws_ecr_lifecycle_policy" "policies" {
  for_each = aws_ecr_repository.repos

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
