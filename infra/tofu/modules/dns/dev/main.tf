resource "aws_route53_zone" "primary" {
  name = var.domain
}

resource "aws_route53_record" "google_verification" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = ""
  type    = "TXT"
  ttl     = 300

  records        = ["google-site-verification=xyz"]
}
