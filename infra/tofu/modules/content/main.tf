locals {
  bucket_name       = "content.${var.domain}"
  content_origin_id = "contentOrigin"
  app_type          = "Content"
}

resource "tls_private_key" "private_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "aws_cloudfront_public_key" "public_key" {
  comment     = "${var.name} Content Public Key"
  encoded_key = tls_private_key.private_key.public_key_pem
  name        = "${var.name}-content-public-key"
}

resource "aws_cloudfront_key_group" "key_group" {
  comment = "${var.name} Content Key Group"
  items   = [aws_cloudfront_public_key.public_key.id]
  name    = "${var.name}-content-key-group"
}

resource "aws_secretsmanager_secret" "cloudfront_sign_content" {
  name                    = "CLOUDFRONT_SIGN_CONTENT"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "cloudfront_sign_content_value" {
  secret_id     = aws_secretsmanager_secret.cloudfront_sign_content.id
  secret_string = jsonencode({
    id = aws_cloudfront_public_key.public_key.id
    pem = tls_private_key.private_key.private_key_pem
  })
}

resource "aws_s3_bucket" "content" {
  bucket = local.bucket_name
  acl    = "private"

  tags = {
    Name = local.app_type
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["https://${var.domain}", "https://localhost:8081"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# resource "aws_s3_bucket_policy" "put" {
#   bucket = aws_s3_bucket.content.id

#   policy = <<POLICY
# {
#   "Version": "2012-10-17",
#   "Statement": [
#     {
#       "Sid": "Allow-API-Access-To-Bucket",
#       "Effect": "Allow",
#       "Principal": {
#         "AWS": "*"
#       },
#       "Action": [
#         "s3:GetObject",
#         "s3:PutObject",       
#         "s3:DeleteObject"
#       ],
#       "Resource": "arn:aws:s3:::${local.bucket_name}/*"
#     },
#     {
#       "Sid": "Allow-OAI-Access-To-Bucket",
#       "Effect": "Allow",
#       "Principal": {
#         "AWS": "*"
#       },
#       "Action": [
#         "s3:GetObject"
#       ],
#       "Resource": "arn:aws:s3:::${local.bucket_name}/*"
#     }
#   ]
# }
# POLICY
# }

# resource "aws_iam_policy" "put_user_content" {
#   name = "tf-${var.domain}-usercontent"

#   policy = <<POLICY
# {
#   "Version": "2012-10-17",
#   "Statement": [
#     {
#       "Action": [
#         "s3:GetObject",
#         "s3:PutObject",
#         "s3:DeleteObject"
#       ],
#       "Effect": "Allow",
#       "Resource": [
#         "${aws_s3_bucket.content.arn}/*"
#       ]
#     }
#   ]
# }
# POLICY
# }

resource "aws_cloudfront_origin_access_control" "content" {
  name                              = "${var.name} content"
  description                       = "Content Policy"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.content.bucket_regional_domain_name
    origin_id   = local.content_origin_id
    origin_access_control_id =  aws_cloudfront_origin_access_control.content.id
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
    target_origin_id       = local.content_origin_id
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  ordered_cache_behavior {
    path_pattern           = "*/image/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = local.content_origin_id
    viewer_protocol_policy = "redirect-to-https"

    compress    = true

        forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  ordered_cache_behavior {
    path_pattern           = "*/narration/*"
    trusted_key_groups     = [
      aws_cloudfront_key_group.key_group.id,
    ]
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = local.content_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress    = true

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  ordered_cache_behavior {
    path_pattern           = "*/user/*"
    trusted_key_groups     = [
      aws_cloudfront_key_group.key_group.id,
    ]
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = local.content_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress    = true

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
}

data "aws_route53_zone" "main" {
  name         = var.domain
  private_zone = false
}

resource "aws_route53_record" "content" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "content"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

