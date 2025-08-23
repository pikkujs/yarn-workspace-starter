variable "secrets" {
  type = map(string)
  default = {
    tf_google_auth                  = "GOOGLE_OAUTH"
    tf_google_sheets_service_account = "GOOGLE_SHEETS_SERVICE_ACCOUNT"
    tf_openai_apikey                = "OPENAI_API_KEY"
  }
}