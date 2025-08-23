resource "aws_secretsmanager_secret" "this" {
  for_each = var.secrets

  name                    = each.value
  recovery_window_in_days = 0
}