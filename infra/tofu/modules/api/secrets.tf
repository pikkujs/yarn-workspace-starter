################################################################################
# Secrets
################################################################################

data "aws_secretsmanager_secret" "tf_postgres_credentials" {
  name = "POSTGRES_CREDENTIALS"
}

# data "aws_secretsmanager_secret" "tf_sendgrid_apikey" {
#   name = "SENDGRID_API_KEY"
# }

data "aws_secretsmanager_secret" "tf_google_auth" {
  name = "GOOGLE_OAUTH"
}

data "aws_secretsmanager_secret" "tf_google_sheets_service_account" {
  name = "GOOGLE_SHEETS_SERVICE_ACCOUNT"
}

data "aws_secretsmanager_secret" "tf_openai_apikey" {
  name = "OPENAI_API_KEY"
}

data "aws_secretsmanager_secret" "tf_cloudfront_sign_content" {
  name                    = "CLOUDFRONT_SIGN_CONTENT"
}
