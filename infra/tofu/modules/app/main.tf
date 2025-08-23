locals {
  bucket_name       = var.domain
  origin_id = "appOrigin"
  app_type          = "App"
}

resource "aws_cloudfront_origin_access_control" "app" {
  name                              = "app"
  description                       = "App Policy"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_s3_bucket" "app" {
  bucket = local.bucket_name
  acl    = "private"

  tags = {
    Name = local.app_type
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["https://app.${var.domain}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

module "append_index" {
  source             = "Lupus-Metallum/cloudfront-add-index/aws"
  version            = "1.0.0"
  name               = "append_index_html"
  description        = "Adds index.html to end of file"
}

resource "aws_cloudfront_distribution" "app" {
  origin {
    domain_name = aws_s3_bucket.app.bucket_regional_domain_name
    origin_id   = local.origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.app.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = local.app_type
  default_root_object = "index.html"

  aliases = [local.bucket_name]

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.origin_id
    viewer_protocol_policy = "redirect-to-https"

    function_association {
      event_type   = "viewer-request"
      function_arn = module.append_index.arn
    }

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn = var.cert_arn
    ssl_support_method  = "sni-only"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
}

data "aws_route53_zone" "main" {
  name         = var.domain
  private_zone = false
}

resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.app.domain_name
    zone_id                = aws_cloudfront_distribution.app.hosted_zone_id
    evaluate_target_health = false
  }
}
